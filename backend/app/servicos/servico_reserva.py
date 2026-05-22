from datetime import datetime, timedelta
import secrets
import string

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.esquemas import esquemas
from app.modelos import modelos
from app.repositorios.repositorio_quarto import RepositorioQuarto
from app.repositorios.repositorio_reserva import RepositorioReserva


class ServicoReserva:
    def __init__(self, db: Session):
        self.db = db
        self.repo_reserva = RepositorioReserva(db)
        self.repo_quarto = RepositorioQuarto(db)

    def expirar_reservas_pendentes(self):
        agora = datetime.utcnow()
        reservas = self.db.query(modelos.Reserva).filter(
            modelos.Reserva.status == "pendente",
            modelos.Reserva.comprovativo_path.is_(None),
            modelos.Reserva.expira_em.isnot(None),
            modelos.Reserva.expira_em < agora,
        ).all()

        for reserva in reservas:
            reserva.status = "expirada"
            reserva.pagamento_status = "expirado"
            if reserva.quarto and reserva.quarto.status == "ocupado":
                reserva.quarto.status = "disponivel"

        if reservas:
            self.db.commit()

    def gerar_codigo_reserva(self):
        caracteres = string.ascii_uppercase + string.digits
        while True:
            codigo = "".join(secrets.choice(caracteres) for _ in range(8))
            if not self.repo_reserva.obter_por_codigo(codigo):
                return codigo

    def realizar_reserva(self, reserva_dados: esquemas.ReservaCriar, cliente_id: int, comprovativo=None):
        self.expirar_reservas_pendentes()

        quarto = self.repo_quarto.obter_por_id(reserva_dados.quarto_id)
        if not quarto:
            raise HTTPException(status_code=404, detail="Quarto nao encontrado")

        if quarto.status == "manutencao":
            raise HTTPException(status_code=400, detail="Quarto em manutencao")

        if reserva_dados.data_entrada >= reserva_dados.data_saida:
            raise HTTPException(status_code=400, detail="Data de saida deve ser apos a data de entrada")

        disponivel = self.repo_reserva.verificar_disponibilidade(
            reserva_dados.quarto_id,
            reserva_dados.data_entrada,
            reserva_dados.data_saida,
        )
        if not disponivel:
            raise HTTPException(status_code=400, detail="Quarto ja reservado para este periodo")

        quantidade_dias = (reserva_dados.data_saida.date() - reserva_dados.data_entrada.date()).days
        quantidade_dias = max(quantidade_dias, 1)

        codigo_reserva = reserva_dados.codigo_reserva
        if not codigo_reserva or len(codigo_reserva) != 8 or not codigo_reserva.isalnum():
            codigo_reserva = self.gerar_codigo_reserva()
        elif self.repo_reserva.obter_por_codigo(codigo_reserva.upper()):
            codigo_reserva = self.gerar_codigo_reserva()

        agora = datetime.utcnow()
        dados = reserva_dados.dict()
        dados.pop("codigo_reserva", None)

        nova_reserva = modelos.Reserva(
            **dados,
            cliente_id=cliente_id,
            codigo_reserva=codigo_reserva.upper(),
            tipo_diaria="Diaria completa",
            valor_diaria=quarto.preco,
            quantidade_dias=quantidade_dias,
            total_pagar=quarto.preco * quantidade_dias,
            comprovativo_path=comprovativo.get("path") if comprovativo else None,
            comprovativo_nome=comprovativo.get("nome") if comprovativo else None,
            pagamento_status="pendente",
            criado_em=agora,
            expira_em=agora + timedelta(hours=5),
            status="pendente",
        )
        return self.repo_reserva.criar(nova_reserva)

    def atualizar_status(self, reserva_id: int, novo_status: str):
        self.expirar_reservas_pendentes()
        status_permitidos = ["pendente", "confirmada", "cancelada", "concluida", "expirada"]
        if novo_status not in status_permitidos:
            raise HTTPException(status_code=400, detail="Status de reserva invalido")

        reserva = self.repo_reserva.obter_por_id(reserva_id)
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva nao encontrada")

        if novo_status == "confirmada" and not reserva.comprovativo_path:
            raise HTTPException(status_code=400, detail="A reserva ainda nao possui comprovativo")

        reserva.status = novo_status

        if novo_status == "confirmada":
            reserva.pagamento_status = "aprovado"
            reserva.quarto.status = "ocupado"
        elif novo_status in ["cancelada", "concluida", "expirada"]:
            if novo_status == "cancelada":
                reserva.pagamento_status = "rejeitado"
            if novo_status == "expirada":
                reserva.pagamento_status = "expirado"
            reserva.quarto.status = "disponivel"

        return self.repo_reserva.criar(reserva)

    def cancelar_reserva(self, reserva_id: int, usuario_atual: modelos.Usuario):
        self.expirar_reservas_pendentes()
        reserva = self.repo_reserva.obter_por_id(reserva_id)
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva nao encontrada")

        if usuario_atual.tipo == "cliente" and reserva.cliente_id != usuario_atual.id:
            raise HTTPException(status_code=403, detail="Voce nao tem permissao para cancelar esta reserva")

        if reserva.status in ["cancelada", "concluida", "expirada"]:
            raise HTTPException(status_code=400, detail=f"Reserva ja esta {reserva.status}")

        reserva.status = "cancelada"
        reserva.pagamento_status = "rejeitado"
        reserva.quarto.status = "disponivel"
        return self.repo_reserva.criar(reserva)

    def obter_reserva(self, reserva_id: int, usuario_atual: modelos.Usuario):
        self.expirar_reservas_pendentes()
        reserva = self.repo_reserva.obter_por_id(reserva_id)
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva nao encontrada")

        if usuario_atual.tipo == "cliente" and reserva.cliente_id != usuario_atual.id:
            raise HTTPException(status_code=403, detail="Voce nao tem permissao para visualizar esta reserva")

        return reserva
