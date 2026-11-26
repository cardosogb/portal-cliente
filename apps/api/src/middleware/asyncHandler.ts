import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 não captura automaticamente uma Promise rejeitada dentro de
 * uma rota `async` — o erro escapa como unhandled rejection e, por
 * padrão no Node, derruba o processo inteiro (foi exatamente o que
 * aconteceu na primeira sincronização com o ADVBOX, quando um 429 não
 * tratado matou a API no meio de uma requisição de um cliente). Esse
 * wrapper garante que qualquer erro de uma rota async vira um `next(err)`
 * normal, tratado pelo middleware de erro em server.ts.
 */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
}
