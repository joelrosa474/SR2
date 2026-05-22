from sqlalchemy.orm import Session
from app.modelos.modelos import Reserva
from datetime import datetime

class RepositorioReserva:
    def __init__(self, db: Session):
        self.db = db

    def obter_por_id(self, reserva_id: int):
        return self.db.query(Reserva).filter(Reserva.id == reserva_id).first()

    def obter_por_codigo(self, codigo_reserva: str):
        return self.db.query(Reserva).filter(Reserva.codigo_reserva == codigo_reserva).first()

    def listar_todas(self):
        return self.db.query(Reserva).order_by(Reserva.criado_em.desc()).all()

    def listar_por_cliente(self, cliente_id: int):
        return self.db.query(Reserva).filter(Reserva.cliente_id == cliente_id).order_by(Reserva.criado_em.desc()).all()

    def criar(self, reserva: Reserva):
        self.db.add(reserva)
        self.db.commit()
        self.db.refresh(reserva)
        return reserva

    def verificar_disponibilidade(self, quarto_id: int, entrada: datetime, saida: datetime):
        # Verifica se existe alguma reserva confirmada ou pendente para o mesmo quarto no mesmo período
        conflitos = self.db.query(Reserva).filter(
            Reserva.quarto_id == quarto_id,
            Reserva.status.in_(["pendente", "confirmada"]),
            Reserva.data_entrada < saida,
            Reserva.data_saida > entrada
        ).count()
        return conflitos == 0
