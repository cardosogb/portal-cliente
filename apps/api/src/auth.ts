import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { AuthSession } from "@portal/shared";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-do-not-use-in-production";

export function signSession(session: Omit<AuthSession, "token">): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: "7d" });
}

export interface AuthedRequest extends Request {
  session?: AuthSession;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente." });
  }
  const token = header.slice("Bearer ".length);
  try {
    req.session = jwt.verify(token, JWT_SECRET) as AuthSession;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
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
