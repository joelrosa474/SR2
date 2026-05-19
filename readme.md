# Sistema de Reserva de Hoteis (MVP)

Este e um sistema MVP para gestao de reservas de hoteis, desenvolvido com FastAPI no back-end e React no front-end.

## Tecnologias Utilizadas

- **Back-end**: FastAPI, SQLAlchemy, SQLite, Pydantic, JWT.
- **Front-end**: React, Vite, JavaScript, CSS3.

## Estrutura do Projeto

- `/backend`: API REST desenvolvida em Python.
- `/frontend`: interface do usuario desenvolvida em React.

## Configuracao de Seguranca

Antes de iniciar, copie `.env.example` para `.env` e ajuste os valores:

```bash
cp .env.example .env
```

Variaveis importantes:

- `SECRET_KEY`: chave longa e aleatoria usada para assinar JWTs.
- `CORS_ORIGINS`: origens permitidas do front-end, separadas por virgula.
- `ADMIN_INICIAL_EMAIL`: email do administrador inicial.
- `ADMIN_INICIAL_SENHA`: senha do administrador inicial, com pelo menos 8 caracteres.
- `AUTH_COOKIE_SECURE`: use `true` em producao com HTTPS.

O sistema nao cria mais administrador com senha fixa. O admin inicial so e criado quando `ADMIN_INICIAL_SENHA` estiver definida.

## Como Executar

### Back-end

1. Navegue ate a pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicie o servidor:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   A API estara disponivel em `http://localhost:8000`. O Swagger pode ser acessado em `http://localhost:8000/docs`.

### Front-end

1. Navegue ate a pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependencias:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O sistema estara disponivel em `http://localhost:5173`.

## Tipos de Usuarios

- **Administrador**: gerencia quartos, funcionarios e reservas.
- **Funcionario**: gerencia reservas e status.
- **Cliente**: visualiza quartos e realiza reservas.
