/**
 * Camada de integração com o ADVBOX ("API para Escritórios").
 *
 * Hoje implementada com dados mockados para permitir desenvolver o
 * produto inteiro (site + app) sem depender de credenciais reais.
 * Quando o escritório contratar o plano de API do ADVBOX, basta trocar
 * `MockAdvboxClient` por uma implementação real que fale HTTP com a API
 * deles, mantendo a mesma interface `AdvboxClient` — nenhum outro código
 * da aplicação precisa mudar.
 */
import {
  mockClients,
  mockProcesses,
  type Client,
  type LegalProcess,
} from "@portal/shared";

export interface AdvboxClient {
  listClients(): Promise<Client[]>;
  getClientByCredentials(email: string, password: string): Promise<Client | null>;
  listProcessesByClient(clientId: string): Promise<LegalProcess[]>;
  getProcess(processId: string): Promise<LegalProcess | null>;
  listAllProcesses(): Promise<LegalProcess[]>;
}

class MockAdvboxClient implements AdvboxClient {
  async listClients(): Promise<Client[]> {
    return mockClients;
  }

  async getClientByCredentials(email: string): Promise<Client | null> {
    // MVP: qualquer senha é aceita para os clientes mockados, para
    // facilitar demonstração. Autenticação real virá do ADVBOX/SSO.
    return mockClients.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null;
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
}

export const advboxClient: AdvboxClient = new MockAdvboxClient();
