/**
 * Sincronização periódica dos prazos/intimações do escritório inteiro,
 * só para o painel interno (dashboard executivo). Mesmo padrão de
 * `processesCache.ts`: busca em lote de tempos em tempos em vez de ao
 * vivo a cada request.
 *
 * `GET /publications` (intimações recebidas do Diário da Justiça, com
 * prazo) só aceita uma janela de até 31 dias por chamada quando não há
 * filtro de processo/cliente — por isso a sincronização busca os
 * últimos 31 dias (`received_at`) e filtra, dali, só o que tem prazo
 * (`deadline_start`) ainda não vencido e não concluído. Prazos vindos de
 * intimações recebidas há mais de 31 dias não entram aqui — na prática
 * a grande maioria dos prazos processuais é contada a partir da
 * intimação, então essa janela cobre o que importa sem precisar de
 * múltiplas chamadas por sincronização.
 */
import { advboxGet } from "./advboxRealClient";
import type { DeadlineItem } from "./advboxAdapter";

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
const WINDOW_DAYS = 31;

interface AdvboxPublication {
  process_number: string | null;
  court: string | null;
  customers: string | null;
  deadline_start: string | null;
  term: string | null;
  status: string | null;
}

interface PublicationsPage {
  offset: number;
  limit: number;
  totalCount: number;
  data: AdvboxPublication[];
}

async function fetchRecentPublications(): Promise<AdvboxPublication[]> {
  const today = new Date();
  const start = new Date(today.getTime() - (WINDOW_DAYS - 1) * 86_400_000);
  const dateStart = start.toISOString().slice(0, 10);
  const dateEnd = today.toISOString().slice(0, 10);

  const out: AdvboxPublication[] = [];
  let offset = 0;
  for (;;) {
    const page = await advboxGet<PublicationsPage>("/publications", {
      date_start: dateStart,
      date_end: dateEnd,
      limit: 100,
      offset,
    });
    if (!page || page.data.length === 0) break;
    out.push(...page.data);
    offset += page.data.length;
    if (offset >= page.totalCount) break;
  }
  return out;
}

let cachedDeadlines: DeadlineItem[] = [];
let lastSyncAt = 0;
let syncInFlight: Promise<void> | null = null;

async function runSync(): Promise<void> {
  try {
    const publications = await fetchRecentPublications();
    const todayStr = new Date().toISOString().slice(0, 10);

    cachedDeadlines = publications
      .filter((p) => p.deadline_start && p.deadline_start >= todayStr && p.status !== "completed")
      .map((p) => ({
        date: p.deadline_start!,
        lawyerName: p.term ?? "—",
        clientName: p.customers ?? "—",
        processNumber: p.process_number ?? "—",
        court: p.court ?? "—",
      }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    lastSyncAt = Date.now();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[publicationsCache] sincronização com o ADVBOX falhou:", err);
    // Mantém o cache anterior (mesmo vazio, na primeira vez) em vez de
    // travar — a próxima chamada tenta de novo quando o TTL vencer.
  }
}

/** Mesmo comportamento de `getCachedProcesses`: nunca bloqueia além da primeira sincronização. */
export async function getCachedDeadlines(): Promise<DeadlineItem[]> {
  if (lastSyncAt === 0) {
    if (!syncInFlight) syncInFlight = runSync().finally(() => (syncInFlight = null));
    await syncInFlight;
  } else if (Date.now() - lastSyncAt > SYNC_INTERVAL_MS && !syncInFlight) {
    syncInFlight = runSync().finally(() => (syncInFlight = null));
  }
  return cachedDeadlines;
}

export const DEADLINES_WINDOW_DAYS = WINDOW_DAYS;
