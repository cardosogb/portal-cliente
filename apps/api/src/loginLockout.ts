import { onlyDigits } from "@portal/shared";

/**
 * Trava tentativas de login por identificador (CPF/telefone), não só por
 * IP. Isso importa especialmente aqui: a senha é só o dia+mês de
 * nascimento (366 combinações possíveis), então um limite por IP sozinho
 * não impede alguém de tentar as 366 combinações trocando de IP. Travando
 * por identificador, depois de algumas tentativas erradas a conta fica
 * bloqueada por um tempo, não importa de onde vêm as tentativas.
 *
 * Implementação em memória — funciona para 1 instância da API. Se a API
 * rodar em mais de uma instância em produção, isso precisa virar um
 * contador compartilhado (ex.: Redis).
 */
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos

interface Entry {
  failures: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, Entry>();

function key(identifier: string): string {
  return onlyDigits(identifier);
}

/** Retorna quantos ms faltam para o identificador poder tentar de novo, ou 0 se liberado. */
export function msUntilUnlocked(identifier: string): number {
  const entry = attempts.get(key(identifier));
  if (!entry?.lockedUntil) return 0;
  return Math.max(0, entry.lockedUntil - Date.now());
}

export function registerFailure(identifier: string) {
  const k = key(identifier);
  const entry = attempts.get(k) ?? { failures: 0, lockedUntil: null };
  entry.failures += 1;
  if (entry.failures >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.failures = 0;
  }
  attempts.set(k, entry);
}

export function registerSuccess(identifier: string) {
  attempts.delete(key(identifier));
}
