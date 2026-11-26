import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { advboxClient } from "../integrations/advboxAdapter";
import { requireAuth, type AuthedRequest } from "../auth";
import { validateParams } from "../middleware/validate";

export const processesRouter = Router();

processesRouter.use(requireAuth);
processesRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

processesRouter.get("/", async (req: AuthedRequest, res) => {
  if (!req.session?.clientId) {
    return res.status(403).json({ error: "Sessão sem cliente associado." });
  }
  const processes = await advboxClient.listProcessesByClient(req.session.clientId);
  return res.json({ processes });
});

const processIdParams = z.object({
  id: z.string().min(1, "Identificador de processo inválido."),
});

processesRouter.get("/:id", validateParams(processIdParams), async (req: AuthedRequest, res) => {
  const process = await advboxClient.getProcess(req.params.id);
  if (!process || process.clientId !== req.session?.clientId) {
    return res.status(404).json({ error: "Processo não encontrado." });
  }
  return res.json({ process });
});

const documentDownloadParams = z.object({
  id: z.string().min(1, "Identificador de processo inválido."),
  docId: z.string().min(1, "Identificador de documento inválido."),
});

/**
 * A URL de download de um documento do ADVBOX é assinada e expira em 5
 * minutos — não dá pra mandar pronta em `ProcessDocument.url` porque a
 * página pode ficar aberta mais tempo que isso. Esta rota busca uma URL
 * nova na hora do clique e redireciona pra ela, sempre reconferindo que o
 * documento pertence mesmo a um processo do cliente logado (sem isso,
 * trocar o `docId` na URL poderia vazar documento de outro cliente).
 */
processesRouter.get(
  "/:id/documents/:docId/download",
  validateParams(documentDownloadParams),
  async (req: AuthedRequest, res) => {
    const process = await advboxClient.getProcess(req.params.id);
    if (!process || process.clientId !== req.session?.clientId) {
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
  }
);
