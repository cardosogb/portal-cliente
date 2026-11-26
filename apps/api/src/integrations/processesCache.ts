/**
 * Sincronização periódica de TODOS os processos do escritório, só para o
 * painel interno (`GET /admin/overview`, `GET /admin/executive-overview`).
 *
 * Por que isso existe em vez de buscar ao vivo a cada request: a conta
 * real tem ~30 mil registros em `/lawsuits`, e o ADVBOX limita a 30
 * GET/min. Buscar a movimentação de cada processo individualmente para
 * calcular "parado há N dias" exigiria ~30 mil chamadas — inviável.
 * `GET /last_movements` resolve isso trazendo a movimentação mais recente
 * de cada processo em lote (paginado), então uma sincronização completa
 * usa só ~60 chamadas (lawsuits + last_movements, 1000 por página) em vez
 * de dezenas de milhares.
 *
 * Implementação em memória, 1 instância só — mesma limitação já
 * documentada em loginLockout.ts/sessionStore.ts. Em mais de uma
 * instância da API, isso precisa virar um cache compartilhado (Redis) ou
 * um job de sincronização separado gravando num banco.
 */
import type { LegalProcess } from "@portal/shared";
import { fetchAllPages, isRealLawsuit, mapArea, type AdvboxLawsuit, type AdvboxMovement } from "./advboxRealClient";
import { detectPhaseAndStatus } from "./processPhaseDetector";

const SYNC_INTERVAL_MS = 20 * 60 * 1000; // 20 minutos

let cachedProcesses: LegalProcess[] = [];
let lastSyncAt = 0;
let syncInFlight: Promise<void> | null = null;

function mapLawsuitLight(l: AdvboxLawsuit, lastMovement: AdvboxMovement | undefined): LegalProcess {
  const movements = lastMovement ? [{ date: lastMovement.date, title: lastMovement.title }] : [];
  const { currentPhase, status, concludedAt } = detectPhaseAndStatus(movements);
  const primaryCustomer = l.customers[0];

  return {
    id: String(l.id),
    clientId: primaryCustomer ? String(primaryCustomer.customer_id) : "",
    clientName: primaryCustomer?.name,
    number: l.process_number ?? "",
    area: mapArea(l.group),
    court: lastMovement?.header ?? "Não informado",
    status,
    currentPhase,
    startedAt: l.process_date ?? "",
    concludedAt,
    lawyerName: l.responsible ?? "—",
    nextAction: { type: "ok", text: "Nenhuma ação necessária no momento." },
    forecast: "",
    lastMovementAt: lastMovement?.date ?? l.process_date ?? "",
    // A visão de painel interno não precisa da timeline/documentos/
    // financeiro completos (não são exibidos na tabela de admin) — evita
    // buscar isso para 30 mil processos de uma vez só.
    timeline: [],
    documents: [],
    financial: [],
  };
}

async function runSync(): Promise<void> {
  const [lawsuits, lastMovements] = await Promise.all([
    fetchAllPages<AdvboxLawsuit>("/lawsuits", {}, 1000),
    fetchAllPages<AdvboxMovement>("/last_movements", {}, 1000),
  ]);

  const lastMovementByLawsuit = new Map<number, AdvboxMovement>();
  for (const m of lastMovements) lastMovementByLawsuit.set(m.lawsuit_id, m);

  cachedProcesses = lawsuits
    .filter(isRealLawsuit)
    .map((l) => mapLawsuitLight(l, lastMovementByLawsuit.get(l.id)));
  lastSyncAt = Date.now();
}

/**
 * Retorna o cache atual na hora (nunca faz o painel interno esperar uma
 * sincronização inteira). Se nunca sincronizou ainda, espera a primeira
 * vez; depois disso, dispara a próxima sincronização em segundo plano
 * quando o cache estiver velho, sem bloquear quem está pedindo os dados.
 */
export async function getCachedProcesses(): Promise<LegalProcess[]> {
  if (lastSyncAt === 0) {
    if (!syncInFlight) syncInFlight = runSync().finally(() => (syncInFlight = null));
    await syncInFlight;
  } else if (Date.now() - lastSyncAt > SYNC_INTERVAL_MS && !syncInFlight) {
    syncInFlight = runSync().finally(() => (syncInFlight = null));
  }
  return cachedProcesses;
}
