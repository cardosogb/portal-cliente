/**
 * Camada de integração com o ADVBOX ("API para Escritórios").
 *
 * Hoje implementada com dados mockados para permitir desenvolver o
 * produto inteiro (site + app) sem depender de credenciais reais.
 * Quando o escritório contratar o plano de API do ADVBOX, basta trocar
 * `MockAdvboxClient` por uma implementação real que fale HTTP com a API
 * deles, mantendo a mesma interface `AdvboxClient` — nenhum outro código
 * da aplicação precisa mudar.
 *
 * IMPORTANTE: a implementação real de `getProcess`/`listProcessesByClient`
 * deve montar `LegalProcess.timeline` passando as movimentações cruas do
 * ADVBOX por `movementsToClientTimeline` (./legalTranslator.ts) — isso
 * filtra movimentações que só geram confusão/ligações desnecessárias ao
 * escritório (ex.: andamentos de RPV) antes de chegarem ao cliente, e
 * traduz o restante para linguagem simples. Nunca monte a timeline do
 * cliente direto a partir da resposta crua da API.
 *
 * IMPORTANTE também: preencha `LegalProcess.lastMovementAt` com a data da
 * movimentação mais recente RETORNADA PELA API, antes de qualquer filtro
 * — não com `timeline[timeline.length - 1].date`. O painel interno usa
 * `lastMovementAt` (via `processHealth.ts`) para avisar "processo sem
 * movimentação há N dias", e se essa data viesse da timeline já filtrada
 * pro cliente, um processo com só uma RPV recente (filtrada) pareceria
 * "parado" pra equipe sem estar. `lastMovementAt` nunca é armazenado à
 * parte — é sempre a data crua que a API do ADVBOX devolve, então o
 * aviso nunca pode divergir do que o ADVBOX mostra.
 */
import {
  mockClients,
  mockProcesses,
  onlyDigits,
  birthDateToDDMM,
  type Client,
  type LegalProcess,
} from "@portal/shared";
import { realAdvboxClient } from "./advboxRealClient";

export interface DeadlineItem {
  date: string; // AAAA-MM-DD
  lawyerName: string;
  clientName: string;
  processNumber: string;
  court: string;
}

export interface AdvboxClient {
  listClients(): Promise<Client[]>;
  getClientByCpfAndBirthDate(cpf: string, birthDateDDMM: string): Promise<Client | null>;
  listProcessesByClient(clientId: string): Promise<LegalProcess[]>;
  getProcess(processId: string): Promise<LegalProcess | null>;
  listAllProcesses(): Promise<LegalProcess[]>;
  /**
   * URL de download de um documento específico de um processo. Só a
   * implementação real precisa fazer algo aqui — o ADVBOX devolve uma URL
   * assinada que expira em 5 minutos, então ela é buscada na hora do
   * clique (ver routes/processes.ts), nunca guardada de antemão.
   */
  getDocumentDownloadUrl(documentId: string): Promise<string | null>;
  /**
   * Prazos do escritório inteiro vindos de intimações reais (painel
   * interno/dashboard executivo) — ver `publicationsCache.ts`.
   */
  getUpcomingDeadlines(): Promise<DeadlineItem[]>;
}

class MockAdvboxClient implements AdvboxClient {
  async listClients(): Promise<Client[]> {
    return mockClients;
  }

  async getClientByCpfAndBirthDate(cpf: string, birthDateDDMM: string): Promise<Client | null> {
    const cpfDigits = onlyDigits(cpf);
    const client = mockClients.find((c) => onlyDigits(c.cpf) === cpfDigits);
    if (!client || birthDateToDDMM(client.birthDate) !== birthDateDDMM) return null;
    return client;
  }

  async listProcessesByClient(clientId: string): Promise<LegalProcess[]> {
    return mockProcesses.filter((p) => p.clientId === clientId);
  }

  async getProcess(processId: string): Promise<LegalProcess | null> {
    return mockProcesses.find((p) => p.id === processId) ?? null;
  }

  async listAllProcesses(): Promise<LegalProcess[]> {
    return mockProcesses;
  }

  async getDocumentDownloadUrl(documentId: string): Promise<string | null> {
    const doc = mockProcesses.flatMap((p) => p.documents).find((d) => d.id === documentId);
    return doc?.url ?? null;
  }

  async getUpcomingDeadlines(): Promise<DeadlineItem[]> {
    const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
    return [
      {
        date: inDays(4),
        lawyerName: "Dra. Fernanda Lima",
        clientName: "Maria Souza",
        processNumber: "0001234-56.2026.5.02.0001",
        court: "TRT02",
      },
      {
        date: inDays(11),
        lawyerName: "Dr. Ricardo Alves",
        clientName: "João Pereira",
        processNumber: "0007890-12.2026.4.03.0002",
        court: "TRF03",
      },
    ];
  }
}

/**
 * Com `ADVBOX_API_TOKEN` definido (ver apps/api/.env), usa a API real do
 * ADVBOX; sem ele, continua com dados mockados — nenhum outro código da
 * aplicação precisa saber a diferença. Importar `advboxRealClient` não
 * faz nenhuma chamada de rede por si só (só quando um método é chamado),
 * então não há problema em importar o módulo mesmo quando não vai ser
 * usado.
 */
export const advboxClient: AdvboxClient = process.env.ADVBOX_API_TOKEN
  ? realAdvboxClient
  : new MockAdvboxClient();
