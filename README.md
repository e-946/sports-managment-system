# 🏆 Gestão Esportiva

Sistema completo de **Gestão Esportiva** para organização e acompanhamento de jogos esportivos interinstitucionais. Permite o cadastro de delegações, esportes, participantes, equipes e partidas, com controle de acesso baseado em papéis (RBAC), quadro de medalhas público e auditoria de alterações.

> **Feito pela [e-946 Consultoria](https://www.instagram.com/e946consultoria/)**

---

## Índice

- [Visão Geral](#visão-geral)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Pré-requisitos](#pré-requisitos)
- [Configuração e Instalação](#configuração-e-instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Docker](#docker)
- [Testes](#testes)
- [Banco de Dados](#banco-de-dados)
- [API Endpoints](#api-endpoints)
- [Licença](#licença)

---

## Visão Geral

O sistema é dividido em duas áreas:

- **Área Pública** — qualquer pessoa pode visualizar as partidas em andamento e o quadro de medalhas (ranking) das delegações.
- **Área Administrativa** — acesso restrito por login (CPF + senha), com funcionalidades de CRUD completas e permissões diferenciadas por papel do usuário (`ADMIN_GERAL`, `MANAGER`, `MODERADOR`).

### Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| **Delegações** | Cadastro e gerenciamento de delegações (instituições/países) |
| **Esportes** | Configuração de modalidades com categoria, turno, data e limites de participantes |
| **Participantes** | Registro de atletas e comissão técnica com validação de CPF |
| **Equipes** | Formação de equipes vinculadas a delegação + esporte, com validação de conflitos de horário |
| **Partidas** | Registro de jogos com placar, fase, equipe vencedora e atribuição de medalhas |
| **Ranking Público** | Quadro de medalhas automático (Ouro > Prata > Bronze) por delegação |
| **Usuários** | Gerenciamento de contas com diferentes níveis de acesso |
| **Logs de Auditoria** | Registro de todas as alterações e exclusões no sistema |
| **Soft Delete** | Exclusão lógica de registros preservando o histórico |

---

## Tecnologias Utilizadas

### Frontend

| Tecnologia | Versão | Descrição |
|---|---|---|
| **React** | 19 | Biblioteca para construção de interfaces |
| **React Router DOM** | 7 | Roteamento SPA client-side |
| **TailwindCSS** | 4 | Framework CSS utilitário |
| **Lucide React** | 0.546+ | Ícones SVG |
| **Recharts** | 3 | Gráficos e visualizações no dashboard |
| **Motion** (Framer) | 12 | Animações e transições |
| **clsx / tailwind-merge** | — | Utilitários para classes CSS condicionais |
| **date-fns** | 4 | Manipulação e formatação de datas |

### Backend

| Tecnologia | Versão | Descrição |
|---|---|---|
| **Node.js** | 20+ | Runtime JavaScript |
| **Express** | 4 | Framework HTTP para API REST |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **pg** (node-postgres) | 8 | Driver PostgreSQL para Node.js |
| **node-pg-migrate** | 7 | Sistema de migrações do banco de dados |
| **jsonwebtoken (JWT)** | 9 | Autenticação via tokens JWT (cookie httpOnly) |
| **bcryptjs** | 2 | Hash de senhas com bcrypt |
| **Zod** | 3 | Validação de schemas no servidor |
| **Helmet** | 7 | Cabeçalhos HTTP de segurança |
| **express-rate-limit** | 7 | Rate limiting para proteção contra brute force |
| **cookie-parser** | 1.4 | Parsing de cookies HTTP |

### DevOps & Tooling

| Tecnologia | Versão | Descrição |
|---|---|---|
| **Vite** | 6 | Build tool e dev server com HMR |
| **TypeScript** | 5.8 | Tipagem estática |
| **esbuild** | 0.25 | Bundler para o servidor (build de produção) |
| **tsx** | 4 | Execução de TypeScript no Node.js em dev |
| **Docker** | — | Containerização multi-stage |
| **Docker Compose** | — | Orquestração de contêineres (dev, test, prod) |

### Testes

| Tecnologia | Versão | Descrição |
|---|---|---|
| **Vitest** | 1.6 | Runner de testes unitários e de integração |
| **Testing Library** | 15+ | Testes de componentes React |
| **Supertest** | 7 | Testes de integração da API HTTP |
| **Playwright** | 1.55+ | Testes E2E com browsers reais |

---

## Arquitetura

O projeto usa uma arquitetura **monolítica full-stack** onde o servidor Express serve tanto a API REST quanto o frontend React (SPA):

```
┌─────────────────────────────────────────────────────────┐
│                     Cliente (Browser)                    │
├────────────────────────┬────────────────────────────────┤
│    Área Pública        │       Área Administrativa       │
│  /partidas, /ranking   │  /admin/* (requer login)        │
├────────────────────────┴────────────────────────────────┤
│              React + React Router (SPA)                  │
│              TailwindCSS + Lucide + Recharts             │
├─────────────────────────────────────────────────────────┤
│                    Express.js (API)                       │
│       /api/* (rotas autenticadas + públicas)              │
│       Middlewares: auth, validation, helmet, rate-limit   │
├─────────────────────────────────────────────────────────┤
│                PostgreSQL (via pg + Pool)                 │
│           Migrações: node-pg-migrate                      │
│           Soft Delete + Logs de Auditoria                 │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Autenticação

1. Usuário envia `POST /api/login` com CPF + senha
2. Servidor valida credenciais via bcrypt
3. JWT é gerado e armazenado em cookie `httpOnly`
4. Cada requisição autenticada passa pelo middleware `requireAuth`
5. O middleware decodifica o JWT e carrega o usuário do banco
6. Verificação de papel (role) é feita por rota

---

## Estrutura de Pastas

```
Gestão-Esportiva/
├── e2e/                              # Testes end-to-end (Playwright)
│   ├── admin-flow.spec.ts            # Fluxo completo de Admin Geral
│   ├── auth-flow.spec.ts             # Fluxo de autenticação
│   ├── manager-flow.spec.ts          # Fluxo de Manager
│   └── moderator-flow.spec.ts        # Fluxo de Moderador
│
├── migrations/                       # Migrações do banco (node-pg-migrate)
│   ├── 1716390000000_init.cjs                     # Tabelas iniciais
│   ├── 1716391000000_add_indexes.cjs              # Índices de performance
│   ├── 1716392000000_equipes_nn_relationship.cjs  # Relacionamento N:N equipe-participante
│   └── 1716393000000_soft_delete_and_logs.cjs     # Soft delete + tabelas de log
│
├── src/
│   ├── context/
│   │   └── AuthContext.tsx            # Context API para estado de autenticação
│   │
│   ├── layouts/
│   │   ├── AdminLayout.tsx            # Layout admin (sidebar + navegação + modal senha)
│   │   └── PublicLayout.tsx           # Layout público (header + navegação)
│   │
│   ├── middlewares/
│   │   ├── auth.ts                    # Middleware de autenticação JWT + RBAC
│   │   └── validation.ts             # Middleware de validação Zod
│   │
│   ├── pages/
│   │   ├── Login.tsx                  # Página de login
│   │   ├── PublicMatches.tsx          # Visualização pública de partidas
│   │   ├── PublicRanking.tsx          # Quadro de medalhas público
│   │   └── admin/
│   │       ├── Dashboard.tsx          # Dashboard administrativo com gráficos
│   │       ├── Delegacoes.tsx         # CRUD de delegações
│   │       ├── Esportes.tsx           # CRUD de esportes/modalidades
│   │       ├── Participantes.tsx      # CRUD de participantes
│   │       ├── Equipes.tsx            # CRUD de equipes
│   │       ├── Partidas.tsx           # CRUD de partidas
│   │       ├── Usuarios.tsx           # Gerenciamento de usuários
│   │       └── Logs.tsx               # Visualização de logs de auditoria
│   │
│   ├── routes/                        # Rotas da API Express
│   │   ├── auth.routes.ts             # Login, logout, /me, troca de senha
│   │   ├── delegacoes.routes.ts       # CRUD delegações
│   │   ├── esportes.routes.ts         # CRUD esportes
│   │   ├── participantes.routes.ts    # CRUD participantes
│   │   ├── equipes.routes.ts          # CRUD equipes (com validações de conflito)
│   │   ├── partidas.routes.ts         # CRUD partidas
│   │   ├── usuarios.routes.ts         # CRUD usuários
│   │   ├── public.routes.ts           # Endpoints públicos (partidas, ranking)
│   │   └── logs.routes.ts             # Consulta de logs (admin only)
│   │
│   ├── schemas/
│   │   └── validation.schemas.ts      # Schemas Zod (validação de CPF, entidades)
│   │
│   ├── tests/
│   │   ├── setup.ts                   # Setup do ambiente de testes
│   │   ├── integration/
│   │   │   ├── api.test.ts            # Testes de integração da API
│   │   │   └── softDeleteAndLogs.test.ts  # Testes de soft delete e logs
│   │   └── unit/
│   │       ├── Equipes.test.tsx       # Testes unitários de componentes
│   │       ├── Esportes.test.tsx
│   │       ├── Login.test.tsx
│   │       ├── Participantes.test.tsx
│   │       └── Usuarios.test.tsx
│   │
│   ├── App.tsx                        # Componente raiz (rotas + ProtectedRoute)
│   ├── db.ts                          # Camada de acesso a dados (PostgreSQL)
│   ├── main.tsx                       # Entry point do React
│   ├── types.ts                       # Tipos TypeScript compartilhados
│   └── index.css                      # Estilos globais
│
├── server.ts                          # Entry point do servidor Express
├── index.html                         # HTML template (Vite SPA)
├── package.json                       # Dependências e scripts
├── tsconfig.json                      # Configuração TypeScript
├── vite.config.ts                     # Configuração Vite (React + Tailwind)
├── vitest.config.ts                   # Configuração Vitest
├── playwright.config.ts               # Configuração Playwright (E2E)
├── Dockerfile                         # Build multi-stage (Node 20 Alpine)
├── docker-compose.yml                 # Docker Compose para produção
├── docker-compose.dev.yml             # Docker Compose para desenvolvimento
├── docker-compose.test.yml            # Docker Compose para testes
├── .env.example                       # Exemplo de variáveis de ambiente
├── .dockerignore                      # Arquivos ignorados no Docker build
├── .gitignore                         # Arquivos ignorados pelo Git
└── LICENSE                            # Licença Apache 2.0
```

---

## Pré-requisitos

- **Node.js** >= 20.x
- **PostgreSQL** >= 15 (ou Docker)
- **npm** (incluído com Node.js)

---

## Configuração e Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd Gestão-Esportiva
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário (veja a seção abaixo).

### 4. Iniciar o banco de dados

Se estiver usando Docker para o banco:

```bash
docker run -d --name gestao-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=gestao_esportiva \
  -p 5432:5432 \
  postgres:15-alpine
```

### 5. Rodar o servidor (dev)

```bash
npm run dev
```

O comando acima executa automaticamente as migrações do banco e inicia o servidor com hot-reload em `http://localhost:3000`.

### Credenciais padrão

| Campo | Valor |
|---|---|
| CPF | `admin` |
| Senha | `admin` |
| Papel | `ADMIN_GERAL` |

---

## Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `DATABASE_URL` | Não | `postgresql://postgres:postgres@localhost:5432/gestao_esportiva` | String de conexão PostgreSQL |
| `JWT_SECRET` | **Sim** | — | Chave secreta para assinatura dos tokens JWT |
| `ADMIN_PASSWORD` | Não | `admin` | Senha do usuário admin padrão (seed) |
| `NODE_ENV` | Não | `development` | Ambiente (`development`, `production`, `test`) |
| `PORT` | Não | `3000` | Porta do servidor |
| `POSTGRES_USER` | Não | `postgres` | Usuário do PostgreSQL (Docker Compose) |
| `POSTGRES_PASSWORD` | Não | `postgres` | Senha do PostgreSQL (Docker Compose) |
| `POSTGRES_DB` | Não | `gestao_esportiva` | Nome do banco (Docker Compose) |

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Executa migrações + inicia servidor de desenvolvimento com hot-reload |
| `npm run build` | Build de produção (Vite frontend + esbuild backend) |
| `npm start` | Executa migrações + inicia o servidor de produção |
| `npm run migrate` | Executa apenas as migrações do banco |
| `npm run lint` | Verifica tipagem TypeScript (sem emitir arquivos) |
| `npm test` | Executa testes unitários e de integração (Vitest) |
| `npm run test:coverage` | Testes com relatório de cobertura |
| `npm run test:e2e` | Executa testes end-to-end (Playwright) |
| `npm run clean` | Remove artefatos de build |

---

## Docker

### Produção

```bash
docker compose up --build
```

Sobe os serviços `web` (aplicação Node.js) e `db` (PostgreSQL 15 Alpine) com health checks e volumes persistentes.

### Desenvolvimento

```bash
docker compose -f docker-compose.dev.yml up --build
```

Usa volumes montados para hot-reload com o código-fonte local.

### Testes

```bash
# Testes unitários e de integração
docker compose -f docker-compose.test.yml run test-unit-integration

# Testes E2E
docker compose -f docker-compose.test.yml run test-e2e
```

---

## Testes

O projeto possui três camadas de testes:

| Tipo | Ferramenta | Diretório | Descrição |
|---|---|---|---|
| **Unitários** | Vitest + Testing Library | `src/tests/unit/` | Testes de componentes React isolados |
| **Integração** | Vitest + Supertest | `src/tests/integration/` | Testes da API Express com banco real |
| **E2E** | Playwright | `e2e/` | Fluxos completos no browser (Chromium + Firefox) |

---

## Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|---|---|
| `delegacoes` | Delegações (instituições/países participantes) |
| `users` | Usuários do sistema com papéis de acesso |
| `esportes` | Modalidades esportivas com categoria e configuração |
| `participantes` | Atletas e membros de comissão técnica |
| `equipes` | Equipes vinculadas a delegação e esporte |
| `equipe_participantes` | Tabela associativa N:N (equipe ↔ participante) |
| `partidas` | Jogos com placar, fase e medalhas |
| `log_updates` | Registro de alterações (auditoria) |
| `log_deletes` | Registro de exclusões (auditoria) |

### Diagrama ER Simplificado

```
delegacoes (1) ──── (N) users
delegacoes (1) ──── (N) participantes
delegacoes (1) ──── (N) equipes
esportes   (1) ──── (N) equipes
esportes   (1) ──── (N) partidas
equipes    (N) ──── (N) participantes  [via equipe_participantes]
equipes    (1) ──── (N) partidas       [como equipe1 ou equipe2]
users      (1) ──── (N) log_updates
users      (1) ──── (N) log_deletes
```

---

## API Endpoints

### Públicos (sem autenticação)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/public/partidas` | Lista partidas com nomes das equipes |
| `GET` | `/api/public/esportes` | Lista esportes |
| `GET` | `/api/public/ranking` | Quadro de medalhas por delegação |

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/login` | Login (CPF + senha) → cookie JWT |
| `POST` | `/api/logout` | Logout (limpa cookie) |
| `GET` | `/api/me` | Dados do usuário logado |
| `PUT` | `/api/me/password` | Trocar própria senha |

### CRUD (requerem autenticação)

| Recurso | GET | POST | PUT | DELETE |
|---|---|---|---|---|
| `/api/delegacoes` | ✅ todos | ADMIN, MANAGER | ADMIN, MANAGER | ADMIN, MANAGER |
| `/api/esportes` | ✅ todos | ADMIN, MANAGER | ADMIN, MANAGER | ADMIN, MANAGER |
| `/api/participantes` | ✅ todos* | ✅ todos* | ADMIN, MANAGER, MOD* | ADMIN, MANAGER |
| `/api/equipes` | ✅ todos* | ✅ todos* | ADMIN, MANAGER, MOD* | ADMIN, MANAGER, MOD* |
| `/api/partidas` | ✅ todos | ADMIN, MANAGER | ADMIN, MANAGER | ADMIN, MANAGER |
| `/api/usuarios` | ADMIN, MANAGER | ADMIN, MANAGER | ADMIN | ADMIN |
| `/api/logs/*` | ADMIN | — | — | — |

> **\*** Moderadores veem/editam apenas dados da própria delegação

---

## Licença

Este projeto está licenciado sob a **Apache License 2.0** — veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**Gestão Esportiva** — Desenvolvido com ❤️ pela [e-946 Consultoria](https://www.instagram.com/e946consultoria/)

</div>