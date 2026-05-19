from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.configuracoes.banco_dados import obter_db
from app.modelos import modelos
from app.esquemas import esquemas
from app.seguranca import autenticacao

router = APIRouter(prefix="/itens-adicionais", tags=["Itens Adicionais"])

@router.post("/", response_model=esquemas.ItemAdicional)
def criar_item_adicional(
    item: esquemas.ItemAdicionalCriar, 
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    novo_item = modelos.ItemAdicional(**item.dict())
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item

@router.get("/", response_model=List[esquemas.ItemAdicional])
def listar_itens_adicionais(db: Session = Depends(obter_db)):
    return db.query(modelos.ItemAdicional).all()

@router.delete("/{item_id}")
def remover_item_adicional(
    item_id: int, 
    db: Session = Depends(obter_db),
    admin: modelos.Usuario = Depends(autenticacao.verificar_admin)
):
    item = db.query(modelos.ItemAdicional).filter(modelos.ItemAdicional.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    db.delete(item)
    db.commit()
    return {"mensagem": "Item removido com sucesso"}
