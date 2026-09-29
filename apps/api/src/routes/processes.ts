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
