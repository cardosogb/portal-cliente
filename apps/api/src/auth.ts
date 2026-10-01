import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";
import type { AuthSession } from "@portal/shared";
import { isRevoked, registerSession } from "./sessionStore";

const DEV_SECRET = "dev-secret-do-not-use-in-production";
const JWT_SECRET = process.env.JWT_SECRET ?? DEV_SECRET;

export const SESSION_COOKIE = "portal_session";

/**
 * Trava a inicialização em produção se alguém esquecer de configurar um
 * `JWT_SECRET` de verdade — subir com o segredo padrão faria qualquer
 * pessoa conseguir forjar um token válido (inclusive de acesso ao painel
 * interno).
 */
export function assertProductionSecrets() {
  if (process.env.NODE_ENV === "production" && JWT_SECRET === DEV_SECRET) {
    throw new Error(
      "JWT_SECRET não configurado em produção. Defina uma variável de ambiente JWT_SECRET com um valor forte e secreto antes de subir a API."
    );
  }
}

export function signSession(session: Omit<AuthSession, "token">): { token: string; jti: string } {
  const jti = randomUUID();
  const token = jwt.sign(session, JWT_SECRET, { expiresIn: "7d", jwtid: jti });
  registerSession(jti, session);
  return { token, jti };
}

export interface AuthedRequest extends Request {
  session?: AuthSession;
  sessionJti?: string;
}

/**
 * Opções para o cookie de sessão. `httpOnly` impede o JavaScript da
 * página de ler o token (mitiga roubo via XSS), diferente de guardar em
 * `localStorage`. `sameSite: "lax"` cobre o caso de uso daqui (site e API
 * no mesmo domínio-base) sem precisar de token CSRF separado — veja nota
 * em routes/auth.ts.
 */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

/**
 * Opções para *apagar* o cookie no logout — sem `maxAge`. O
 * `res.clearCookie()` do Express recalcula `expires` a partir de
 * `maxAge` quando ele está presente nas opções, o que sobrescreve a data
 * no passado que o clearCookie tentou colocar e o cookie nunca expira de
 * verdade no navegador.
 */
export function clearSessionCookieOptions() {
  const { maxAge: _maxAge, ...rest } = sessionCookieOptions();
  return rest;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  // O site usa o cookie httpOnly (não acessível via JS); o app mobile,
  // que não tem esse conceito, manda o token por Authorization: Bearer.
  const cookieToken = req.cookies?.[SESSION_COOKIE];
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  const token = cookieToken ?? bearerToken;

  if (!token) {
    return res.status(401).json({ error: "Sessão ausente." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthSession & { jti: string };
    if (isRevoked(decoded.jti)) {
      return res.status(401).json({ error: "Sessão encerrada. Entre novamente." });
    }
    req.session = decoded;
    req.sessionJti = decoded.jti;
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}

export function requireRole(role: AuthSession["role"]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.session?.role !== role) {
      return res.status(403).json({ error: "Acesso não permitido para este perfil." });
    }
    next();
  };
}

/**
 * Trava adicional dentro do painel interno: além de ser da equipe
 * (`requireRole("escritorio")`), a pessoa precisa ter `accessLevel` igual
 * ao exigido. Usado para separar o dashboard de desenvolvimento do
 * escritório (hoje só TI, Diretor(a) e CEO) do painel comum que qualquer
 * advogado já tem acesso.
 */
export function requireAccessLevel(level: NonNullable<AuthSession["staffAccessLevel"]>) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.session?.staffAccessLevel !== level) {
      return res.status(403).json({ error: "Acesso restrito à diretoria e TI." });
    }
    next();
  };
}
