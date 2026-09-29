import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { onlyDigits, isValidCpf } from "@portal/shared";
import { advboxClient } from "../integrations/advboxAdapter";
import { staffDirectory } from "../integrations/staffDirectory";
import {
  clearSessionCookieOptions,
  requireAuth,
  sessionCookieOptions,
  signSession,
  SESSION_COOKIE,
  type AuthedRequest,
} from "../auth";
import { revokeSession } from "../sessionStore";
import { msUntilUnlocked, registerFailure, registerSuccess } from "../loginLockout";
import { validateBody } from "../middleware/validate";

export const authRouter = Router();

// Barreira grosseira por IP (ex.: um script tentando muitas contas
// diferentes rápido demais). A trava por identificador em loginLockout.ts
// é a que realmente importa contra força bruta na senha de 366
// combinações, já que não depende de vir sempre do mesmo IP.
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

const loginSchema = z.object({
  cpf: z
    .string({ error: "Informe CPF (ou telefone, se você for da equipe)." })
    .refine((v) => onlyDigits(v).length === 11, "Informe um CPF ou telefone com 11 números."),
  birthDate: z
    .string({ error: "Informe a data de nascimento." })
    .regex(/^\d{4}$/, "Data de nascimento inválida. Use o formato DDMM."),
});

// Nota sobre CSRF: como a sessão fica num cookie, uma requisição forjada
// de outro site poderia em tese chegar até aqui. `sameSite: "lax"` (ver
// auth.ts) já impede o navegador de enviar esse cookie em requisições
// cross-site, e a API hoje não tem nenhuma rota que muda dados do cliente
// a partir do painel (é só leitura) — então não há um token CSRF separado
// por enquanto. Se uma rota que grava dados for adicionada, ela precisa
// desse reforço.
authRouter.post("/login", loginRateLimit, validateBody(loginSchema), async (req, res) => {
  const { cpf, birthDate } = req.body as z.infer<typeof loginSchema>;

  const lockedMs = msUntilUnlocked(cpf);
  if (lockedMs > 0) {
    const minutes = Math.ceil(lockedMs / 60_000);
    return res.status(429).json({
      error: `Muitas tentativas com esse CPF/telefone. Tente novamente em ${minutes} minuto(s).`,
    });
  }

  // Contas do escritório são identificadas automaticamente, por CPF OU
  // telefone — não há cadastro manual nem uma opção de "entrar como
  // equipe". Verificamos isso primeiro porque, ao contrário do CPF do
  // cliente, esse campo pode não ser um CPF válido (pode ser telefone).
  const staff = await staffDirectory.getStaffByIdentifierAndBirthDate(cpf, birthDate);
  if (staff) {
    registerSuccess(cpf);
    const { token } = signSession({ role: "escritorio", staffId: staff.id });
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
    return res.json({ token, role: "escritorio", staff });
  }

  // Nesse ponto o campo não bateu com nenhuma conta de equipe (CPF nem
  // telefone). Se também não for um CPF válido, não vale a pena checar o
  // cliente — mas a mensagem fica genérica, porque a pessoa pode ter
  // digitado um telefone (de equipe) com a data de nascimento errada, e
  // "CPF inválido" seria uma pista errada nesse caso.
  if (!isValidCpf(cpf)) {
    registerFailure(cpf);
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const client = await advboxClient.getClientByCpfAndBirthDate(onlyDigits(cpf), birthDate);
  if (!client) {
    registerFailure(cpf);
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  registerSuccess(cpf);
  const { token } = signSession({ role: "cliente", clientId: client.id });
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  return res.json({ token, role: "cliente", client });
});

/**
 * O site não guarda mais o papel (cliente/equipe) em `localStorage` — o
 * token vive só no cookie httpOnly, que o JavaScript da página não
 * consegue ler. Por isso, ao carregar cada tela, o site chama essa rota
 * (o cookie vai junto automaticamente) para descobrir quem está logado.
 */
authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  return res.json({ role: req.session!.role, clientId: req.session!.clientId, staffId: req.session!.staffId });
});

authRouter.post("/logout", requireAuth, (req: AuthedRequest, res) => {
  if (req.sessionJti) revokeSession(req.sessionJti);
  res.clearCookie(SESSION_COOKIE, clearSessionCookieOptions());
  return res.json({ ok: true });
});
