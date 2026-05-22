import os
from pathlib import Path


def _carregar_env_local():
    caminhos = [
        Path.cwd() / ".env",
        Path.cwd().parent / ".env",
        Path(__file__).resolve().parents[3] / ".env",
    ]
    for caminho in caminhos:
        if not caminho.exists():
            continue
        for linha in caminho.read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if not linha or linha.startswith("#") or "=" not in linha:
                continue
            chave, valor = linha.split("=", 1)
            os.environ.setdefault(chave.strip(), valor.strip().strip('"').strip("'"))
        break


_carregar_env_local()


def _obter_bool(nome: str, padrao: bool = False) -> bool:
    valor = os.getenv(nome)
    if valor is None:
        return padrao
    return valor.strip().lower() in {"1", "true", "sim", "yes", "on"}


def _obter_lista(nome: str, padrao: list[str]) -> list[str]:
    valor = os.getenv(nome)
    if not valor:
        return padrao
    return [item.strip() for item in valor.split(",") if item.strip()]


AMBIENTE = os.getenv("AMBIENTE", "desenvolvimento").lower()
EM_PRODUCAO = AMBIENTE == "producao"

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if EM_PRODUCAO:
        raise RuntimeError("Defina SECRET_KEY no ambiente antes de iniciar em producao.")
    SECRET_KEY = "troque-esta-chave-em-producao"

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

CORS_ORIGINS = _obter_lista(
    "CORS_ORIGINS",
    [
        "https://sr-2-mu.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
)

ADMIN_INICIAL_EMAIL = os.getenv("ADMIN_INICIAL_EMAIL", "admin@sistema.com")
ADMIN_INICIAL_SENHA = os.getenv("ADMIN_INICIAL_SENHA")
if ADMIN_INICIAL_SENHA and len(ADMIN_INICIAL_SENHA) < 8:
    raise RuntimeError("ADMIN_INICIAL_SENHA deve ter pelo menos 8 caracteres.")

COOKIE_NOME = os.getenv("AUTH_COOKIE_NAME", "access_token")
COOKIE_SECURE = _obter_bool("AUTH_COOKIE_SECURE", EM_PRODUCAO)
COOKIE_SAMESITE = os.getenv("AUTH_COOKIE_SAMESITE", "lax")
