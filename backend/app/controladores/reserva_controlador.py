from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.configuracoes.banco_dados import obter_db
from app.modelos import modelos
from app.esquemas import esquemas
from app.seguranca import autenticacao
from app.servicos.servico_reserva import ServicoReserva
from app.repositorios.repositorio_reserva import RepositorioReserva

router = APIRouter(prefix="/reservas", tags=["Reservas"])

@router.post("/", response_model=esquemas.Reserva)
def realizar_reserva(
    reserva: esquemas.ReservaCriar, 
    db: Session = Depends(obter_db),
    usuario_atual: modelos.Usuario = Depends(autenticacao.obter_usuario_atual)
):
    servico = ServicoReserva(db)
    return servico.realizar_reserva(reserva, usuario_atual.id)

@router.get("/", response_model=List[esquemas.Reserva])
def listar_reservas(
    db: Session = Depends(obter_db),
    usuario: modelos.Usuario = Depends(autenticacao.verificar_funcionario)
):
    repo = RepositorioReserva(db)
    return repo.listar_todas()

@router.get("/minhas", response_model=List[esquemas.Reserva])
def listar_minhas_reservas(
    db: Session = Depends(obter_db),
    usuario_atual: modelos.Usuario = Depends(autenticacao.obter_usuario_atual)
):
    repo = RepositorioReserva(db)
    return repo.listar_por_cliente(usuario_atual.id)

@router.get("/{reserva_id}", response_model=esquemas.Reserva)
def obter_reserva(
    reserva_id: int, 
    db: Session = Depends(obter_db),
    usuario_atual: modelos.Usuario = Depends(autenticacao.obter_usuario_atual)
):
    servico = ServicoReserva(db)
    return servico.obter_reserva(reserva_id, usuario_atual)

@router.delete("/{reserva_id}", response_model=esquemas.Reserva)
def cancelar_reserva(
    reserva_id: int, 
    db: Session = Depends(obter_db),
    usuario_atual: modelos.Usuario = Depends(autenticacao.obter_usuario_atual)
):
    servico = ServicoReserva(db)
    return servico.cancelar_reserva(reserva_id, usuario_atual)

@router.patch("/{reserva_id}/status", response_model=esquemas.Reserva)
def atualizar_status_reserva(
    reserva_id: int, 
    novo_status: str, 
    db: Session = Depends(obter_db),
    usuario: modelos.Usuario = Depends(autenticacao.verificar_funcionario)
):
    servico = ServicoReserva(db)
    return servico.atualizar_status(reserva_id, novo_status)
