/**
 * Log de auditoria de acesso ao painel interno: quem (qual funcionário)
 * acessou o quê e quando. Importante porque o painel dá visão de dados
 * sensíveis (CPF, processo, financeiro) de todos os clientes — em caso de
 * uso indevido ou de uma dúvida tipo "quem olhou os dados do cliente X",
 * precisa dar pra responder.
 *
 * Implementação em memória, com um teto de entradas — funciona para 1
 * instância da API. Em produção de verdade isso deveria ir para um
 * armazenamento durável (banco de dados ou serviço de log), não memória,
 * para não perder o histórico a cada reinício.
 */
export interface AuditEntry {
  staffId: string;
  staffName: string;
  action: string;
  ip: string;
  at: string; // ISO
}

const MAX_ENTRIES = 500;
const log: AuditEntry[] = [];

export function recordAccess(entry: Omit<AuditEntry, "at">) {
  log.push({ ...entry, at: new Date().toISOString() });
  if (log.length > MAX_ENTRIES) log.shift();
}

/** Mais recentes primeiro. */
export function getRecentAccess(limit = 100): AuditEntry[] {
  return log.slice(-limit).reverse();
}
