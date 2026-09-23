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
