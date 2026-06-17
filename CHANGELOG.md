# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **UI/Filtros**: Adicionada barra de filtros na listagem de Equipes, permitindo filtrar os resultados simultaneamente por Esporte, Categoria e Delegação.
- **Validação**: Inserida regra de negócio na seleção de participantes e formação de equipes, bloqueando o cadastro de membros com sexo divergente da categoria exigida pelo esporte selecionado (exeto para esportes de categoria 'Misto').
- **API**: Rota de healthcheck (`GET /api/health`) implementada no backend.
- **Infraestrutura**: Configuração de verificação de integridade (`healthcheck`) nos serviços `web` e `web-dev` no Docker Compose, otimizados para contêineres Alpine usando `wget`.
- **Testes Unitários**: Criada cobertura de testes para os componentes de interface de `Partidas` e `Delegacoes` no React.
- **Testes Unitários**: Criada suíte `middlewares.test.ts` dedicada à validação do JWT e schemas do Zod no backend de forma isolada.
- **Testes de Integração**: Novas asserções em `api.test.ts` cobrindo o healthcheck e manipulação das restrições do Admin primário.
- **Testes E2E**: Script `partidas-crud.spec.ts` introduzido no Playwright para validar a tela de gerenciamento de partidas e formulários sob o cargo de Admin.

### Changed
- **UI/UX**: O layout de listagem de Equipes (tabela genérica) foi substituído por um modelo de "cards" (grade responsiva). A visualização agora agrupa e ordena as equipes hierarquicamente pelo Esporte e sua respectiva Categoria, incluindo uma lista nominal legível dos atletas dentro de cada equipe.
- **Segurança**: Aplicado um bloqueio de segurança na rota de usuários; qualquer tentativa de edição (PUT) ou deleção (DELETE) na conta do Admin root (ID `'1'`) é estritamente bloqueada com erro de autorização.
- **UI/UX**: Modais da área administrativa (`Usuarios`, `Equipes`, `Esportes`, `Participantes`, `Delegacoes`, `Partidas`) receberam ajustes de CSS (`max-h-[90vh]` e `overflow-y-auto`). Agora é possível realizar a rolagem interna do formulário em dispositivos menores sem quebrar a janela.
- **Infraestrutura/Docker**: Alterado o mapeamento de portas (`ports`) para exposição interna (`expose`) no `docker-compose.yml` (serviços `web` e `db`) para evitar a exposição direta na rede do host.

### Fixed
- **API**: Corrigido um erro crasso (`Status 500`) ao cadastrar partidas com resultado de "Empate" ou campos vazios para medalhas. O backend agora sanitiza ativamente *strings* vazias (`""`) do frontend convertendo-as para a representação `null` original aceita pelo driver UUID do PostgreSQL.
- **API/Validação**: A validação `UpdateUserSchema` do Zod parou de exigir a presença do campo CPF no payload, sincronizando o contrato com os modais do frontend que não o exibiam na edição.
- **Infraestrutura/Docker**: Corrigida falha no `healthcheck` onde o `wget` dentro do contêiner Alpine tentava resolver `localhost` via IPv6 (`::1`), resultando em *Connection Refused* pois a API Node.js escuta apenas em IPv4 (`0.0.0.0`). O alvo foi alterado para o IP literal `127.0.0.1`.
- **Scripts**: Corrigido o script `dev` do `package.json` que estava quebrando o servidor de desenvolvimento. O parâmetro `--env-file=.env` estava sendo repassado para o `tsx` de forma incorreta causando erro interno de módulo (`ERR_MODULE_NOT_FOUND`).
- **Autenticação**: O fluxo de login agora remove caracteres especiais do CPF tanto no frontend quanto na API antes de prosseguir com a autenticação.
