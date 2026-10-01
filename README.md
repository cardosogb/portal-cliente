# Portal do Cliente — Fernando Miranda Advogados

Sistema de acompanhamento processual para clientes do escritório, com **site**,
**app mobile (iOS e Android)** e **API**, integrando (futuramente) com o
**ADVBOX** e o **WhatsApp Business API**. Baseado no protótipo visual e na
proposta comercial originais deste projeto.

## Estrutura do monorepo (pnpm workspaces)

```
apps/
  api/      API REST em Node/Express/TypeScript
  web/      Portal do cliente (site) em Next.js
  mobile/   App iOS/Android em React Native (Expo)
packages/
  shared/   Tipos de domínio, dados mockados e formatação, usados por todos os apps
```

## Como rodar localmente

Pré-requisitos: Node 20+, pnpm.

```bash
pnpm install

# API (porta 4000)
pnpm dev:api

# Site (porta 3000) — em outro terminal
pnpm dev:web

# App mobile — em outro terminal (abre o Expo, use o app Expo Go ou emulador)
pnpm dev:mobile
```

O login é feito por **CPF + data de nascimento** (apenas dia e mês, formato
`DDMM` — ex.: nascido em 5 de março → `0503`), em vez de e-mail e senha. O
CPF é digitado sem pontuação (só os 11 números — sem `.` ou `-`).
Login de demonstração:
- Cliente: CPF `12345678909`, nascimento `1204` → cai no portal do cliente.
- Equipe do escritório (acesso padrão): CPF `11122233396` **ou telefone**
  `27998210707`, nascimento `2207` → cai direto no painel interno. O perfil
  é identificado automaticamente no login — não existe um botão para
  "trocar" de portal.
- Equipe do escritório (acesso executivo — TI/Diretoria/CEO): CPF
  `22233344405` (TI), `33344455516` (Diretoria) ou `44455566627` (CEO),
  nascimento `1402`, `0905` ou `0311` respectivamente → além do painel
  comum, vêem o botão "Dashboard executivo".

**Cadastro de funcionários:** não existe tela de cadastro manual para a
equipe do escritório. Quando a API real (ADVBOX e/ou o diretório de
funcionários) for conectada em `apps/api/src/integrations/staffDirectory.ts`,
qualquer pessoa que já esteja cadastrada lá consegue entrar assim que tentar
pela primeira vez, informando CPF **ou telefone** + data de nascimento — o
mesmo padrão do login do cliente. Isso evita depender de alguém lembrar de
criar uma conta manualmente cada vez que uma pessoa nova é contratada.

⚠️ Nota de segurança: usar só o dia e o mês de nascimento como senha é uma
simplificação da proposta original, pensada para reduzir fricção no MVP —
o espaço de senhas é pequeno (366 combinações) e previsível. Por isso a API
já trava a conta por 15 minutos depois de 5 tentativas erradas com o mesmo
CPF/telefone (`apps/api/src/loginLockout.ts`), além de um limite geral por
IP (`express-rate-limit`). Ainda assim, antes de ir para produção vale
reforçar com 2FA (ex.: código por SMS/WhatsApp) e/ou trocar para a senha
completa (DDMMAAAA).

### Protocolos de segurança já na API

- **Cabeçalhos de segurança** via `helmet()` (HSTS, `X-Frame-Options`,
  `X-Content-Type-Options`, etc.) em `apps/api/src/server.ts`.
- **CORS restrito**: em produção, só os domínios listados em
  `ALLOWED_ORIGINS` (separados por vírgula) podem chamar a API; sem essa
  variável configurada, a API bloqueia tudo em vez de liberar geral. Em
  desenvolvimento local continua liberado, por conveniência.
- **Segredo do JWT obrigatório em produção**: a API se recusa a subir com
  `NODE_ENV=production` se `JWT_SECRET` não estiver configurado com um
  valor próprio — o padrão de desenvolvimento nunca vai para produção por
  descuido (`assertProductionSecrets()` em `apps/api/src/auth.ts`).
- **Trava de força bruta por conta** (não só por IP) no login, descrita
  acima — importante justamente pelo espaço pequeno de senhas.
- **Tokens JWT com expiração** (7 dias) em vez de sessão permanente.
- **Mensagens de erro genéricas** ("Credenciais inválidas") em vez de
  indicar se o CPF/telefone existe ou não, para não facilitar a
  descoberta de contas válidas.
- **Sessão em cookie `httpOnly`** (`apps/api/src/auth.ts`,
  `sessionCookieOptions()`), não em `localStorage`: o JavaScript da página
  não consegue ler o token, o que reduz bastante o estrago de um XSS. O
  site usa `credentials: "include"` em toda chamada e descobre quem está
  logado perguntando para `GET /auth/me` (o cookie vai junto sozinho) — ver
  `getSession()` em `apps/web/src/lib/api.ts`. O app mobile, que não tem
  esse conceito de cookie, continua mandando o token por
  `Authorization: Bearer` (a API aceita os dois).
- **Revogação de sessão** (`apps/api/src/sessionStore.ts`): cada login gera
  um `jti` único, guardado em memória; `POST /auth/logout` revoga esse
  `jti` imediatamente, então o token para de funcionar mesmo antes de
  expirar. Isso também prepara o terreno para revogar todas as sessões de
  alguém de uma vez (`revokeAllSessionsFor`) — útil quando uma pessoa é
  desligada ou uma conta é comprometida.
- **Validação de entrada com `zod`** em vez de checagem manual campo a
  campo (`apps/api/src/middleware/validate.ts`), aplicada em `/auth/login`
  e `/processes/:id`.
- **Log de auditoria do painel interno** (`apps/api/src/auditLog.ts`):
  toda requisição de um funcionário ao painel fica registrada (quem, o
  quê, quando) e pode ser consultada em `GET /admin/audit-log` — também
  visível dentro do próprio painel, em "Ver log de acessos".
- **Rate limit por rota**, não só no login: `/processes` e `/admin`
  também têm limites próprios.
- **CSP customizado** no site (`apps/web/next.config.js`): só permite
  carregar script/estilo/imagem do próprio domínio e do Google Fonts, e
  chamar a API do portal — nada mais de terceiros.
- **Aviso de privacidade** em `/privacidade`, com o que é coletado, para
  que serve, como é protegido e os direitos da pessoa — link na tela de
  login. É um rascunho-base em linguagem simples; precisa ser revisado por
  um advogado antes de valer como política real.

⚠️ Nota sobre CSRF: como a sessão agora fica num cookie, uma requisição
forjada de outro site poderia em tese tentar usá-lo. `sameSite: "lax"` já
impede o navegador de mandar esse cookie em requisições cross-site, e hoje
a API não tem nenhuma rota que grava dados a partir do painel (é só
leitura) — por isso não há um token CSRF separado ainda. Se uma rota que
grava dados for adicionada no futuro, ela precisa desse reforço.

Variáveis de ambiente da API (`apps/api`): `JWT_SECRET` (obrigatório em
produção), `ALLOWED_ORIGINS` (ex.: `https://portal.fernandomiranda.adv.br`),
`NODE_ENV=production`, `PORT`.

O site usa `NEXT_PUBLIC_API_URL` (padrão `http://localhost:4000`) e o app
mobile usa `extra.apiUrl` em `apps/mobile/app.json` para apontar para a API.
Ao rodar o app mobile em um celular físico, troque `localhost` pelo IP da
máquina que está rodando a API.

## Estado atual: dados mockados

Toda a aplicação hoje funciona com **dados simulados** (`packages/shared/src/mockData.ts`),
para que site, app e API possam ser desenvolvidos e demonstrados sem depender
de credenciais reais do ADVBOX ou de um provedor de WhatsApp. Os pontos de
integração já estão isolados em adapters, prontos para receber a implementação
real:

- `apps/api/src/integrations/advboxAdapter.ts` — hoje devolve dados mockados;
  quando o escritório contratar a **API do ADVBOX ("API para Escritórios")**,
  troca-se `MockAdvboxClient` por um client HTTP real, sem alterar rotas nem
  telas.
- `apps/api/src/integrations/whatsappAdapter.ts` — hoje só loga a mensagem;
  quando um provedor homologado pela Meta for escolhido (Twilio, Z-API,
  Gupshup), implementa-se `WhatsappClient` de verdade. Os templates de
  mensagem (`movimentacao`, `acao_pendente`, `relacionamento`,
  `pesquisa_satisfacao`) já seguem a exigência de templates pré-aprovados
  pela Meta descrita na proposta original.
- `apps/api/src/integrations/legalTranslator.ts` — dicionário inicial para
  traduzir andamentos jurídicos (como vêm do ADVBOX) em linguagem simples
  para o cliente; deve ser expandido conforme os tipos de movimentação mais
  comuns do escritório. Também é aqui que fica o **filtro de movimentações
  que não devem chegar ao cliente** (`isHiddenFromClient` /
  `movementsToClientTimeline`) — andamentos que só geram confusão e
  ligações desnecessárias ao escritório, como os de RPV (Requisição de
  Pequeno Valor). Quando a integração real do ADVBOX for implementada, a
  timeline do cliente **precisa** passar por esse filtro antes de
  qualquer exibição; a lista de padrões ocultos deve ser expandida
  conforme mais casos como esse forem identificados.
- `packages/shared/src/contact.ts` — número de WhatsApp do escritório usado
  no botão "Enviar pelo WhatsApp do escritório" (mostrado quando há uma
  pendência do cliente).
- `apps/api/src/integrations/processHealth.ts` — calcula "dias sem
  movimentação" e se um processo está "parado" (`isStale`), sempre a
  partir de `LegalProcess.lastMovementAt`. **Esse campo precisa vir
  direto da movimentação mais recente que a API do ADVBOX devolver, sem
  passar pelo filtro de `movementsToClientTimeline`** — se viesse da
  timeline já filtrada pro cliente, um processo com só uma RPV recente
  (escondida do cliente) apareceria como "parado" pra equipe sem estar.
  O número nunca é salvo em nenhum lugar (nem banco, nem cache) — é
  recalculado a cada requisição em cima do dado do ADVBOX, então nunca
  pode divergir do que o próprio ADVBOX mostra.

## Funcionalidades implementadas (MVP)

Do escopo da proposta original, a Fase 1 (MVP) e parte da Fase 3 já estão
prototipadas end-to-end (com dados mockados):

- [x] Login individual por cliente
- [x] Linha do tempo do processo, com título curto + explicação em
      linguagem simples (o que aconteceu, o que significa e o que vem a
      seguir — não só um título) para cada andamento, com opção de ver
      o texto jurídico original por baixo
- [x] Indicação da fase atual e previsão de prazo
- [x] Ação pendente do cliente em destaque (ex.: "envie um documento até X"),
      com botão para resolver a pendência diretamente pelo WhatsApp do
      escritório (não há mais um canal de mensagens dentro do portal)
- [x] Documentos do processo para download
- [x] Painel financeiro (parcelas pagas/pendentes)
- [x] Painel interno do escritório: busca de clientes/processos, aviso de
      "dias sem movimentação" por processo (calculado a partir de
      `LegalProcess.lastMovementAt`, nunca armazenado à parte — ver nota
      de arquitetura abaixo), satisfação por advogado
- [x] Dashboard executivo (`/admin/executivo`), restrito a quem tem
      `StaffUser.accessLevel === "executivo"` (hoje TI, Diretoria e CEO):
      visão agregada de processos (por status/área, total parado) e
      desenvolvimento por advogado (ativos/concluídos/parados/satisfação).
      Trava dupla no servidor (`requireRole("escritorio")` +
      `requireAccessLevel("executivo")`) — o link só aparece pra quem tem
      acesso, mas a rota em si também recusa quem não tem, mesmo entrando
      pela URL direto

Ainda não implementado (depende de integrações externas reais):

- [ ] Notificações automáticas por WhatsApp (adapter pronto, falta provedor)
- [ ] Mensagens de relacionamento automáticas (aniversário etc.)
- [ ] Pesquisa de satisfação automática em marcos do processo
- [ ] Integração real com a API do ADVBOX (adapter pronto, falta o plano
      contratado e as credenciais)

## Roadmap sugerido (alinhado à proposta original)

1. **Contratar a API do ADVBOX** ("API para Escritórios") e implementar
   `AdvboxClient` real.
2. **Validar o MVP** com um grupo pequeno de clientes (site web).
3. **Escolher provedor de WhatsApp Business API** e implementar
   `WhatsappClient` real; ativar notificações automáticas de movimentação.
4. **Painel financeiro e mensagens de relacionamento** (Fase 3).
5. **Publicar o app mobile nas lojas** (App Store / Google Play) — a base em
   Expo/React Native já compartilha tipos e lógica com o site via
   `packages/shared`.

## Publicação do app nas lojas (visão geral)

O app em `apps/mobile` é construído com [Expo](https://expo.dev). Para gerar
os binários de loja:

```bash
cd apps/mobile
npx eas build --platform ios
npx eas build --platform android
```

Isso requer uma conta Expo/EAS e, para iOS, uma conta Apple Developer; para
Android, uma conta Google Play Developer. Esses cadastros e custos (contas de
desenvolvedor) não estão incluídos nos custos recorrentes já estimados na
proposta original e devem ser somados ao orçamento do projeto.
