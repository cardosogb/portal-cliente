import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/**
 * Valida `req.body`/`req.params` contra um schema do zod antes da rota
 * rodar. Sem isso, cada rota tem que lembrar de checar campo por campo à
 * mão (como o login fazia) — fácil de esquecer um caso em alguma rota
 * nova. Em caso de erro, devolve 400 com uma mensagem específica, sem
 * vazar detalhes internos do schema.
 */
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message ?? "Dados inválidos." });
    }
    req.body = result.data;
    next();
  };
}

export function validateParams(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message ?? "Parâmetros inválidos." });
    }
    next();
  };
}
