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
    EXPIRADA = "expirada"

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
    codigo_reserva = Column(String(8), unique=True, index=True, nullable=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"))
    quarto_id = Column(Integer, ForeignKey("quartos.id"))
    nome_cliente = Column(String, nullable=True)
    email_cliente = Column(String, nullable=True)
    telefone_cliente = Column(String, nullable=True)
    data_entrada = Column(DateTime)
    data_saida = Column(DateTime)
    tipo_diaria = Column(String, default="Diaria completa")
    valor_diaria = Column(Float, default=0)
    quantidade_dias = Column(Integer, default=1)
    total_pagar = Column(Float, default=0)
    metodo_pagamento = Column(String, nullable=True)
    comprovativo_path = Column(String, nullable=True)
    comprovativo_nome = Column(String, nullable=True)
    pagamento_status = Column(String, default="pendente")
    criado_em = Column(DateTime, nullable=True)
    expira_em = Column(DateTime, nullable=True)
    status = Column(String, default=StatusReserva.PENDENTE.value)

    cliente = relationship("Usuario", back_populates="reservas")
    quarto = relationship("Quarto", back_populates="reservas")

class ItemAdicional(Base):
    __tablename__ = "itens_adicionais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True)
    preco = Column(Float)
    descricao = Column(String, nullable=True)
