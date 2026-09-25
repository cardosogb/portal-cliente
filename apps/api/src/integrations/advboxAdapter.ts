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
  onlyDigits,
  birthDateToDDMM,
  type Client,
  type LegalProcess,
} from "@portal/shared";

export interface AdvboxClient {
  listClients(): Promise<Client[]>;
  getClientByCpfAndBirthDate(cpf: string, birthDateDDMM: string): Promise<Client | null>;
  listProcessesByClient(clientId: string): Promise<LegalProcess[]>;
  getProcess(processId: string): Promise<LegalProcess | null>;
  listAllProcesses(): Promise<LegalProcess[]>;
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
}

export const advboxClient: AdvboxClient = new MockAdvboxClient();
