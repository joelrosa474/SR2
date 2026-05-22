from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime

# --- Esquemas de Usuário ---
class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    telefone: Optional[str] = None
    tipo: str = "cliente"
    cargo: Optional[str] = None
    status: str = "ativo"

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, valor):
        if valor not in {"administrador", "funcionario", "cliente"}:
            raise ValueError("Tipo de usuario invalido")
        return valor

    @field_validator("status")
    @classmethod
    def validar_status(cls, valor):
        if valor not in {"ativo", "inativo"}:
            raise ValueError("Status de usuario invalido")
        return valor

class UsuarioCriar(UsuarioBase):
    senha: str

    @field_validator("senha")
    @classmethod
    def validar_senha(cls, valor):
        if len(valor) < 8:
            raise ValueError("A senha deve ter pelo menos 8 caracteres")
        return valor

class UsuarioAtualizar(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    tipo: Optional[str] = None
    cargo: Optional[str] = None
    status: Optional[str] = None
    senha: Optional[str] = None

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, valor):
        if valor is not None and valor not in {"administrador", "funcionario", "cliente"}:
            raise ValueError("Tipo de usuario invalido")
        return valor

    @field_validator("status")
    @classmethod
    def validar_status(cls, valor):
        if valor is not None and valor not in {"ativo", "inativo"}:
            raise ValueError("Status de usuario invalido")
        return valor

    @field_validator("senha")
    @classmethod
    def validar_senha(cls, valor):
        if valor is not None and len(valor) < 8:
            raise ValueError("A senha deve ter pelo menos 8 caracteres")
        return valor

class Usuario(UsuarioBase):
    id: int

    class Config:
        from_attributes = True

# --- Esquemas de Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenDados(BaseModel):
    email: Optional[str] = None
    tipo: Optional[str] = None

# --- Esquemas de Quarto ---
class QuartoBase(BaseModel):
    numero: str
    tipo: str
    preco: float
    preco_5h: Optional[float] = None
    descricao: str
    imagem_url: Optional[str] = None
    status: str = "disponivel"

class QuartoCriar(QuartoBase):
    pass

class QuartoAtualizar(BaseModel):
    numero: Optional[str] = None
    tipo: Optional[str] = None
    preco: Optional[float] = None
    preco_5h: Optional[float] = None
    descricao: Optional[str] = None
    imagem_url: Optional[str] = None
    status: Optional[str] = None

class Quarto(QuartoBase):
    id: int

    class Config:
        from_attributes = True

# --- Esquemas de Reserva ---
class ReservaBase(BaseModel):
    quarto_id: int
    data_entrada: datetime
    data_saida: datetime

class ReservaCriar(ReservaBase):
    nome_cliente: Optional[str] = None
    email_cliente: Optional[EmailStr] = None
    telefone_cliente: Optional[str] = None
    metodo_pagamento: Optional[str] = None
    codigo_reserva: Optional[str] = None

class Reserva(ReservaBase):
    id: int
    codigo_reserva: Optional[str] = None
    cliente_id: int
    nome_cliente: Optional[str] = None
    email_cliente: Optional[str] = None
    telefone_cliente: Optional[str] = None
    tipo_diaria: Optional[str] = None
    valor_diaria: Optional[float] = None
    quantidade_dias: Optional[int] = None
    total_pagar: Optional[float] = None
    metodo_pagamento: Optional[str] = None
    comprovativo_path: Optional[str] = None
    comprovativo_nome: Optional[str] = None
    pagamento_status: Optional[str] = None
    criado_em: Optional[datetime] = None
    expira_em: Optional[datetime] = None
    status: str
    quarto: Optional[Quarto] = None
    cliente: Optional[Usuario] = None

    class Config:
        from_attributes = True

# --- Esquemas de Itens Adicionais ---
class ItemAdicionalBase(BaseModel):
    nome: str
    preco: float
    descricao: Optional[str] = None

class ItemAdicionalCriar(ItemAdicionalBase):
    pass

class ItemAdicional(ItemAdicionalBase):
    id: int

    class Config:
        from_attributes = True
