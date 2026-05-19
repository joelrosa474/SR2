from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.configuracoes.banco_dados import Base
import enum

class TipoUsuario(enum.Enum):
    ADMINISTRADOR = "administrador"
    FUNCIONARIO = "funcionario"
    CLIENTE = "cliente"

class StatusReserva(enum.Enum):
    PENDENTE = "pendente"
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"
    CONCLUIDA = "concluida"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    senha_hash = Column(String)
    telefone = Column(String, nullable=True)
    tipo = Column(String, default=TipoUsuario.CLIENTE.value)
    cargo = Column(String, nullable=True) # Apenas para funcionários
    status = Column(String, default="ativo") # ativo/inativo

    reservas = relationship("Reserva", back_populates="cliente")

class Quarto(Base):
    __tablename__ = "quartos"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String, unique=True, index=True)
    tipo = Column(String) # Ex: Simples, Luxo, Suite
    preco = Column(Float)
    preco_5h = Column(Float, nullable=True)
    descricao = Column(String)
    imagem_url = Column(String, nullable=True)
    status = Column(String, default="disponivel") # disponivel/ocupado/manutencao

    reservas = relationship("Reserva", back_populates="quarto")

class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"))
    quarto_id = Column(Integer, ForeignKey("quartos.id"))
    data_entrada = Column(DateTime)
    data_saida = Column(DateTime)
    status = Column(String, default=StatusReserva.PENDENTE.value)

    cliente = relationship("Usuario", back_populates="reservas")
    quarto = relationship("Quarto", back_populates="reservas")

class ItemAdicional(Base):
    __tablename__ = "itens_adicionais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True)
    preco = Column(Float)
    descricao = Column(String, nullable=True)
