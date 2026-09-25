import type { TimelineEvent } from "@portal/shared";

/**
 * Tradutor de andamentos jurídicos para linguagem simples.
 *
 * Cada padrão gera duas coisas para o cliente:
 * - `plain`: um título curto (uma frase), para escanear a timeline rápido.
 * - `explanation`: uma explicação de verdade, em 1-2 frases — o que
 *   aconteceu, o que isso significa e o que vem a seguir (ou se não há
 *   nada a fazer). É o que evita o cliente ligar perguntando "o que isso
 *   quer dizer?" — não basta só o título.
 *
 * Os casos mockados já trazem `plainText`/`explanation` prontos. Este
 * dicionário é o ponto de partida para quando os andamentos passarem a
 * vir direto do ADVBOX (que fornece só o texto jurídico original) —
 * basta ir expandindo os padrões conforme os tipos de movimentação mais
 * comuns do escritório forem mapeados.
 */
const PATTERNS: Array<{ match: RegExp; plain: string; explanation: string }> = [
  {
    match: /distribui[cç][aã]o/i,
    plain: "Seu processo foi formalmente aberto na Justiça.",
    explanation:
      "Seu pedido foi registrado oficialmente e distribuído para uma vara. A partir daqui, a outra parte vai ser notificada para se manifestar, dando início ao andamento do processo.",
  },
  {
    match: /jun[dt]ada de peti[cç][aã]o inicial/i,
    plain: "Seu processo foi protocolado.",
    explanation:
      "O pedido inicial foi registrado formalmente. A próxima etapa é a citação: a outra parte vai ser avisada oficialmente sobre o processo para poder se defender.",
  },
  {
    match: /jun[dt]ada de contesta[cç][aã]o/i,
    plain: "A outra parte respondeu ao processo.",
    explanation:
      "A outra parte apresentou a defesa dela, contestando o que foi pedido. Isso é uma etapa normal e esperada — agora seu advogado vai analisar os argumentos e preparar a próxima manifestação.",
  },
  {
    match: /audi[eê]ncia designada|design[aã]o de audi[eê]ncia/i,
    plain: "Uma audiência foi marcada para o seu processo.",
    explanation:
      "O juiz marcou uma data para ouvir as partes envolvidas. Seu advogado vai te avisar com antecedência sobre data, horário e o que levar ou preparar.",
  },
  {
    match: /senten[cç]a/i,
    plain: "O juiz proferiu uma decisão (sentença) no seu processo.",
    explanation:
      "O juiz decidiu o processo. Seu advogado vai analisar o teor da decisão e te explicar o que ela significa na prática e quais são os próximos passos (inclusive se cabe recurso).",
  },
  {
    match: /jun[dt]ada de peti[cç][aã]o/i,
    plain: "Seu advogado enviou um documento ao processo.",
    explanation:
      "Seu advogado protocolou um novo documento ou manifestação no processo, dando andamento ao seu caso. Você não precisa fazer nada agora.",
  },
];

const DEFAULT_PLAIN = "Houve uma nova movimentação no seu processo.";
const DEFAULT_EXPLANATION =
  "Seu advogado já está ciente dessa movimentação e vai te avisar assim que houver alguma novidade importante ou se for necessário fazer algo.";

export function translateLegalText(originalText: string): string {
  const hit = PATTERNS.find((p) => p.match.test(originalText));
  return hit ? hit.plain : DEFAULT_PLAIN;
}

export function explainLegalText(originalText: string): string {
  const hit = PATTERNS.find((p) => p.match.test(originalText));
  return hit ? hit.explanation : DEFAULT_EXPLANATION;
}

/**
 * Tipos de movimentação que NÃO devem chegar ao cliente pelo portal.
 *
 * São movimentações que são só ruído para quem não é da área jurídica —
 * o cliente não entende do que se trata, fica preocupado ou confuso, e
 * liga para o escritório perguntando. Ex. real que motivou este filtro:
 *
 *   "Requisição de pagamento de pequeno valor paga - liberada - Saque a
 *   partir de 12/08/2026 - 5092492-25.2026.4.02.9666/TRF2"
 *
 *   "Requisição de pagamento de pequeno valor enviada ao Tribunal -
 *   Requisição no. 26500011538 processada no TRF2 com o no.
 *   5092492-25.2026.4.02.9666/TRF2"
 *
 * Movimentações assim continuam disponíveis para a equipe do escritório
 * (o andamento completo do processo, incluindo essas linhas, é o que a
 * API do ADVBOX devolve) — só não entram na linha do tempo que o cliente
 * vê. Se uma movimentação escondida for, na prática, uma ação que o
 * cliente precisa tomar (ex.: sacar um valor), isso deve ser comunicado
 * pelo `nextAction` do processo, não pela linha do tempo.
 */
const HIDDEN_FROM_CLIENT_PATTERNS: RegExp[] = [
  // RPV (Requisição de Pequeno Valor) — movimentação financeira/administrativa
  // interna do trâmite de pagamento, não é novidade que o cliente precise ver.
  /requisi[cç][aã]o de pagamento de pequeno valor/i,
];

export function isHiddenFromClient(originalText: string): boolean {
  return HIDDEN_FROM_CLIENT_PATTERNS.some((pattern) => pattern.test(originalText));
}

export interface RawAdvboxMovement {
  date: string;
  /** Texto jurídico original, como a API do ADVBOX devolve. */
  text: string;
}

/**
 * Converte movimentações cruas do ADVBOX na linha do tempo que o cliente
 * vê: aplica o filtro de visibilidade (`isHiddenFromClient`) e traduz o
 * texto jurídico restante para linguagem simples (`translateLegalText`).
 *
 * Ainda não é chamada em produção — os processos mockados já trazem a
 * timeline pronta —, mas é o ponto de entrada a usar quando
 * `AdvboxClient` passar a buscar as movimentações reais da API do
 * ADVBOX, para que o filtro nunca seja esquecido.
 */
export function movementsToClientTimeline(movements: RawAdvboxMovement[]): TimelineEvent[] {
  return movements
    .filter((movement) => !isHiddenFromClient(movement.text))
    .map((movement, index) => ({
      id: `tl_${index}`,
      date: movement.date,
      plainText: translateLegalText(movement.text),
      explanation: explainLegalText(movement.text),
      originalText: movement.text,
    }));
}
