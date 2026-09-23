import { Router } from "express";
import { advboxClient } from "../integrations/advboxAdapter";
import { signSession } from "../auth";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha." });
  }

  const client = await advboxClient.getClientByCredentials(email, password);
  if (!client) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const token = signSession({ role: "cliente", clientId: client.id });
  return res.json({ token, client });
});
