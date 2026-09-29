import { Router } from "express";
import rateLimit from "express-rate-limit";
import { advboxClient } from "../integrations/advboxAdapter";
import { daysSinceLastMovement, isStale, STALE_DAYS_THRESHOLD } from "../integrations/processHealth";
import { mockClients, mockSatisfaction, mockStaffUsers } from "@portal/shared";
import { requireAuth, requireRole, type AuthedRequest } from "../auth";
import { getRecentAccess, recordAccess } from "../auditLog";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("escritorio"));
adminRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));

// Toda requisição autenticada de equipe ao painel fica registrada aqui
// (quem, o quê, quando) — ver auditLog.ts.
adminRouter.use((req: AuthedRequest, res, next) => {
  const staffId = req.session?.staffId ?? "—";
  const staffName = mockStaffUsers.find((s) => s.id === staffId)?.name ?? staffId;
  recordAccess({ staffId, staffName, action: `${req.method} ${req.path}`, ip: req.ip ?? "—" });
  next();
});

adminRouter.get("/audit-log", (_req, res) => {
  return res.json({ entries: getRecentAccess() });
});

adminRouter.get("/overview", async (_req, res) => {
  const processes = await advboxClient.listAllProcesses();

  const rows = processes
    .map((p) => {
      const client = mockClients.find((c) => c.id === p.clientId);
      return {
        clientName: client?.name ?? "—",
        processNumber: p.number,
        lawyerName: p.lawyerName,
        lastAccessAt: client?.lastAccessAt ?? null,
        status: p.status,
        daysSinceLastMovement: daysSinceLastMovement(p),
        isStale: isStale(p),
      };
    })
    // processos parados primeiro, do mais tempo sem mexer pro menos
    .sort((a, b) => (b.daysSinceLastMovement ?? -1) - (a.daysSinceLastMovement ?? -1));

  const staleProcessesCount = rows.filter((r) => r.isStale).length;

  return res.json({
    staleProcessesCount,
    staleDaysThreshold: STALE_DAYS_THRESHOLD,
    rows,
    satisfaction: mockSatisfaction,
  });
});
