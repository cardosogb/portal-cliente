import { Router } from "express";
import { mockStaffUsers } from "@portal/shared";
import { advboxClient } from "../integrations/advboxAdapter";
import { signSession } from "../auth";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha." });
  }

  // Contas do escritório são identificadas automaticamente pelo e-mail —
  // não há uma opção manual de "entrar como equipe".
  const staff = mockStaffUsers.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (staff) {
    const token = signSession({ role: "escritorio", staffId: staff.id });
    return res.json({ token, role: "escritorio", staff });
  }

  const client = await advboxClient.getClientByCredentials(email, password);
  if (!client) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const token = signSession({ role: "cliente", clientId: client.id });
  return res.json({ token, role: "cliente", client });
});
