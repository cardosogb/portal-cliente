export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDatePtBR(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const AREA_LABELS: Record<string, string> = {
  trabalhista: "Trabalhista",
  previdenciario: "Previdenciário",
  civel: "Cível",
  familia: "Família",
  outro: "Outro",
};

export function areaLabel(area: string): string {
  return AREA_LABELS[area] ?? area;
}

const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
  suspenso: "Suspenso",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/**
 * Explicações em linguagem simples para as fases mais comuns de um
 * processo, para clientes sem formação jurídica. Usado como legenda
 * abaixo do nome técnico da fase (ex.: "Instrução").
 */
const PHASE_EXPLANATIONS: Record<string, string> = {
  "Distribuição": "Seu caso acabou de ser registrado na Justiça.",
  "Citação": "A outra parte está sendo avisada oficialmente sobre o processo.",
  "Instrução": "É a fase de reunir provas e ouvir testemunhas, antes da decisão.",
  "Sentença": "O juiz já decidiu ou está prestes a decidir o caso.",
  "Recurso": "Uma das partes pediu para um tribunal maior revisar a decisão.",
  "Execução": "A decisão já foi tomada e agora é hora de cumpri-la (ex.: pagamento).",
};

export function phaseExplanation(phase: string): string {
  return PHASE_EXPLANATIONS[phase] ?? "Seu processo está em andamento nesta etapa.";
}
