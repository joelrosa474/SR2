from datetime import datetime, timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.configuracoes import seguranca
from app.configuracoes.banco_dados import obter_db
from app.esquemas import esquemas
from app.modelos import modelos
from app.seguranca import autenticacao


router = APIRouter(tags=["Autenticacao"])
LOGIN_TENTATIVAS = {}
MAX_TENTATIVAS_LOGIN = 5
BLOQUEIO_LOGIN = timedelta(minutes=15)


def _chave_tentativa_login(request: Request, email: str) -> str:
    cliente = request.client.host if request.client else "desconhecido"
    return f"{cliente}:{email.lower()}"


def _verificar_limite_login(chave: str):
    registro = LOGIN_TENTATIVAS.get(chave)
    if not registro:
        return

    agora = datetime.utcnow()
    if registro["bloqueado_ate"] and registro["bloqueado_ate"] > agora:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de login. Tente novamente mais tarde.",
        )
    if registro["bloqueado_ate"] and registro["bloqueado_ate"] <= agora:
        LOGIN_TENTATIVAS.pop(chave, None)


def _registrar_falha_login(chave: str):
    agora = datetime.utcnow()
    registro = LOGIN_TENTATIVAS.setdefault(chave, {"tentativas": 0, "bloqueado_ate": None})
    registro["tentativas"] += 1
    if registro["tentativas"] >= MAX_TENTATIVAS_LOGIN:
        registro["bloqueado_ate"] = agora + BLOQUEIO_LOGIN


@router.get("/sessao")
def obter_sessao(
    access_token: str | None = Cookie(default=None, alias=seguranca.COOKIE_NOME),
    db: Session = Depends(obter_db),
):
    if not access_token:
        return {"autenticado": False, "usuario": None}

    try:
        payload = jwt.decode(access_token, seguranca.SECRET_KEY, algorithms=[seguranca.ALGORITHM])
        email = payload.get("sub")
        if not email:
            return {"autenticado": False, "usuario": None}
    except JWTError:
        return {"autenticado": False, "usuario": None}

    usuario = db.query(modelos.Usuario).filter(modelos.Usuario.email == email).first()
    if not usuario or usuario.status != "ativo":
        return {"autenticado": False, "usuario": None}

    return {
        "autenticado": True,
        "usuario": {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email,
            "telefone": usuario.telefone,
            "tipo": usuario.tipo,
            "cargo": usuario.cargo,
            "status": usuario.status,
        },
    }


@router.post("/token", response_model=esquemas.Token)
async def login_para_token_acesso(
    request: Request,
    response: Response,
    db: Session = Depends(obter_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    chave_login = _chave_tentativa_login(request, form_data.username)
    _verificar_limite_login(chave_login)

    usuario = db.query(modelos.Usuario).filter(modelos.Usuario.email == form_data.username).first()
    if not usuario or not autenticacao.verificar_senha(form_data.password, usuario.senha_hash):
        _registrar_falha_login(chave_login)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if usuario.status != "ativo":
        _registrar_falha_login(chave_login)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inativo",
        )

    expires_delta = timedelta(minutes=autenticacao.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = autenticacao.criar_token_acesso(
        dados={"sub": usuario.email, "tipo": usuario.tipo},
        expires_delta=expires_delta,
    )
    response.set_cookie(
        key=seguranca.COOKIE_NOME,
        value=access_token,
        httponly=True,
        secure=seguranca.COOKIE_SECURE,
        samesite=seguranca.COOKIE_SAMESITE,
        max_age=autenticacao.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    LOGIN_TENTATIVAS.pop(chave_login, None)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=seguranca.COOKIE_NOME,
        httponly=True,
        secure=seguranca.COOKIE_SECURE,
        samesite=seguranca.COOKIE_SAMESITE,
    )
    return {"mensagem": "Sessao terminada"}


@router.post("/registrar", response_model=esquemas.Usuario)
def registrar_usuario(usuario: esquemas.UsuarioCriar, db: Session = Depends(obter_db)):
    usuario_existente = db.query(modelos.Usuario).filter(modelos.Usuario.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Email ja cadastrado")

    novo_usuario = modelos.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=autenticacao.obter_senha_hash(usuario.senha),
        telefone=usuario.telefone,
        tipo="cliente",
        cargo=None,
        status="ativo",
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario
