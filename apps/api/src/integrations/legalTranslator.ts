import type { TimelineEvent } from "@portal/shared";

/**
 * Tradutor de andamentos jurídicos para linguagem simples.
 *
 * Os casos mockados já trazem `plainText` pronto. Este dicionário é o
 * ponto de partida para quando os andamentos passarem a vir direto do
 * ADVBOX (que fornece o texto jurídico original, não a versão simples) —
 * basta ir expandindo os padrões conforme os tipos de movimentação mais
 * comuns do escritório forem mapeados.
 */
const PATTERNS: Array<{ match: RegExp; plain: string }> = [
  { match: /distribui[cç][aã]o/i, plain: "Seu processo foi formalmente aberto na Justiça." },
  { match: /jun[dt]ada de peti[cç][aã]o inicial/i, plain: "Seu processo foi protocolado — próxima etapa: citação da parte contrária." },
  { match: /jun[dt]ada de contesta[cç][aã]o/i, plain: "A outra parte respondeu ao processo." },
  { match: /audi[eê]ncia designada|design[aã]o de audi[eê]ncia/i, plain: "Uma audiência foi marcada para o seu processo." },
  { match: /senten[cç]a/i, plain: "O juiz proferiu uma decisão (sentença) no seu processo." },
  { match: /jun[dt]ada de peti[cç][aã]o/i, plain: "Seu advogado enviou um documento ao processo." },
];

export function translateLegalText(originalText: string): string {
  const hit = PATTERNS.find((p) => p.match.test(originalText));
  return hit ? hit.plain : "Houve uma nova movimentação no seu processo.";
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
      originalText: movement.text,
    }));
}
