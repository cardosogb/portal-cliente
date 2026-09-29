import type { AuthSession } from "@portal/shared";

/**
 * Registro das sessões emitidas, para permitir revogar um token antes do
 * prazo de expiração (logout, funcionário desligado, conta comprometida).
 * Um JWT sozinho não pode ser "cancelado" — por isso guardamos o `jti`
 * (id único de cada token) aqui e checamos essa lista em toda requisição
 * autenticada.
 *
 * Implementação em memória — funciona para 1 instância da API. Em mais de
 * uma instância, isso precisa virar um armazenamento compartilhado (ex.:
 * Redis), do mesmo jeito que a trava de login em loginLockout.ts.
 */
interface SessionRecord {
  session: Omit<AuthSession, "token">;
  revoked: boolean;
  issuedAt: number;
}

const sessions = new Map<string, SessionRecord>();

export function registerSession(jti: string, session: Omit<AuthSession, "token">) {
  sessions.set(jti, { session, revoked: false, issuedAt: Date.now() });
}

export function isRevoked(jti: string): boolean {
  return sessions.get(jti)?.revoked ?? false;
}

export function revokeSession(jti: string) {
  const record = sessions.get(jti);
  if (record) record.revoked = true;
}

/** Revoga todas as sessões ativas de uma pessoa (ex.: funcionário desligado, conta comprometida). */
export function revokeAllSessionsFor(role: AuthSession["role"], id: string) {
  for (const record of sessions.values()) {
    if (record.session.role !== role) continue;
    const matches = role === "escritorio" ? record.session.staffId === id : record.session.clientId === id;
    if (matches) record.revoked = true;
  }
}
