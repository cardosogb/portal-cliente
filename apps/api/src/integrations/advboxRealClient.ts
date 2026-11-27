/**
 * Implementação real da integração com a API do ADVBOX
 * (https://api.softwareadvbox.com.br/docs). Ativa automaticamente quando
 * `ADVBOX_API_TOKEN` está definido (ver `advboxAdapter.ts`); sem o token,
 * o app continua usando `MockAdvboxClient`.
 *
 * Decisões de mapeamento confirmadas com a conta real do escritório
 * (Fernando Miranda — 30 mil registros em /lawsuits):
 *
 * - `area` vem de `lawsuit.group` (ex.: "TRABALHISTA", "PREVIDENCIÁRIO")
 *   — campo de texto livre configurado pelo escritório, mapeado abaixo.
 * - `currentPhase`/`status` NÃO vêm de `stage`/`step` do ADVBOX — esse é
 *   o quadro kanban interno do escritório (ver processPhaseDetector.ts),
 *   não a fase judicial. São inferidos do texto das movimentações reais.
 * - Nem todo registro em `/lawsuits` é um processo judicial de verdade —
 *   muitos são atendimentos/negociações internas sem `process_number`
 *   (ex.: id 9197701 na conta real, group ADMINISTRATIVO/step MARKETING,
 *   notes "Exemplo de processo"). Esses são sempre filtrados antes de
 *   chegar ao cliente ou ao painel interno.
 * - Documentos do ADVBOX só podem ser baixados por uma URL assinada que
 *   expira em 5 minutos (`GET /documents/{id}/download`) — por isso
 *   `ProcessDocument.url` aqui aponta para uma rota própria da nossa API
 *   (`/processes/:id/documents/:docId/download`) que busca a URL
 *   assinada na hora do clique, em vez de uma URL pronta que expiraria
 *   enquanto a página ficasse aberta. Ver routes/processes.ts.
 *
 * Pontos que ainda dependem de decisão do escritório, sem um campo
 * equivalente pronto no ADVBOX:
 * - `nextAction` (o banner "Ação necessária" + botão de WhatsApp): não
 *   há, na API, um sinal de "isto é uma pendência do cliente". Por ora
 *   todo processo real entra como "ok" (sem pendência) — ver
 *   `buildNextAction()`. Quando o escritório definir que sinal usar (uma
 *   tag específica em `/history`, um tipo de tarefa, etc.), dá pra
 *   melhorar isso sem mudar o resto do adaptador.
 * - `forecast` (previsão de prazo): sem dado histórico real por área
 *   ainda, fica um texto genérico em vez de inventar uma faixa de meses.
 */
import {
  onlyDigits,
  birthDateToDDMM,
  formatDatePtBR,
  type Client,
  type LegalProcess,
  type ProcessArea,
  type ProcessDocument,
  type NextAction,
} from "@portal/shared";
import type { AdvboxClient } from "./advboxAdapter";
import { detectPhaseAndStatus } from "./processPhaseDetector";
import { movementsToClientTimeline } from "./legalTranslator";

const BASE_URL = "https://app.advbox.com.br/api/v1";

function token(): string {
  const t = process.env.ADVBOX_API_TOKEN;
  if (!t) throw new Error("ADVBOX_API_TOKEN não configurado.");
  return t;
}

// Cache simples em memória (só 1 instância da API — mesma limitação já
// documentada em loginLockout.ts/sessionStore.ts). Existe só pra não
// estourar o rate limit de 30 GET/min do ADVBOX quando a mesma tela é
// recarregada em sequência; não substitui uma sincronização de verdade
// pro painel interno (ver `processesCache` mais abaixo).
const getCache = new Map<string, { at: number; data: unknown }>();
const CACHE_TTL_MS = 60_000;

/**
 * Fila que espaça as chamadas pra nunca estourar os 30 GET/min do ADVBOX.
 * Sem isso, uma sincronização em lote (ex.: `fetchAllPages` buscando 30
 * páginas de uma vez) dispara tudo de uma vez e toma 429 rapidinho — foi
 * isso que aconteceu e derrubou a API inteira na primeira tentativa, por
 * um erro não tratado escapando de dentro de uma promise (ver também o
 * middleware de erro em server.ts, que agora cobre isso como última
 * linha de defesa).
 */
const MIN_INTERVAL_MS = 2_100; // ~28/min, com folga
let queue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fn();
  });
  // Mesmo se `fn()` rejeitar, a fila precisa seguir pra próxima chamada —
  // por isso o catch aqui é só pra não travar `queue`, o erro de verdade
  // continua propagando normalmente em `result` pra quem chamou.
  queue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function advboxGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  attempt = 0
): Promise<T | null> {
  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const cacheKey = url.toString();
  const cached = getCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data as T;

  const res = await throttle(() => fetch(url, { headers: { Authorization: `Bearer ${token()}` } }));

  if (res.status === 429 && attempt < 3) {
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 5_000;
    await new Promise((r) => setTimeout(r, retryAfterMs));
    return advboxGet<T>(path, params, attempt + 1);
  }
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`ADVBOX respondeu ${res.status} em ${path}`);
  }
  const data = (await res.json()) as T;
  getCache.set(cacheKey, { at: Date.now(), data });
  return data;
}

interface Paginated<T> {
  offset: number;
  limit: number;
  totalCount: number;
  data: T[];
}

async function fetchAllPages<T>(path: string, params: Record<string, string | number | undefined>, pageSize: number): Promise<T[]> {
  const out: T[] = [];
  let offset = 0;
  for (;;) {
    const page = await advboxGet<Paginated<T>>(path, { ...params, limit: pageSize, offset });
    if (!page || page.data.length === 0) break;
    out.push(...page.data);
    offset += page.data.length;
    if (offset >= page.totalCount) break;
  }
  return out;
}

// ---- Campos crus da API (só o que usamos) ----

interface AdvboxCustomer {
  id: number;
  name: string;
  identification: string;
  email: string | null;
  phone: string | null;
  cellphone: string | null;
  birthdate: string | null; // "DD/MM/AAAA"
}

interface AdvboxLawsuit {
  id: number;
  process_number: string | null;
  folder: string | null;
  process_date: string | null; // "AAAA-MM-DD"
  type: string | null;
  group: string | null;
  responsible: string | null;
  notes: string | null;
  customers: Array<{ customer_id: number; name: string; identification: string }>;
}

interface AdvboxMovement {
  lawsuit_id: number;
  date: string; // "AAAA-MM-DD"
  title: string;
  header: string | null; // sigla do tribunal (ex.: "TRF02")
}

interface AdvboxDocument {
  id: number;
  name: string;
  size: string; // ex.: "115.3 KB"
  attached_to: { type: string; id: number; label: string } | null;
  uploaded_at: string;
}

interface AdvboxTask {
  id: number;
  date: string | null; // "AAAA-MM-DD HH:MM:SS"
  task: string; // nome do tipo de tarefa (ver CLIENT_FACING_TASK_LABELS)
  local: string | null;
  lawsuits_id: number | null;
}

// ---- Mapeamentos ----

const AREA_BY_GROUP: Record<string, ProcessArea> = {
  TRABALHISTA: "trabalhista",
  "PREVIDENCIÁRIO": "previdenciario",
  "CONCESSÃO DE BENEFICIO": "previdenciario",
  "CÍVEL": "civel",
  CONSUMIDOR: "civel",
  "FAMÍLIA": "familia",
};

function mapArea(group: string | null): ProcessArea {
  return AREA_BY_GROUP[(group ?? "").toUpperCase().trim()] ?? "outro";
}

/** "DD/MM/AAAA" → ISO "AAAA-MM-DD". Sem data válida, mantém string vazia. */
function brDateToIso(d: string | null): string {
  if (!d) return "";
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return d; // já pode vir em outro formato; não trava o mapeamento por isso
  const [, day, month, year] = m;
  return `${year}-${month}-${day}`;
}

/** "115.3 KB" / "2.1 MB" → número de KB (o que `ProcessDocument.sizeKb` espera). */
function parseSizeToKb(size: string): number {
  const m = size.match(/([\d.,]+)\s*(KB|MB|GB)/i);
  if (!m) return 0;
  const value = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toUpperCase();
  if (unit === "GB") return Math.round(value * 1024 * 1024);
  if (unit === "MB") return Math.round(value * 1024);
  return Math.round(value);
}

/**
 * Processos de verdade (que vieram da Justiça) sempre têm número —
 * registros sem `process_number` são atendimento/negociação interna
 * (pré-contrato), não um caso aberto para mostrar ao cliente.
 */
function isRealLawsuit(l: AdvboxLawsuit): boolean {
  return !!l.process_number;
}

/**
 * Busca TODAS as páginas de movimentações do processo — sem paginar aqui,
 * um processo antigo com centenas de andamentos viria cortado na resposta
 * padrão do ADVBOX (mesma página única que ela devolve por padrão em
 * qualquer lista), e o cliente precisa ver o histórico completo (menos o
 * que foi combinado esconder, ver `isHiddenFromClient`).
 */
async function fetchMovements(lawsuitId: number): Promise<AdvboxMovement[]> {
  return fetchAllPages<AdvboxMovement>(`/movements/${lawsuitId}`, {}, 200);
}

/**
 * Tipos de tarefa do ADVBOX (`/posts`, campo `task`) que são um
 * compromisso real do cliente — audiência, perícia, sessão de
 * julgamento — e não tarefa interna da equipe. A conta do escritório tem
 * ~300 tipos de tarefa cadastrados em `/settings`, a imensa maioria de
 * fluxo de trabalho interno (cobrança, RH, atendimento, "CORREÇÃO DE
 * PEÇAS", etc.), e o campo `notes` de uma tarefa real costuma trazer
 * instruções internas da equipe e até dados de contato do cliente — por
 * isso isto é uma lista fechada do que é seguro mostrar (allow-list), ao
 * contrário do filtro de andamentos em `legalTranslator.ts` (que é um
 * block-list), e por isso nunca usamos `notes`, só o nome do tipo, a data
 * e o local.
 *
 * Lista fechada por enquanto — se o escritório tiver outro tipo de
 * compromisso que devesse aparecer aqui, é só adicionar nesta lista.
 */
const CLIENT_FACING_TASK_LABELS: Record<string, string> = {
  "AUDIÊNCIA DE CONCILIAÇÃO": "Audiência de conciliação",
  "AUDIÊNCIA DE INSTRUÇÃO/JULGAMENTO": "Audiência de instrução e julgamento",
  "AUDIÊNCIAS": "Audiência",
  "AGENDAMENTO DE PERICIA": "Perícia",
  "AGENDAMENTO DE AVALIAÇÃO SOCIAL": "Avaliação social",
  "SESSÃO ORDINÁRIA DE JULGAMENTO AGENDADA": "Sessão de julgamento",
  "SUSTENTAÇÃO ORAL TRT TRF TJ": "Sustentação oral",
  "SUSTENTAÇÃO ORAL TST STJ STF": "Sustentação oral",
};

/**
 * Busca, entre as tarefas pendentes do processo, o próximo compromisso
 * real do cliente (ver `CLIENT_FACING_TASK_LABELS`) com data futura. Só
 * uma: o cliente precisa saber "qual é a próxima coisa", não a lista
 * inteira de tarefas internas da equipe.
 */
async function fetchNextClientAppointment(lawsuitId: number): Promise<AdvboxTask | null> {
  const tasks = await fetchAllPages<AdvboxTask>("/posts", { lawsuit_id: lawsuitId }, 200);
  const todayStart = new Date().toISOString().slice(0, 10);
  const upcoming = tasks
    .filter((t) => t.task in CLIENT_FACING_TASK_LABELS && t.date && t.date.slice(0, 10) >= todayStart)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1));
  return upcoming[0] ?? null;
}

async function mapLawsuitToProcess(l: AdvboxLawsuit): Promise<LegalProcess> {
  const movements = await fetchMovements(l.id);
  const { currentPhase, status, concludedAt } = detectPhaseAndStatus(
    movements.map((m) => ({ date: m.date, title: m.title }))
  );

  const timeline = movementsToClientTimeline(
    // Mais recente primeiro, como o resto do app espera.
    [...movements].sort((a, b) => (a.date < b.date ? 1 : -1)).map((m) => ({ date: m.date, text: m.title }))
  );

  const [documents, nextAppointment] = await Promise.all([
    fetchDocumentsForProcess(l),
    fetchNextClientAppointment(l.id),
  ]);

  const primaryCustomer = l.customers[0];
  const lastMovementDate = movements.reduce<string | null>(
    (latest, m) => (!latest || m.date > latest ? m.date : latest),
    null
  );

  return {
    id: String(l.id),
    clientId: primaryCustomer ? String(primaryCustomer.customer_id) : "",
    clientName: primaryCustomer?.name,
    number: l.process_number ?? "",
    area: mapArea(l.group),
    // O ADVBOX não tem um campo "tribunal" no processo em si — o código
    // do tribunal (ex.: "TRF02") vem no cabeçalho de cada movimentação.
    court: movements[0]?.header ?? "Não informado",
    status,
    currentPhase,
    startedAt: l.process_date ?? "",
    concludedAt,
    lawyerName: l.responsible ?? "—",
    nextAction: buildNextAction(nextAppointment),
    forecast: "O prazo de cada etapa varia conforme o tribunal e a complexidade do caso.",
    lastMovementAt: lastMovementDate ?? l.process_date ?? "",
    timeline,
    documents,
  };
}

/**
 * Sem um sinal confiável vindo do ADVBOX de "isto é uma pendência que o
 * CLIENTE precisa resolver" (ver nota no topo do arquivo), não arriscamos
 * um falso "ação necessária" que preocupa o cliente à toa ou manda ele
 * pro WhatsApp sem motivo — por isso `type` nunca é "acao" aqui. O que
 * dá pra mostrar com segurança é um compromisso real já agendado
 * (audiência, perícia, sessão de julgamento — ver
 * `fetchNextClientAppointment`), como aviso informativo.
 */
function buildNextAction(appointment: AdvboxTask | null): NextAction {
  if (!appointment || !appointment.date) {
    return {
      type: "ok",
      text: "Nenhuma ação necessária no momento. Seu advogado avisa por aqui assim que houver novidade.",
    };
  }
  const dueDate = appointment.date.slice(0, 10);
  const label = CLIENT_FACING_TASK_LABELS[appointment.task] ?? appointment.task;
  const where = appointment.local ? ` em ${appointment.local}` : "";
  return {
    type: "aviso",
    text: `${label} agendada para ${formatDatePtBR(dueDate)}${where}.`,
    dueDate,
  };
}

async function fetchDocumentsForProcess(l: AdvboxLawsuit): Promise<ProcessDocument[]> {
  const customerId = l.customers[0]?.customer_id;
  if (!customerId) return [];
  const all = await fetchAllPages<AdvboxDocument>("/documents", { customer_id: customerId }, 1000);
  // Pega tanto o que foi anexado diretamente a este processo (`attached_to`
  // apontando pro id do lawsuit) quanto o que foi anexado ao cliente em
  // geral (apontando pro id do customer, sem processo específico) — os
  // dois tipos envolvem o cliente e precisam aparecer, não só o primeiro.
  return all
    .filter((d) => d.attached_to && (d.attached_to.id === l.id || d.attached_to.id === customerId))
    .map((d) => ({
      id: String(d.id),
      title: d.name,
      category: "outro" as const,
      uploadedAt: brDateToIso(d.uploaded_at) || d.uploaded_at,
      // Proxied pela nossa própria API: a URL assinada do ADVBOX expira em
      // 5 minutos, não dá pra guardar pronta numa página que pode ficar
      // aberta mais tempo que isso.
      url: `/processes/${l.id}/documents/${d.id}/download`,
      sizeKb: parseSizeToKb(d.size),
    }));
}

async function findLawsuitsByCustomer(customerId: number): Promise<AdvboxLawsuit[]> {
  const all = await fetchAllPages<AdvboxLawsuit>("/lawsuits", { customer_id: customerId }, 1000);
  return all.filter(isRealLawsuit);
}

class RealAdvboxClient implements AdvboxClient {
  async listClients(): Promise<Client[]> {
    const customers = await fetchAllPages<AdvboxCustomer>("/customers", {}, 1000);
    return customers.map(mapCustomerToClient);
  }

  async getClientByCpfAndBirthDate(cpf: string, birthDateDDMM: string): Promise<Client | null> {
    const identification = onlyDigits(cpf);
    const result = await advboxGet<{ data: AdvboxCustomer[] }>("/customers", { identification });
    const customer = result?.data?.[0];
    if (!customer) return null;
    const client = mapCustomerToClient(customer);
    if (!client.birthDate || birthDateToDDMM(client.birthDate) !== birthDateDDMM) return null;
    return client;
  }

  async listProcessesByClient(clientId: string): Promise<LegalProcess[]> {
    const lawsuits = await findLawsuitsByCustomer(Number(clientId));
    return Promise.all(lawsuits.map(mapLawsuitToProcess));
  }

  async getProcess(processId: string): Promise<LegalProcess | null> {
    const lawsuit = await advboxGet<AdvboxLawsuit>(`/lawsuits/${processId}`);
    if (!lawsuit || !isRealLawsuit(lawsuit)) return null;
    return mapLawsuitToProcess(lawsuit);
  }

  /**
   * Usado só pelo painel interno (visão de todos os processos do
   * escritório). Com ~30 mil registros na conta real e um limite de 30
   * GET/min no ADVBOX, buscar e montar isso a cada acesso ao painel não é
   * viável — ver `processesCache.ts` para a sincronização periódica que
   * alimenta isso de verdade.
   */
  async listAllProcesses(): Promise<LegalProcess[]> {
    const { getCachedProcesses } = await import("./processesCache");
    return getCachedProcesses();
  }

  async getDocumentDownloadUrl(documentId: string): Promise<string | null> {
    // Formato do envelope ({ data: { temporary_url } }) assumido por
    // consistência com o resto da API — a conta testada não tinha nenhum
    // documento real pra confirmar; checar assim que o escritório tiver
    // algum documento de verdade anexado a um processo.
    const result = await advboxGet<{ data: { temporary_url: string } }>(`/documents/${documentId}/download`);
    return result?.data?.temporary_url ?? null;
  }
}

function mapCustomerToClient(c: AdvboxCustomer): Client {
  return {
    id: String(c.id),
    name: c.name,
    cpf: c.identification,
    birthDate: brDateToIso(c.birthdate),
    email: c.email ?? "",
    phone: c.cellphone || c.phone || "",
    lastAccessAt: null,
  };
}

export const realAdvboxClient: AdvboxClient = new RealAdvboxClient();

// Exportado só para uso interno de outros módulos da integração
// (ex.: processesCache.ts precisa buscar/mapear lawsuits em lote).
export { advboxGet, fetchAllPages, isRealLawsuit, mapArea, type AdvboxLawsuit, type AdvboxMovement };
