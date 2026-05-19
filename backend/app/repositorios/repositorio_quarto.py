from sqlalchemy.orm import Session
from app.modelos.modelos import Quarto

class RepositorioQuarto:
    def __init__(self, db: Session):
        self.db = db

    def obter_por_id(self, quarto_id: int):
        return self.db.query(Quarto).filter(Quarto.id == quarto_id).first()

    def obter_por_numero(self, numero: str):
        return self.db.query(Quarto).filter(Quarto.numero == numero).first()

    def listar_todos(self):
        return self.db.query(Quarto).all()

    def criar(self, quarto: Quarto):
        self.db.add(quarto)
        self.db.commit()
        self.db.refresh(quarto)
        return quarto

    def remover(self, quarto: Quarto):
        self.db.delete(quarto)
        self.db.commit()

    def atualizar(self, quarto: Quarto, dados_atualizacao: dict):
        for key, value in dados_atualizacao.items():
            if value is not None:
                setattr(quarto, key, value)
        self.db.commit()
        self.db.refresh(quarto)
        return quarto
