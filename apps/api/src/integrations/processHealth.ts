import type { LegalProcess } from "@portal/shared";

/**
 * "Dias sem movimentação" de um processo, sempre calculado em cima de
 * `LegalProcess.lastMovementAt` — a data da movimentação mais recente,
 * direto do ADVBOX, sem passar pelo filtro do que aparece pro cliente
 * (por isso não usa `timeline`: ela pode esconder a movimentação mais
 * recente, ex. uma RPV, e o número ficaria errado). Nunca é armazenado
 * separadamente (ex.: um campo salvo por um job) — é sempre recalculado
 * na hora, a cada requisição, então não pode divergir da fonte de
 * verdade que é o próprio ADVBOX.
 */
export const STALE_DAYS_THRESHOLD = 15;

export function daysSinceLastMovement(process: LegalProcess): number | null {
  if (!process.lastMovementAt) return null;
  const diffMs = Date.now() - new Date(process.lastMovementAt).getTime();
  return Math.floor(diffMs / 86_400_000);
}

export function isStale(process: LegalProcess): boolean {
  if (process.status !== "em_andamento") return false;
  const days = daysSinceLastMovement(process);
  return days === null || days > STALE_DAYS_THRESHOLD;
}
