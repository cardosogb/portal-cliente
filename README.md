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

Login de demonstração: e-mail `maria.souza@example.com`, qualquer senha.

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
  comuns do escritório.

## Funcionalidades implementadas (MVP)

Do escopo da proposta original, a Fase 1 (MVP) e parte da Fase 3 já estão
prototipadas end-to-end (com dados mockados):

- [x] Login individual por cliente
- [x] Linha do tempo do processo, com tradução para linguagem simples e
      opção de ver o texto jurídico original
- [x] Indicação da fase atual e previsão de prazo
- [x] Ação pendente do cliente em destaque (ex.: "envie um documento até X")
- [x] Documentos do processo para download
- [x] Painel financeiro (parcelas pagas/pendentes)
- [x] Canal de mensagem direta com o advogado
- [x] Painel interno do escritório (clientes/processos, processos parados,
      satisfação por advogado)

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
