from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyCookie, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.configuracoes import seguranca
from app.configuracoes.banco_dados import obter_db
from app.esquemas import esquemas
from app.modelos import modelos


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)
cookie_scheme = APIKeyCookie(name=seguranca.COOKIE_NOME, auto_error=False)
ACCESS_TOKEN_EXPIRE_MINUTES = seguranca.ACCESS_TOKEN_EXPIRE_MINUTES


def verificar_senha(senha_plana, senha_hash):
    return pwd_context.verify(senha_plana, senha_hash)


def obter_senha_hash(senha):
    return pwd_context.hash(senha)


def criar_token_acesso(dados: dict, expires_delta: Optional[timedelta] = None):
    para_codificar = dados.copy()
    expiracao = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    para_codificar.update({"exp": expiracao})
    return jwt.encode(para_codificar, seguranca.SECRET_KEY, algorithm=seguranca.ALGORITHM)


async def obter_usuario_atual(
    token_bearer: Optional[str] = Depends(oauth2_scheme),
    token_cookie: Optional[str] = Depends(cookie_scheme),
    db: Session = Depends(obter_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao foi possivel validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = token_bearer or token_cookie
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, seguranca.SECRET_KEY, algorithms=[seguranca.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = esquemas.TokenDados(email=email)
    except JWTError:
        raise credentials_exception

    usuario = db.query(modelos.Usuario).filter(modelos.Usuario.email == token_data.email).first()
    if usuario is None:
        raise credentials_exception
    if usuario.status != "ativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inativo",
        )
    return usuario


def verificar_admin(usuario_atual: modelos.Usuario = Depends(obter_usuario_atual)):
    if usuario_atual.tipo != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: apenas administradores podem realizar esta acao",
        )
    return usuario_atual


def verificar_funcionario(usuario_atual: modelos.Usuario = Depends(obter_usuario_atual)):
    if usuario_atual.tipo not in ["administrador", "funcionario"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: apenas funcionarios ou administradores podem realizar esta acao",
        )
    return usuario_atual
