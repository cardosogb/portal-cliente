import { Router } from "express";
import { advboxClient } from "../integrations/advboxAdapter";
import { requireAuth, type AuthedRequest } from "../auth";

export const processesRouter = Router();

processesRouter.use(requireAuth);

processesRouter.get("/", async (req: AuthedRequest, res) => {
  if (!req.session?.clientId) {
    return res.status(403).json({ error: "Sessão sem cliente associado." });
  }
  const processes = await advboxClient.listProcessesByClient(req.session.clientId);
  return res.json({ processes });
});

processesRouter.get("/:id", async (req: AuthedRequest, res) => {
  const process = await advboxClient.getProcess(req.params.id);
  if (!process || process.clientId !== req.session?.clientId) {
    return res.status(404).json({ error: "Processo não encontrado." });
  }
  return res.json({ process });
});
