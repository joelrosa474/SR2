# Documentacao do Sistema de Reserva de Hotel

## 1. Visao geral

O sistema e uma aplicacao web para reservas e gestao de quartos do Hotel Fiesta. Ele permite que clientes visualizem suites/quartos, criem conta, facam login, realizem reservas com comprovativo de pagamento e acompanhem as suas reservas. Administradores e funcionarios podem gerir reservas, quartos, usuarios e consultar estatisticas do hotel.

O projeto esta dividido em duas partes principais:

- `backend`: API REST em FastAPI, responsavel por regras de negocio, autenticacao, persistencia e ficheiros de comprovativos.
- `frontend`: aplicacao React com Vite, responsavel pela interface do usuario, navegacao, formularios, dashboards e comunicacao com a API.

## 2. Tecnologias utilizadas

### Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite por padrao
- Pydantic
- JWT com `python-jose`
- Hash de senha com `passlib[bcrypt]`
- Upload de ficheiros com `python-multipart`

### Frontend

- React
- Vite
- React Router DOM
- CSS global customizado
- React Hot Toast
- React Datepicker
- Recharts

## 3. Estrutura do projeto

```text
SR2/
  backend/
    app/
      configuracoes/
      controladores/
      esquemas/
      modelos/
      repositorios/
      seguranca/
      servicos/
      main.py
    requirements.txt

  frontend/
    src/
      assets/
      components/
      estilos/
      hooks/
      paginas/
      rotas/
      servicos/
      App.jsx
      main.jsx
    package.json

  readme.md
  DOCUMENTACAO_SISTEMA.md
```

## 4. Perfis de usuario

O sistema trabalha com tres tipos de usuario:

- `administrador`: gere quartos, usuarios/equipe, reservas e dashboard.
- `funcionario`: acompanha reservas, altera status e consulta informacoes operacionais.
- `cliente`: cria conta, faz login, visualiza quartos e realiza reservas.

Usuarios possuem tambem um `status`, normalmente `ativo` ou `inativo`. Usuarios inativos nao conseguem autenticar.

## 5. Principais funcionalidades

### Cliente

- Visualizar quartos disponiveis.
- Criar conta de cliente.
- Entrar no sistema.
- Fazer reserva de quarto.
- Enviar comprovativo de pagamento em PDF, PNG ou JPG.
- Baixar comprovativo/recibo gerado no frontend.
- Consultar as proprias reservas.
- Cancelar reserva, quando permitido.

### Administrador

- Criar, listar, editar e remover quartos.
- Criar, listar, editar e remover usuarios.
- Criar membros da equipe/funcionarios.
- Consultar dashboard com estatisticas.
- Listar todas as reservas.
- Atualizar status das reservas.

### Funcionario

- Listar reservas.
- Atualizar status de reserva.
- Baixar comprovativos enviados pelos clientes.
- Consultar estatisticas do dashboard.

## 6. Frontend

### Rotas

As rotas ficam em `frontend/src/rotas/index.jsx`.

- `/login`: tela de login e cadastro de cliente.
- `/quartos`: pagina publica com quartos/suites.
- `/reservas`: pagina privada para cliente, funcionario e administrador.
- `/admin`: pagina privada apenas para administrador.
- `/`: redireciona para `/quartos`.

Rotas privadas verificam se existe usuario autenticado pelo hook `useAuth`. Se nao houver sessao, o usuario e enviado para `/login`.

### Componentes principais

- `App.jsx`: monta o layout principal, navbar, rotas, mensagens e toaster.
- `ModalReserva.jsx`: modal para dados da reserva, pagamento, upload de comprovativo e geracao de PDF.
- `MensagemCentral.jsx`: componente global para mensagens no centro da tela, como senha incorreta ou necessidade de criar conta.
- `BarraProgressoServidor.jsx`: barra fixa no topo que aparece enquanto chamadas ao servidor estao em andamento.

### Comunicacao com API

O ficheiro `frontend/src/servicos/api.js` concentra as chamadas HTTP para o backend. Ele usa `BASE_URL`, definido por:

```js
import.meta.env.VITE_API_URL || 'https://sr2-41zp.onrender.com'
```

Se `VITE_API_URL` nao existir, o frontend usa o backend publicado no Render.

O token JWT e guardado no `localStorage` com a chave:

```text
hotel_fiesta_access_token
```

As chamadas autenticadas enviam:

```text
Authorization: Bearer <token>
credentials: include
```

### Feedback visual

O sistema tem dois tipos de feedback:

- Barra de progresso no topo durante pedidos ao servidor.
- Mensagem central para avisos importantes, como erro de login, conta criada ou tentativa de reservar sem conta.

O `react-hot-toast` continua disponivel para mensagens menores em areas como reservas e administracao.

## 7. Backend

### Inicializacao

O backend inicia em `backend/app/main.py`.

Responsabilidades principais:

- Criar tabelas com SQLAlchemy.
- Aplicar ajustes em colunas antigas da tabela `reservas` quando o banco e SQLite.
- Configurar CORS.
- Criar pasta `uploads/comprovativos`.
- Servir ficheiros estaticos em `/uploads`.
- Registrar os controladores da API.
- Criar administrador inicial no arranque, se a senha estiver definida.

### Banco de dados

A configuracao fica em `backend/app/configuracoes/banco_dados.py`.

Por padrao, usa SQLite:

```text
sqlite:///./sistema_reserva.db
```

Pode ser alterado pela variavel:

```text
URL_BANCO_DADOS
```

### Modelos principais

Os modelos ficam em `backend/app/modelos/modelos.py`.

#### Usuario

Campos principais:

- `id`
- `nome`
- `email`
- `senha_hash`
- `telefone`
- `tipo`
- `cargo`
- `status`

Relacionamento:

- Um usuario pode ter varias reservas.

#### Quarto

Campos principais:

- `id`
- `numero`
- `tipo`
- `preco`
- `preco_5h`
- `descricao`
- `imagem_url`
- `status`

Status comuns:

- `disponivel`
- `ocupado`
- `manutencao`

#### Reserva

Campos principais:

- `id`
- `codigo_reserva`
- `cliente_id`
- `quarto_id`
- `nome_cliente`
- `email_cliente`
- `telefone_cliente`
- `data_entrada`
- `data_saida`
- `tipo_diaria`
- `valor_diaria`
- `quantidade_dias`
- `total_pagar`
- `metodo_pagamento`
- `comprovativo_path`
- `comprovativo_nome`
- `pagamento_status`
- `criado_em`
- `expira_em`
- `status`

Status de reserva:

- `pendente`
- `confirmada`
- `cancelada`
- `concluida`
- `expirada`

#### ItemAdicional

Campos principais:

- `id`
- `nome`
- `preco`
- `descricao`

## 8. Regras de negocio de reservas

As regras ficam principalmente em `backend/app/servicos/servico_reserva.py`.

Ao criar uma reserva:

1. O sistema expira reservas pendentes antigas sem comprovativo.
2. Verifica se o quarto existe.
3. Bloqueia reserva para quarto em manutencao.
4. Valida se `data_saida` e maior que `data_entrada`.
5. Verifica conflito de datas com reservas `pendente` ou `confirmada`.
6. Calcula quantidade de dias.
7. Calcula total a pagar com base no preco diario do quarto.
8. Gera ou valida codigo de reserva com 8 caracteres.
9. Define status inicial como `pendente`.
10. Define pagamento como `pendente`.
11. Define expiracao para 5 horas apos a criacao.

Reservas pendentes sem comprovativo expiram automaticamente quando `expira_em` fica no passado. Nessa situacao:

- `status` passa para `expirada`.
- `pagamento_status` passa para `expirado`.
- o quarto volta para `disponivel`, se estava ocupado.

Ao confirmar uma reserva:

- A reserva precisa ter comprovativo.
- `status` passa para `confirmada`.
- `pagamento_status` passa para `aprovado`.
- o quarto passa para `ocupado`.

Ao cancelar, concluir ou expirar:

- o quarto volta para `disponivel`.

## 9. Autenticacao e seguranca

### Login

Endpoint:

```text
POST /token
```

O login recebe dados no formato OAuth2:

- `username`: email
- `password`: senha

Se as credenciais estiverem corretas:

- gera JWT;
- devolve `access_token`;
- grava tambem cookie HTTP-only com o token.

Se o usuario estiver inativo, o login e recusado.

### Limite de tentativas

O backend controla tentativas falhadas de login por IP e email.

- Maximo: 5 tentativas.
- Bloqueio: 15 minutos.

### Sessao

Endpoint:

```text
GET /sessao
```

Retorna se existe usuario autenticado via cookie.

### Logout

Endpoint:

```text
POST /logout
```

Remove o cookie de autenticacao e encerra a sessao.

### Variaveis de ambiente

Principais variaveis:

```text
SECRET_KEY
JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
CORS_ORIGINS
ADMIN_INICIAL_EMAIL
ADMIN_INICIAL_SENHA
AUTH_COOKIE_NAME
AUTH_COOKIE_SECURE
AUTH_COOKIE_SAMESITE
URL_BANCO_DADOS
AMBIENTE
```

Em producao, `SECRET_KEY` deve ser definida obrigatoriamente.

## 10. Endpoints da API

### Autenticacao

| Metodo | Rota | Descricao |
|---|---|---|
| `POST` | `/token` | Login e emissao de token |
| `POST` | `/logout` | Termina sessao |
| `GET` | `/sessao` | Verifica sessao via cookie |
| `POST` | `/registrar` | Cria conta de cliente |

### Usuarios

| Metodo | Rota | Permissao | Descricao |
|---|---|---|---|
| `GET` | `/usuarios/me` | Autenticado | Perfil atual |
| `GET` | `/usuarios/` | Administrador | Lista usuarios |
| `POST` | `/usuarios/` | Administrador | Cria usuario |
| `GET` | `/usuarios/{id}` | Administrador | Obtem usuario |
| `PUT` | `/usuarios/{id}` | Administrador | Atualiza usuario |
| `DELETE` | `/usuarios/{id}` | Administrador | Remove usuario |
| `PATCH` | `/usuarios/me` | Autenticado | Atualiza proprio perfil |

### Quartos

| Metodo | Rota | Permissao | Descricao |
|---|---|---|---|
| `GET` | `/quartos/` | Publico | Lista quartos com filtros |
| `GET` | `/quartos/disponiveis` | Publico | Lista quartos disponiveis por periodo |
| `GET` | `/quartos/{id}` | Publico | Obtem quarto |
| `POST` | `/quartos/` | Administrador | Cria quarto |
| `PUT` | `/quartos/{id}` | Administrador | Atualiza quarto |
| `DELETE` | `/quartos/{id}` | Administrador | Remove quarto |

Filtros em `/quartos/`:

- `tipo`
- `preco_min`
- `preco_max`
- `status`

### Reservas

| Metodo | Rota | Permissao | Descricao |
|---|---|---|---|
| `POST` | `/reservas/` | Autenticado | Cria reserva JSON |
| `POST` | `/reservas/com-comprovativo` | Autenticado | Cria reserva com upload |
| `GET` | `/reservas/` | Funcionario/Admin | Lista todas as reservas |
| `GET` | `/reservas/minhas` | Autenticado | Lista reservas do usuario atual |
| `GET` | `/reservas/{id}` | Autenticado | Obtem reserva |
| `GET` | `/reservas/{id}/comprovativo` | Funcionario/Admin | Baixa comprovativo |
| `PATCH` | `/reservas/{id}/status` | Funcionario/Admin | Atualiza status |
| `DELETE` | `/reservas/{id}` | Autenticado | Cancela reserva |

### Dashboard

| Metodo | Rota | Permissao | Descricao |
|---|---|---|---|
| `GET` | `/dashboard/` | Funcionario/Admin | Estatisticas do hotel |

O dashboard retorna:

- total de quartos;
- quartos ocupados;
- quartos disponiveis;
- taxa de ocupacao;
- total de reservas;
- reservas do dia;
- faturamento total;
- proximas reservas.

### Itens adicionais

O sistema possui controlador para itens adicionais, usado para gerir servicos extras do hotel.

## 11. Uploads e comprovativos

Comprovativos de pagamento sao guardados em:

```text
uploads/comprovativos
```

Extensoes permitidas:

- `.pdf`
- `.png`
- `.jpg`
- `.jpeg`

O nome original fica guardado em `comprovativo_nome`, e o caminho fisico em `comprovativo_path`.

## 12. Como executar localmente

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

API:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicacao:

```text
http://localhost:5173
```

### Build do frontend

```bash
cd frontend
npm run build
```

## 13. Configuracao recomendada de `.env`

Exemplo:

```env
AMBIENTE=desenvolvimento
SECRET_KEY=troque-por-uma-chave-grande-e-segura
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ADMIN_INICIAL_EMAIL=admin@sistema.com
ADMIN_INICIAL_SENHA=uma-senha-segura
AUTH_COOKIE_NAME=access_token
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax
URL_BANCO_DADOS=sqlite:///./sistema_reserva.db
```

No frontend, pode ser usado:

```env
VITE_API_URL=http://localhost:8000
```

## 14. Fluxo completo de reserva

1. Cliente abre `/quartos`.
2. Cliente escolhe um quarto disponivel.
3. Se nao estiver autenticado, o sistema mostra mensagem central e redireciona para `/login`.
4. Cliente cria conta ou entra.
5. Cliente abre o modal de reserva.
6. Preenche nome, email, telefone, datas e metodo de pagamento.
7. O sistema calcula quantidade de dias e total.
8. Cliente avanca para pagamento.
9. Cliente envia comprovativo.
10. Frontend chama `/reservas/com-comprovativo`.
11. Backend valida quarto, datas, disponibilidade e ficheiro.
12. Backend cria a reserva como `pendente`.
13. Frontend gera um PDF/recibo local da reserva.
14. Funcionario ou administrador valida o comprovativo.
15. Ao aprovar, reserva fica `confirmada` e quarto fica `ocupado`.

## 15. Observacoes de manutencao

- O backend ainda usa migracao simples por codigo para adicionar colunas em SQLite. Para evolucao maior, recomenda-se usar Alembic.
- O frontend concentra chamadas HTTP em `api.js`, o que facilita mudar URL da API, autenticar pedidos e controlar progresso global.
- Existem mensagens com alguns caracteres acentuados corrompidos em ficheiros antigos. Isso nao impede o funcionamento, mas pode ser corrigido padronizando a codificacao para UTF-8.
- O build do Vite pode avisar sobre chunks grandes por causa de dependencias e imagens. Isso e um aviso de otimizacao, nao erro.

## 16. Comandos uteis

Ver estado do git:

```bash
git status
```

Executar build do frontend:

```bash
cd frontend
npm run build
```

Executar backend em desenvolvimento:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

Instalar dependencias do frontend:

```bash
cd frontend
npm install
```

Instalar dependencias do backend:

```bash
cd backend
pip install -r requirements.txt
```
