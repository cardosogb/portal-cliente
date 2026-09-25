import { Router } from "express";
import { mockStaffUsers, onlyDigits, birthDateToDDMM, isValidCpf } from "@portal/shared";
import { advboxClient } from "../integrations/advboxAdapter";
import { signSession } from "../auth";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { cpf, birthDate } = req.body ?? {};
  if (!cpf || !birthDate) {
    return res.status(400).json({ error: "Informe CPF e data de nascimento." });
  }
  if (!isValidCpf(cpf)) {
    return res.status(400).json({ error: "CPF inválido." });
  }
  if (!/^\d{4}$/.test(birthDate)) {
    return res.status(400).json({ error: "Data de nascimento inválida. Use o formato DDMM." });
  }

  const cpfDigits = onlyDigits(cpf);

  // Contas do escritório são identificadas automaticamente pelo CPF —
  // não há uma opção manual de "entrar como equipe".
  const staff = mockStaffUsers.find((s) => onlyDigits(s.cpf) === cpfDigits);
  if (staff) {
    if (birthDateToDDMM(staff.birthDate) !== birthDate) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }
    const token = signSession({ role: "escritorio", staffId: staff.id });
    return res.json({ token, role: "escritorio", staff });
  }

  const client = await advboxClient.getClientByCpfAndBirthDate(cpf, birthDate);
  if (!client) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const token = signSession({ role: "cliente", clientId: client.id });
  return res.json({ token, role: "cliente", client });
});
