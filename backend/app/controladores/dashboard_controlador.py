from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.configuracoes.banco_dados import obter_db
from app.modelos import modelos
from app.seguranca import autenticacao
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/")
def obter_estatisticas(
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_funcionario)
):
    # Estatísticas de Quartos
    total_quartos = db.query(modelos.Quarto).count()
    quartos_ocupados = db.query(modelos.Quarto).filter(modelos.Quarto.status == "ocupado").count()
    quartos_disponiveis = db.query(modelos.Quarto).filter(modelos.Quarto.status == "disponivel").count()
    
    # Estatísticas de Reservas
    total_reservas = db.query(modelos.Reserva).count()
    reservas_hoje = db.query(modelos.Reserva).filter(
        func.date(modelos.Reserva.data_entrada) == datetime.now().date()
    ).count()
    
    # Faturamento (Soma dos preços dos quartos reservados que estão confirmados ou concluidos)
    faturamento_total = db.query(func.sum(modelos.Quarto.preco)).join(
        modelos.Reserva, modelos.Quarto.id == modelos.Reserva.quarto_id
    ).filter(
        modelos.Reserva.status.in_(["confirmada", "concluida"])
    ).scalar() or 0.0

    # Próximas reservas (as 5 mais recentes)
    proximas_reservas = db.query(modelos.Reserva).order_by(
        modelos.Reserva.data_entrada.asc()
    ).filter(
        modelos.Reserva.data_entrada >= datetime.now()
    ).limit(5).all()

    return {
        "estatisticas": {
            "total_quartos": total_quartos,
            "quartos_ocupados": quartos_ocupados,
            "quartos_disponiveis": quartos_disponiveis,
            "taxa_ocupacao": (quartos_ocupados / total_quartos * 100) if total_quartos > 0 else 0,
            "total_reservas": total_reservas,
            "reservas_hoje": reservas_hoje,
            "faturamento_total": faturamento_total
        },
        "proximas_reservas": proximas_reservas
    }
