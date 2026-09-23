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
