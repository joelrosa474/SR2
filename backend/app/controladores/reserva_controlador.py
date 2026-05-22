from datetime import datetime
from pathlib import Path
import shutil
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.configuracoes.banco_dados import obter_db
from app.modelos import modelos
from app.esquemas import esquemas
from app.seguranca import autenticacao
from app.servicos.servico_reserva import ServicoReserva
from app.repositorios.repositorio_reserva import RepositorioReserva

router = APIRouter(prefix="/reservas", tags=["Reservas"])
PASTA_COMPROVATIVOS = Path("uploads/comprovativos")
EXTENSOES_PERMITIDAS = {".pdf", ".png", ".jpg", ".jpeg"}


def guardar_comprovativo(comprovativo: Optional[UploadFile]):
    if not comprovativo or not comprovativo.filename:
        return None

    extensao = Path(comprovativo.filename).suffix.lower()
    if extensao not in EXTENSOES_PERMITIDAS:
        raise HTTPException(status_code=400, detail="Comprovativo deve ser PDF, PNG ou JPG")

    PASTA_COMPROVATIVOS.mkdir(parents=True, exist_ok=True)
    nome_ficheiro = f"{uuid.uuid4().hex}{extensao}"
    destino = PASTA_COMPROVATIVOS / nome_ficheiro
    with destino.open("wb") as buffer:
        shutil.copyfileobj(comprovativo.file, buffer)

    return {"path": str(destino), "nome": comprovativo.filename}

@router.post("/", response_model=esquemas.Reserva)
def realizar_reserva(
    reserva: esquemas.ReservaCriar, 
    db: Session = Depends(obter_db),
    usuario_atual: modelos.Usuario = Depends(autenticacao.obter_usuario_atual)
):
    servico = ServicoReserva(db)
    return servico.realizar_reserva(reserva, usuario_atual.id)


@router.post("/com-comprovativo", response_model=esquemas.Reserva)
def realizar_reserva_com_comprovativo(
    quarto_id: int = Form(...),
    data_entrada: datetime = Form(...),
    data_saida: datetime = Form(...),
    nome_cliente: str = Form(...),
    email_cliente: str = Form(...),
    telefone_cliente: str = Form(...),
    metodo_pagamento: str = Form(...),
    codigo_reserva: Optional[str] = Form(None),
    comprovativo: Optional[UploadFile] = File(None),
    db: Session = Depends(obter_db),
    usuario_atual: modelos.Usuario = Depends(autenticacao.obter_usuario_atual),
):
    arquivo = guardar_comprovativo(comprovativo)
    reserva = esquemas.ReservaCriar(
        quarto_id=quarto_id,
        data_entrada=data_entrada,
        data_saida=data_saida,
        nome_cliente=nome_cliente,
        email_cliente=email_cliente,
        telefone_cliente=telefone_cliente,
        metodo_pagamento=metodo_pagamento,
        codigo_reserva=codigo_reserva,
    )
    servico = ServicoReserva(db)
    return servico.realizar_reserva(reserva, usuario_atual.id, arquivo)

@router.get("/", response_model=List[esquemas.Reserva])
def listar_reservas(
    db: Session = Depends(obter_db),
    usuario: modelos.Usuario = Depends(autenticacao.verificar_funcionario)
):
    ServicoReserva(db).expirar_reservas_pendentes()
    repo = RepositorioReserva(db)
    return repo.listar_todas()

@router.get("/minhas", response_model=List[esquemas.Reserva])
def listar_minhas_reservas(
    db: Session = Depends(obter_db),
    usuario_atual: modelos.Usuario = Depends(autenticacao.obter_usuario_atual)
):
    ServicoReserva(db).expirar_reservas_pendentes()
    repo = RepositorioReserva(db)
    return repo.listar_por_cliente(usuario_atual.id)


@router.get("/{reserva_id}/comprovativo")
def baixar_comprovativo(
    reserva_id: int,
    db: Session = Depends(obter_db),
    usuario: modelos.Usuario = Depends(autenticacao.verificar_funcionario),
):
    reserva = RepositorioReserva(db).obter_por_id(reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva nao encontrada")
    if not reserva.comprovativo_path or not Path(reserva.comprovativo_path).exists():
        raise HTTPException(status_code=404, detail="Comprovativo nao encontrado")

    return FileResponse(
        reserva.comprovativo_path,
        filename=reserva.comprovativo_nome or f"comprovativo-{reserva.codigo_reserva}",
    )

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
