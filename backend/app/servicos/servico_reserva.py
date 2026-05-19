from sqlalchemy.orm import Session
from app.repositorios.repositorio_reserva import RepositorioReserva
from app.repositorios.repositorio_quarto import RepositorioQuarto
from app.modelos import modelos
from app.esquemas import esquemas
from fastapi import HTTPException

class ServicoReserva:
    def __init__(self, db: Session):
        self.repo_reserva = RepositorioReserva(db)
        self.repo_quarto = RepositorioQuarto(db)

    def realizar_reserva(self, reserva_dados: esquemas.ReservaCriar, cliente_id: int):
        quarto = self.repo_quarto.obter_por_id(reserva_dados.quarto_id)
        if not quarto:
            raise HTTPException(status_code=404, detail="Quarto não encontrado")
        
        if quarto.status == "manutencao":
            raise HTTPException(status_code=400, detail="Quarto em manutenção")

        # Verificar se as datas são válidas
        if reserva_dados.data_entrada >= reserva_dados.data_saida:
            raise HTTPException(status_code=400, detail="Data de saída deve ser após a data de entrada")

        # Verificar disponibilidade
        disponivel = self.repo_reserva.verificar_disponibilidade(
            reserva_dados.quarto_id, 
            reserva_dados.data_entrada, 
            reserva_dados.data_saida
        )
        if not disponivel:
            raise HTTPException(status_code=400, detail="Quarto já reservado para este período")

        nova_reserva = modelos.Reserva(
            **reserva_dados.dict(),
            cliente_id=cliente_id,
            status="pendente"
        )
        return self.repo_reserva.criar(nova_reserva)

    def atualizar_status(self, reserva_id: int, novo_status: str):
        status_permitidos = ["pendente", "confirmada", "cancelada", "concluida"]
        if novo_status not in status_permitidos:
            raise HTTPException(status_code=400, detail="Status de reserva invalido")

        reserva = self.repo_reserva.obter_por_id(reserva_id)
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")
        
        reserva.status = novo_status
        
        if novo_status == "confirmada":
            reserva.quarto.status = "ocupado"
        elif novo_status in ["cancelada", "concluida"]:
            reserva.quarto.status = "disponivel"
            
        return self.repo_reserva.criar(reserva) # Re-salva/atualiza

    def cancelar_reserva(self, reserva_id: int, usuario_atual: modelos.Usuario):
        reserva = self.repo_reserva.obter_por_id(reserva_id)
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")
        
        # Só o dono da reserva ou um funcionário pode cancelar
        if usuario_atual.tipo == "cliente" and reserva.cliente_id != usuario_atual.id:
            raise HTTPException(status_code=403, detail="Você não tem permissão para cancelar esta reserva")
        
        if reserva.status in ["cancelada", "concluida"]:
            raise HTTPException(status_code=400, detail=f"Reserva já está {reserva.status}")

        reserva.status = "cancelada"
        reserva.quarto.status = "disponivel"
        return self.repo_reserva.criar(reserva)

    def obter_reserva(self, reserva_id: int, usuario_atual: modelos.Usuario):
        reserva = self.repo_reserva.obter_por_id(reserva_id)
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")
        
        # Só o dono da reserva ou um funcionário pode ver
        if usuario_atual.tipo == "cliente" and reserva.cliente_id != usuario_atual.id:
            raise HTTPException(status_code=403, detail="Você não tem permissão para visualizar esta reserva")
        
        return reserva
