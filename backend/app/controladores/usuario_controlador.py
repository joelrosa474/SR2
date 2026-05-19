from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.configuracoes.banco_dados import obter_db
from app.modelos import modelos
from app.esquemas import esquemas
from app.seguranca import autenticacao
from app.repositorios.repositorio_usuario import RepositorioUsuario

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

@router.get("/me", response_model=esquemas.Usuario)
def obter_meu_perfil(usuario_atual: modelos.Usuario = Depends(autenticacao.obter_usuario_atual)):
    return usuario_atual

@router.post("/", response_model=esquemas.Usuario)
def criar_usuario(
    usuario: esquemas.UsuarioCriar, 
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    repo = RepositorioUsuario(db)
    usuario_existente = repo.obter_por_email(usuario.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    novo_usuario = modelos.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=autenticacao.obter_senha_hash(usuario.senha),
        telefone=usuario.telefone,
        tipo=usuario.tipo,
        cargo=usuario.cargo,
        status=usuario.status
    )
    return repo.criar(novo_usuario)

@router.get("/", response_model=List[esquemas.Usuario])
def listar_usuarios(
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    repo = RepositorioUsuario(db)
    return repo.listar_todos()

@router.get("/{usuario_id}", response_model=esquemas.Usuario)
def obter_usuario(
    usuario_id: int, 
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    repo = RepositorioUsuario(db)
    usuario = repo.obter_id(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario

@router.delete("/{usuario_id}")
def remover_usuario(
    usuario_id: int, 
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    repo = RepositorioUsuario(db)
    usuario = repo.obter_por_id(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    repo.remover(usuario)
    return {"mensagem": "Usuário removido com sucesso"}

@router.put("/{usuario_id}", response_model=esquemas.Usuario)
def atualizar_usuario(
    usuario_id: int, 
    usuario_dados: esquemas.UsuarioAtualizar, 
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    repo = RepositorioUsuario(db)
    usuario = repo.obter_por_id(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    dados = usuario_dados.dict(exclude_unset=True)
    if "senha" in dados:
        dados["senha_hash"] = autenticacao.obter_senha_hash(dados.pop("senha"))
        
    return repo.atualizar(usuario, dados)

@router.patch("/me", response_model=esquemas.Usuario)
def atualizar_meu_perfil(
    usuario_dados: esquemas.UsuarioAtualizar, 
    db: Session = Depends(obter_db),
    usuario_atual: modelos.Usuario = Depends(autenticacao.obter_usuario_atual)
):
    repo = RepositorioUsuario(db)
    
    # Usuário comum não pode mudar seu próprio tipo ou status
    dados = usuario_dados.dict(exclude_unset=True)
    if usuario_atual.tipo != "administrador":
        dados.pop("tipo", None)
        dados.pop("status", None)
        dados.pop("cargo", None)

    if "senha" in dados:
        dados["senha_hash"] = autenticacao.obter_senha_hash(dados.pop("senha"))
        
    return repo.atualizar(usuario_atual, dados)
