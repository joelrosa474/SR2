from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.configuracoes import seguranca
from app.configuracoes.banco_dados import Base, SessaoLocal, engine
from app.controladores import (
    auth_controlador,
    dashboard_controlador,
    item_adicional_controlador,
    quarto_controlador,
    reserva_controlador,
    usuario_controlador,
)
from app.modelos import modelos
from app.seguranca import autenticacao


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Reservas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=seguranca.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controlador.router)
app.include_router(usuario_controlador.router)
app.include_router(quarto_controlador.router)
app.include_router(reserva_controlador.router)
app.include_router(dashboard_controlador.router)
app.include_router(item_adicional_controlador.router)


@app.on_event("startup")
def setup_inicial():
    db = SessaoLocal()
    try:
        admin = db.query(modelos.Usuario).filter(
            modelos.Usuario.email == seguranca.ADMIN_INICIAL_EMAIL
        ).first()
        if not admin and seguranca.ADMIN_INICIAL_SENHA:
            admin_inicial = modelos.Usuario(
                nome="Administrador",
                email=seguranca.ADMIN_INICIAL_EMAIL,
                senha_hash=autenticacao.obter_senha_hash(seguranca.ADMIN_INICIAL_SENHA),
                tipo="administrador",
                status="ativo",
            )
            db.add(admin_inicial)
            db.commit()
            print(f"Usuario administrador inicial criado: {seguranca.ADMIN_INICIAL_EMAIL}")
    finally:
        db.close()


@app.get("/")
def ler_raiz():
    return {"mensagem": "Bem-vindo a API do Sistema de Reservas"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
