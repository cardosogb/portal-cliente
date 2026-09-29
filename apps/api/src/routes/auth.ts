import { Router } from "express";
import { onlyDigits, isValidCpf } from "@portal/shared";
import { advboxClient } from "../integrations/advboxAdapter";
import { staffDirectory } from "../integrations/staffDirectory";
import { signSession } from "../auth";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { cpf, birthDate } = req.body ?? {};
  if (!cpf || !birthDate) {
    return res.status(400).json({ error: "Informe CPF (ou telefone, se você for da equipe) e data de nascimento." });
  }
  if (!/^\d{4}$/.test(birthDate)) {
    return res.status(400).json({ error: "Data de nascimento inválida. Use o formato DDMM." });
  }

  if (onlyDigits(cpf).length !== 11) {
    return res.status(400).json({ error: "Informe um CPF ou telefone com 11 números." });
  }

  // Contas do escritório são identificadas automaticamente, por CPF OU
  // telefone — não há cadastro manual nem uma opção de "entrar como
  // equipe". Verificamos isso primeiro porque, ao contrário do CPF do
  // cliente, esse campo pode não ser um CPF válido (pode ser telefone).
  const staff = await staffDirectory.getStaffByIdentifierAndBirthDate(cpf, birthDate);
  if (staff) {
    const token = signSession({ role: "escritorio", staffId: staff.id });
    return res.json({ token, role: "escritorio", staff });
  }

  // Nesse ponto o campo não bateu com nenhuma conta de equipe (CPF nem
  // telefone). Se também não for um CPF válido, não vale a pena checar o
  // cliente — mas a mensagem fica genérica, porque a pessoa pode ter
  // digitado um telefone (de equipe) com a data de nascimento errada, e
  // "CPF inválido" seria uma pista errada nesse caso.
  if (!isValidCpf(cpf)) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const client = await advboxClient.getClientByCpfAndBirthDate(onlyDigits(cpf), birthDate);
  if (!client) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const token = signSession({ role: "cliente", clientId: client.id });
  return res.json({ token, role: "cliente", client });
});
