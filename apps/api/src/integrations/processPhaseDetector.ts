import { PHASE_ORDER, type ProcessStatus } from "@portal/shared";

/**
 * O ADVBOX não tem um campo "fase judicial do processo" (Distribuição,
 * Citação, Instrução...) — o que ele chama de `stage`/`step` é o quadro
 * kanban interno do escritório (ex.: "MARKETING", "NEGOCIAÇÃO",
 * "JUDICIAL", "RH/FINANCEIRO"), usado pra gestão do fluxo de trabalho do
 * escritório inteiro, não a fase do processo na Justiça. Confirmado
 * olhando a conta real: `stages.step` tem só 9 valores, nenhum deles é
 * uma fase judicial.
 *
 * Este detector infere a fase e o status a partir do TEXTO das
 * movimentações reais do tribunal (`GET /movements/{lawsuit_id}`, campo
 * `title`) — é best-effort: um processo com movimentação atípica ou um
 * tribunal com nomenclatura diferente pode classificar errado. Prefira
 * isso a confiar em `status_closure` do ADVBOX, que (confirmado com dados
 * reais) marca quando aquele CARD DO KANBAN foi fechado, não quando o
 * processo foi encerrado na Justiça — um processo com `status_closure`
 * preenchido pode estar bem no meio do trâmite judicial.
 */

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

interface PhaseRule {
  phase: (typeof PHASE_ORDER)[number];
  pattern: RegExp;
}

const PHASE_RULES: PhaseRule[] = [
  { phase: "Distribuição", pattern: /distribui[cç]ao|autua[cç]ao/i },
  { phase: "Citação", pattern: /cita[cç]ao|cite-se|citado/i },
  { phase: "Instrução", pattern: /audi[ee]ncia|instru[cç]ao|per[ii]cia|contesta[cç]ao/i },
  { phase: "Sentença", pattern: /senten[cç]a/i },
  { phase: "Recurso", pattern: /recurso|apela[cç]ao|agravo|embargos/i },
  { phase: "Execução", pattern: /execu[cç]ao|cumprimento de senten[cç]a|penhora/i },
];

/**
 * Sinaliza processo encerrado de verdade na Justiça — visto em dados
 * reais (ex.: "Transitado em Julgado", "Baixa Definitiva").
 */
const TERMINAL_PATTERN = /transito em julgado|baixa definitiva|extin[cç]ao do processo|processo extinto|arquivado definitivamente/i;

export interface MovementForDetection {
  date: string;
  title: string;
}

export interface DetectedPhase {
  currentPhase: string;
  status: ProcessStatus;
  concludedAt?: string;
}

/**
 * Nunca retrocede fase: pega o índice mais avançado entre todas as
 * movimentações, não só a mais recente (uma movimentação de rotina depois
 * da sentença não deve "voltar" a fase pra Instrução).
 */
export function detectPhaseAndStatus(movements: MovementForDetection[]): DetectedPhase {
  let phaseIndex = 0;
  let concludedAt: string | undefined;

  for (const m of movements) {
    const text = stripAccents(m.title);
    for (let i = 0; i < PHASE_RULES.length; i++) {
      if (PHASE_RULES[i].pattern.test(text) && i > phaseIndex) {
        phaseIndex = i;
      }
    }
    if (TERMINAL_PATTERN.test(text)) {
      phaseIndex = PHASE_RULES.length - 1; // Execução — última etapa do stepper
      if (!concludedAt || m.date < concludedAt) concludedAt = m.date;
    }
  }

  return {
    currentPhase: PHASE_ORDER[phaseIndex],
    status: concludedAt ? "concluido" : "em_andamento",
    concludedAt,
  };
}
