# 📖 Documentação — Sistema de Gestão Esportiva

> Guia completo para utilização do sistema de Gestão Esportiva.

---

## Índice

- [1. O que é o sistema](#1-o-que-é-o-sistema)
- [2. Acessando o sistema](#2-acessando-o-sistema)
- [3. Área Pública](#3-área-pública)
- [4. Tipos de Usuário e o que cada um pode fazer](#4-tipos-de-usuário-e-o-que-cada-um-pode-fazer)
- [5. Telas do Painel Administrativo](#5-telas-do-painel-administrativo)
- [6. Como organizar uma competição passo a passo](#6-como-organizar-uma-competição-passo-a-passo)
- [7. Regras importantes do sistema](#7-regras-importantes-do-sistema)
- [8. Perguntas frequentes](#8-perguntas-frequentes)

---

## 1. O que é o sistema

O **Gestão Esportiva** é uma plataforma para organizar e acompanhar jogos esportivos entre delegações (escolas, cidades, instituições, etc.).

Com ele é possível:

- 📋 **Cadastrar delegações** que vão participar dos jogos
- ⚽ **Criar modalidades esportivas** com data, turno e limites de jogadores
- 👥 **Registrar participantes** (atletas e comissão técnica) vinculados às delegações
- 🏅 **Formar equipes** para cada modalidade
- 🏆 **Registrar partidas** com placar, fase e medalhas
- 📊 **Acompanhar o quadro de medalhas** em tempo real — aberto ao público

O sistema possui uma **área pública** (qualquer pessoa pode ver as partidas e o ranking) e um **painel administrativo** (acesso restrito por login).

---

## 2. Acessando o sistema

### 2.1 Primeiro acesso

Ao abrir o sistema, você estará na **área pública**. Para acessar o painel administrativo, clique no botão **"Admin"** no canto superior direito.

### 2.2 Fazendo login

Na tela de login, informe:

- **CPF**: o CPF cadastrado (ou "admin" para o administrador padrão)
- **Senha**: sua senha de acesso

> 💡 **Administrador padrão**: O sistema já vem com um administrador criado. O login é `admin` e a senha é `admin`. Troque a senha no primeiro acesso.

### 2.3 Trocando sua senha

Após entrar no painel, você pode trocar sua senha a qualquer momento:

1. No menu lateral, clique em **"Trocar Senha"** (ícone de chave)
2. Informe sua **senha atual**
3. Digite a **nova senha** (mínimo 4 caracteres)
4. Confirme a nova senha
5. Clique em **"Atualizar Senha"**

### 2.4 Saindo do sistema

Clique no botão **"Sair"** no menu lateral para encerrar sua sessão.

---

## 3. Área Pública

A área pública é acessível por qualquer pessoa, sem necessidade de login. Ela possui duas páginas:

### 3.1 Partidas

Exibe todas as partidas registradas no sistema, mostrando:

- Nome do esporte
- Equipes que se enfrentam
- Placar (quando disponível)
- Fase da partida (ex: Final, Semifinal, Grupos)
- Equipe vencedora
- Medalhas conquistadas

### 3.2 Ranking (Quadro de Medalhas)

Exibe a classificação das delegações por número de medalhas conquistadas.

A ordenação é feita automaticamente seguindo a regra:

1. **Mais medalhas de Ouro** em primeiro
2. Em caso de empate, **mais medalhas de Prata**
3. Ainda empatando, **mais medalhas de Bronze**
4. Por último, **maior total de medalhas**

---

## 4. Tipos de Usuário e o que cada um pode fazer

O sistema possui quatro tipos de usuário, cada um com permissões diferentes:

### 4.1 Administrador Geral

É o usuário com controle total do sistema. Ele pode:

- ✅ Criar, editar e excluir **delegações**
- ✅ Criar, editar e excluir **esportes**
- ✅ Criar, editar e excluir **participantes** de qualquer delegação
- ✅ Criar, editar e excluir **equipes** de qualquer delegação
- ✅ Criar, editar e excluir **partidas**
- ✅ Criar, editar e excluir **usuários** do sistema
- ✅ Visualizar os **logs de auditoria** (histórico de alterações e exclusões)
- ✅ Trocar a própria senha

**Restrições:**
- Não pode excluir a própria conta
- Não pode excluir outro Administrador Geral

### 4.2 Gerente (Manager)

Tem acesso amplo ao sistema, podendo gerenciar quase tudo, exceto outros usuários e logs.

- ✅ Criar, editar e excluir **delegações**
- ✅ Criar, editar e excluir **esportes**
- ✅ Criar, editar e excluir **participantes** de qualquer delegação
- ✅ Criar, editar e excluir **equipes** de qualquer delegação
- ✅ Criar, editar e excluir **partidas**
- ✅ Criar contas de **Moderador** (somente este tipo)
- ✅ Ver a lista de usuários (exceto Administradores Gerais)
- ✅ Trocar a própria senha
- ❌ **Não pode** editar ou excluir contas de usuários existentes
- ❌ **Não pode** acessar os logs de auditoria

### 4.3 Moderador

É o responsável por gerenciar **apenas a sua própria delegação**. Ideal para representantes de escolas ou instituições que precisam inscrever seus próprios atletas e montar suas equipes.

- ✅ Ver e cadastrar **participantes** da sua delegação
- ✅ Editar **participantes** da sua delegação
- ✅ Criar, editar e excluir **equipes** da sua delegação
- ✅ Ver a lista de **esportes** disponíveis
- ✅ Trocar a própria senha
- ❌ **Não pode** ver ou alterar dados de outras delegações
- ❌ **Não pode** mover participantes ou equipes para outra delegação
- ❌ **Não pode** excluir participantes
- ❌ **Não pode** criar delegações, esportes ou partidas
- ❌ **Não pode** gerenciar usuários ou ver logs

### 4.4 Participante

O tipo "Participante" **não tem acesso ao painel administrativo**. Este tipo existe apenas como registro — representa atletas e demais membros que não precisam acessar o sistema.

### Resumo visual

| Funcionalidade | Admin Geral | Gerente | Moderador |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Delegações | ✅ Gerenciar | ✅ Gerenciar | ❌ |
| Esportes | ✅ Gerenciar | ✅ Gerenciar | ❌ |
| Participantes | ✅ Todos | ✅ Todos | ✅ Só sua delegação |
| Equipes | ✅ Todos | ✅ Todos | ✅ Só sua delegação |
| Partidas | ✅ Gerenciar | ✅ Gerenciar | ❌ |
| Usuários | ✅ Completo | ✅ Ver + Criar Moderador | ❌ |
| Logs de Auditoria | ✅ | ❌ | ❌ |
| Trocar própria senha | ✅ | ✅ | ✅ |

---

## 5. Telas do Painel Administrativo

### 5.1 Dashboard

A primeira tela após o login. Exibe um resumo geral com números e gráficos sobre o andamento dos jogos:

- Total de delegações, esportes, participantes, equipes e partidas cadastrados
- Gráficos de acompanhamento

### 5.2 Delegações

Permite cadastrar e gerenciar as delegações (cidades, escolas, instituições) que participam dos jogos.

**Para criar uma delegação:**
1. Digite o nome no campo "Nome da delegação"
2. Clique em **"Cadastrar"**

**Para editar:** clique no botão de edição na linha correspondente, altere o nome e salve.

**Para excluir:** clique no botão de exclusão. 

> ⚠️ **Atenção**: Ao excluir uma delegação, todos os participantes, equipes e usuários vinculados a ela também serão removidos do sistema.

### 5.3 Esportes

Permite cadastrar as modalidades esportivas da competição.

**Para criar um esporte:**
1. Preencha o **nome** (ex: "Futsal", "Vôlei de Praia")
2. Selecione a **categoria**: Masculino, Feminino ou Misto
3. Escolha o **turno** (1, 2 ou 3)
4. Defina a **data** da competição
5. Informe a quantidade **mínima** e **máxima** de participantes por equipe
6. Clique em **"Cadastrar Esporte"**

> 💡 Os limites de participantes (mínimo e máximo) serão usados para validar a formação das equipes.

### 5.4 Participantes

Permite registrar atletas e membros de comissão técnica.

**Para cadastrar um participante:**
1. Preencha o **nome completo** e o **nome abreviado**
2. Informe o **CPF** (deve ser um CPF válido e único)
3. Informe o **celular**
4. Selecione a **data de nascimento**
5. Selecione o **sexo** (Masculino ou Feminino)
6. Selecione a **delegação** à qual pertence
7. Selecione o **tipo** (Atleta, Comissão Técnica, Moderador, etc.)
8. Clique em **"Cadastrar Participante"**

> 💡 **Criação automática de conta**: Se o tipo do participante for **Moderador**, **Gerente** ou **Administrador Geral**, o sistema cria automaticamente uma conta de acesso ao sistema. O **login será o CPF** e a **senha inicial também será o CPF**. O usuário deve trocar a senha no primeiro acesso.

### 5.5 Equipes

Permite formar equipes vinculando participantes a um esporte e a uma delegação.

**Para formar uma equipe:**
1. Digite o **nome da equipe** (ex: "Time A - Basquete")
2. Selecione o **esporte/modalidade**
3. Selecione a **delegação**
4. Marque os **participantes** que farão parte da equipe
5. Clique em **"Formar Equipe"**

**Validações automáticas:**
- O número de participantes selecionados deve estar dentro do mínimo e máximo definidos pelo esporte
- Um participante **não pode estar em duas equipes que joguem no mesmo dia e turno** (o sistema impede automaticamente e mostra uma mensagem de erro)

### 5.6 Partidas

Permite registrar as partidas/jogos entre as equipes.

**Para criar uma partida:**
1. Selecione o **esporte**
2. Selecione a **Equipe 1** e a **Equipe 2** (devem ser equipes diferentes)
3. Informe a **fase** (ex: "Final", "Semifinal", "Grupo A")
4. Opcionalmente, preencha o **placar**, a **equipe vencedora** e as **medalhas**
5. Clique para salvar

**Sobre as medalhas:**
- Cada equipe pode receber individualmente uma medalha: **Ouro**, **Prata** ou **Bronze**
- As medalhas atribuídas são automaticamente refletidas no **Quadro de Medalhas** público

### 5.7 Usuários

Permite gerenciar as contas de acesso ao sistema.

**Para criar um usuário:**
1. Informe o **nome**
2. Informe o **CPF** (será o login)
3. Defina a **senha**
4. Selecione o **papel** (Administrador Geral, Gerente, Moderador)
5. Se for Moderador, selecione a **delegação** vinculada
6. Clique para cadastrar

> 💡 Lembre-se: **Gerentes só podem criar contas de Moderador.** Para criar Gerentes ou outros Administradores, é necessário estar logado como Administrador Geral.

### 5.8 Logs de Auditoria

*(Acesso exclusivo do Administrador Geral)*

Exibe o histórico completo de todas as alterações e exclusões feitas no sistema, incluindo:

- **Logs de Alteração**: mostra quem alterou, o que mudou, o valor antigo e o novo, e quando
- **Logs de Exclusão**: mostra quem excluiu, qual registro e quando

Você pode filtrar os logs por:
- **Busca textual** (nome do usuário, CPF, etc.)
- **Tipo de entidade** (delegação, esporte, participante, equipe, partida, usuário)

> 💡 Os logs são úteis para rastrear quem fez cada alteração, servindo como ferramenta de auditoria e transparência.

---

## 6. Como organizar uma competição passo a passo

### Passo 1 — Preparação (Administrador Geral ou Gerente)

1. **Cadastre as delegações** que participarão (ex: "Escola A", "Escola B", "Colégio C")
2. **Cadastre os esportes** com data, turno, categoria e limites de participantes

### Passo 2 — Inscrição de participantes

Existem duas formas:

**Opção A — Centralizada** (Admin ou Gerente faz tudo):
1. Cadastre os participantes de cada delegação manualmente

**Opção B — Descentralizada** (cada delegação cuida da sua inscrição):
1. Crie um **Moderador** para cada delegação (via tela de Participantes com tipo "Moderador" ou via tela de Usuários)
2. Informe ao representante de cada delegação o **CPF** (login) e que a **senha inicial é o CPF**
3. Cada Moderador entra no sistema e cadastra os participantes da sua delegação

### Passo 3 — Formação das equipes

- Na tela de Equipes, vincule participantes de uma delegação a um esporte
- O sistema valida automaticamente:
  - Se há participantes suficientes (mínimo e máximo do esporte)
  - Se nenhum participante tem conflito de horário (já escalado em outro jogo no mesmo dia e turno)

### Passo 4 — Registro das partidas

1. Na tela de Partidas, crie os confrontos selecionando as equipes
2. Após a realização do jogo, edite a partida para registrar:
   - Placar
   - Equipe vencedora
   - Medalhas (quando aplicável — finais, disputa de terceiro lugar, etc.)

### Passo 5 — Acompanhamento público

- O quadro de medalhas e a lista de partidas são atualizados automaticamente
- Qualquer pessoa pode acessar sem login para acompanhar os resultados

---

## 7. Regras importantes do sistema

### Sobre CPF
- O CPF deve ser **válido** (o sistema verifica os dígitos)
- Cada participante e cada usuário deve ter um **CPF único** — não pode haver duplicatas
- O CPF é usado como **login** no sistema

### Sobre exclusões
- Ao excluir uma **delegação**, todos os participantes, equipes e usuários dela são removidos automaticamente
- Ao excluir um **esporte**, todas as equipes e partidas desse esporte são removidas
- Ao excluir uma **equipe**, todas as partidas que envolvam essa equipe são removidas
- Ao excluir um **participante**, ele é removido de todas as equipes em que estava inscrito
- As exclusões **não são permanentes** — o sistema mantém o histórico nos logs de auditoria

### Sobre equipes e conflito de horário
- Um mesmo participante **não pode jogar em dois esportes ao mesmo tempo** (mesma data e mesmo turno)
- Se você tentar adicionar um participante que já está escalado em outro jogo no mesmo horário, o sistema mostrará um erro explicando o conflito

### Sobre partidas e medalhas
- As duas equipes de uma partida devem ser **diferentes**
- Medalhas (Ouro, Prata, Bronze) são atribuídas **por equipe** em cada partida
- O **Quadro de Medalhas** público é calculado automaticamente a partir das medalhas atribuídas

### Sobre usuários e senhas
- Senhas devem ter no mínimo **4 caracteres**
- Para trocar a senha, é necessário informar a **senha atual**
- O sistema limita tentativas de login a **5 por 15 minutos** para segurança
- O Administrador Geral **não pode excluir outro Administrador Geral**, nem a **própria conta**

---

## 8. Perguntas frequentes

### Como crio uma conta para o representante de uma delegação?

Existem duas formas:
1. **Via Participantes**: cadastre o representante como participante com tipo "Moderador". O sistema cria a conta automaticamente (login = CPF, senha = CPF).
2. **Via Usuários**: crie diretamente uma conta com papel "Moderador" e vincule à delegação.

### Um participante pode jogar em mais de um esporte?

**Sim**, desde que os esportes não ocorram no **mesmo dia e turno**. O sistema faz essa verificação automaticamente ao formar a equipe.

### O que acontece se eu excluir uma delegação?

Todos os dados vinculados à delegação são removidos: participantes, equipes, contas de usuário. As partidas que envolviam equipes dessa delegação também são afetadas. Por isso, tenha cuidado ao excluir delegações durante a competição.

### Quem pode ver os logs de auditoria?

Apenas o **Administrador Geral**. Os logs registram todas as alterações e exclusões feitas no sistema, incluindo quem fez cada ação.

### O Moderador pode excluir participantes?

**Não.** O Moderador pode cadastrar e editar participantes da sua delegação, mas não pode excluí-los. Apenas Administradores Gerais e Gerentes podem excluir participantes.

### O que o público pode ver?

Qualquer pessoa pode acessar o sistema sem login e visualizar:
- A lista de **partidas** com placares e resultados
- O **quadro de medalhas** (ranking) das delegações

### A senha do moderador é segura?

Ao criar um moderador via participante, a senha inicial é o **CPF**. Por segurança, oriente cada moderador a **trocar a senha no primeiro acesso** usando o botão "Trocar Senha" no menu lateral.

### Posso editar uma partida depois de registrar o placar?

**Sim.** Administradores Gerais e Gerentes podem editar qualquer partida a qualquer momento — alterando placar, equipe vencedora, fase e medalhas.

### O que acontece com os dados quando eu "excluo" algo?

O sistema usa **exclusão lógica**: os registros não são apagados do banco de dados, apenas marcados como excluídos. Isso permite manter o histórico completo nos logs de auditoria.

---

<div align="center">

**Sistema de Gestão Esportiva** — Manual do Usuário
Desenvolvido pela [e-946 Consultoria](https://www.instagram.com/e946consultoria/)

</div>
