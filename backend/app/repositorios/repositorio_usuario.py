from sqlalchemy.orm import Session
from app.modelos.modelos import Usuario

class RepositorioUsuario:
    def __init__(self, db: Session):
        self.db = db

    def obter_por_id(self, usuario_id: int):
        return self.db.query(Usuario).filter(Usuario.id == usuario_id).first()

    def obter_por_email(self, email: str):
        return self.db.query(Usuario).filter(Usuario.email == email).first()

    def listar_todos(self):
        return self.db.query(Usuario).all()

    def criar(self, usuario: Usuario):
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def remover(self, usuario: Usuario):
        self.db.delete(usuario)
        self.db.commit()

    def atualizar(self, usuario: Usuario, dados_atualizacao: dict):
        for key, value in dados_atualizacao.items():
            if value is not None:
                setattr(usuario, key, value)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario
