import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.configuracoes import seguranca as _seguranca  # carrega .env local

URL_BANCO_DADOS = os.getenv("URL_BANCO_DADOS", "sqlite:///./sistema_reserva.db")

connect_args = {"check_same_thread": False} if URL_BANCO_DADOS.startswith("sqlite") else {}
engine = create_engine(URL_BANCO_DADOS, connect_args=connect_args)
SessaoLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def obter_db():
    db = SessaoLocal()
    try:
        yield db
    finally:
        db.close()
