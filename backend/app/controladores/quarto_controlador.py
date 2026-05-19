from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.configuracoes.banco_dados import obter_db
from app.modelos import modelos
from app.esquemas import esquemas
from app.seguranca import autenticacao
from app.repositorios.repositorio_quarto import RepositorioQuarto

router = APIRouter(prefix="/quartos", tags=["Quartos"])

@router.post("/", response_model=esquemas.Quarto)
def criar_quarto(
    quarto: esquemas.QuartoCriar, 
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    repo = RepositorioQuarto(db)
    novo_quarto = modelos.Quarto(**quarto.dict())
    return repo.criar(novo_quarto)

@router.get("/", response_model=List[esquemas.Quarto])
def listar_quartos(
    tipo: Optional[str] = None,
    preco_min: Optional[float] = None,
    preco_max: Optional[float] = None,
    status: Optional[str] = None,
    db: Session = Depends(obter_db)
):
    query = db.query(modelos.Quarto)
    
    if tipo:
        query = query.filter(modelos.Quarto.tipo == tipo)
    if preco_min is not None:
        query = query.filter(modelos.Quarto.preco >= preco_min)
    if preco_max is not None:
        query = query.filter(modelos.Quarto.preco <= preco_max)
    if status:
        query = query.filter(modelos.Quarto.status == status)
        
    return query.all()

@router.get("/disponiveis", response_model=List[esquemas.Quarto])
def listar_quartos_disponiveis(
    data_entrada: datetime,
    data_saida: datetime,
    db: Session = Depends(obter_db)
):
    if data_entrada >= data_saida:
        raise HTTPException(status_code=400, detail="Data de saída deve ser após a data de entrada")

    # Subquery para encontrar IDs de quartos reservados no período
    subquery = db.query(modelos.Reserva.quarto_id).filter(
        modelos.Reserva.status.in_(["pendente", "confirmada"]),
        modelos.Reserva.data_entrada < data_saida,
        modelos.Reserva.data_saida > data_entrada
    )

    # Buscar quartos que NÃO estão na subquery e estão com status 'disponivel'
    quartos = db.query(modelos.Quarto).filter(
        modelos.Quarto.status == "disponivel",
        ~modelos.Quarto.id.in_(subquery)
    ).all()
    
    return quartos

@router.get("/{quarto_id}", response_model=esquemas.Quarto)
def obter_quarto(quarto_id: int, db: Session = Depends(obter_db)):
    repo = RepositorioQuarto(db)
    quarto = repo.obter_por_id(quarto_id)
    if not quarto:
        raise HTTPException(status_code=404, detail="Quarto não encontrado")
    return quarto

@router.delete("/{quarto_id}")
def remover_quarto(
    quarto_id: int, 
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    repo = RepositorioQuarto(db)
    quarto = repo.obter_por_id(quarto_id)
    if not quarto:
        raise HTTPException(status_code=404, detail="Quarto não encontrado")
    
    repo.remover(quarto)
    return {"mensagem": "Quarto removido com sucesso"}

@router.put("/{quarto_id}", response_model=esquemas.Quarto)
def atualizar_quarto(
    quarto_id: int, 
    quarto_dados: esquemas.QuartoAtualizar, 
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    repo = RepositorioQuarto(db)
    quarto = repo.obter_por_id(quarto_id)
    if not quarto:
        raise HTTPException(status_code=404, detail="Quarto não encontrado")
    
    return repo.atualizar(quarto, quarto_dados.dict(exclude_unset=True))
