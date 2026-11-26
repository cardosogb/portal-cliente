import type { NextFunction, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { advboxClient } from "../integrations/advboxAdapter";
import { requireAuth, type AuthedRequest } from "../auth";
import { validateParams } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";

export const processesRouter = Router();

processesRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

processesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.session?.clientId) {
      return res.status(403).json({ error: "Sessão sem cliente associado." });
    }
    const processes = await advboxClient.listProcessesByClient(req.session.clientId);
    return res.json({ processes });
  })
);

const processIdParams = z.object({
  id: z.string().min(1, "Identificador de processo inválido."),
});

/**
 * O cliente só pode ver o próprio processo (checagem de `clientId`); a
 * equipe do escritório pode ver qualquer um — ela já enxerga todos os
 * processos de forma agregada em `/admin/overview`, então ver o detalhe
 * de um processo específico (linha do tempo, documentos, financeiro) não
 * é uma informação nova pra ela, só a mesma visão que o cliente tem do
 * próprio caso. Concedido por papel (`role === "escritorio"`), não para
 * uma pessoa específica — qualquer conta de equipe legítima tem isso,
 * igual já acontece com o painel interno.
 */
function canViewProcess(process: { clientId: string }, session: AuthedRequest["session"]): boolean {
  if (!session) return false;
  if (session.role === "escritorio") return true;
  return process.clientId === session.clientId;
}

processesRouter.get(
  "/:id",
  requireAuth,
  validateParams(processIdParams),
  asyncHandler(async (req: AuthedRequest, res) => {
    const process = await advboxClient.getProcess(req.params.id);
    if (!process || !canViewProcess(process, req.session)) {
      return res.status(404).json({ error: "Processo não encontrado." });
    }
    return res.json({ process });
  })
);

const documentDownloadParams = z.object({
  id: z.string().min(1, "Identificador de processo inválido."),
  docId: z.string().min(1, "Identificador de documento inválido."),
});

/**
 * Clicar num link de download é uma navegação comum (`<a href>` ou
 * `window.open`), que não manda cabeçalho `Authorization` — só cookie, que
 * nem todo front-end usa (ex.: uma página estática simples, sem servidor
 * próprio). Por isso, só nesta rota, aceitamos o token também por query
 * string (`?token=`) como alternativa ao header. Não existe nas outras
 * rotas — token na URL fica em histórico do navegador e logs de proxy,
 * então o uso é restrito a este link de download pontual e de vida curta.
 */
function requireAuthViaHeaderOrQueryToken(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.headers.authorization && typeof req.query.token === "string") {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return requireAuth(req, res, next);
}

processesRouter.get(
  "/:id/documents/:docId/download",
  requireAuthViaHeaderOrQueryToken,
  validateParams(documentDownloadParams),
  asyncHandler(async (req: AuthedRequest, res) => {
    const process = await advboxClient.getProcess(req.params.id);
    if (!process || !canViewProcess(process, req.session)) {
      return res.status(404).json({ error: "Processo não encontrado." });
    }
    const belongsToProcess = process.documents.some((d) => d.id === req.params.docId);
    if (!belongsToProcess) {
      return res.status(404).json({ error: "Documento não encontrado." });
    }
    const url = await advboxClient.getDocumentDownloadUrl(req.params.docId);
    if (!url) {
      return res.status(404).json({ error: "Documento não encontrado." });
    }
    return res.redirect(url);
  })
);
