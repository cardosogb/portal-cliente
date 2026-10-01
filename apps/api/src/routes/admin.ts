import { Router } from "express";
import rateLimit from "express-rate-limit";
import { advboxClient } from "../integrations/advboxAdapter";
import { daysSinceLastMovement, isStale, STALE_DAYS_THRESHOLD } from "../integrations/processHealth";
import { mockClients, mockSatisfaction, mockStaffUsers } from "@portal/shared";
import { requireAccessLevel, requireAuth, requireRole, type AuthedRequest } from "../auth";
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

/**
 * Dashboard de desenvolvimento do escritório: visão agregada de equipe e
 * processos, pra quem decide (TI, Diretoria, CEO) — não é algo que um
 * advogado individual precisa ver sobre o escritório inteiro. Por isso a
 * trava extra de `requireAccessLevel("executivo")`, além de já exigir ser
 * da equipe.
 */
adminRouter.get("/executive-overview", requireAccessLevel("executivo"), async (_req, res) => {
  const processes = await advboxClient.listAllProcesses();

  const byStatus: Record<string, number> = {};
  const byArea: Record<string, number> = {};
  for (const p of processes) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    byArea[p.area] = (byArea[p.area] ?? 0) + 1;
  }

  const staleCount = processes.filter(isStale).length;

  // Performance por advogado: cruza a pesquisa de satisfação com a
  // carteira de processos de cada um.
  const lawyerNames = new Set([...mockSatisfaction.map((s) => s.lawyerName), ...processes.map((p) => p.lawyerName)]);
  const staffPerformance = [...lawyerNames].map((lawyerName) => {
    const owned = processes.filter((p) => p.lawyerName === lawyerName);
    const satisfaction = mockSatisfaction.find((s) => s.lawyerName === lawyerName);
    return {
      lawyerName,
      activeProcesses: owned.filter((p) => p.status === "em_andamento").length,
      concludedProcesses: owned.filter((p) => p.status === "concluido").length,
      staleProcesses: owned.filter(isStale).length,
      averageScore: satisfaction?.averageScore ?? null,
      responseCount: satisfaction?.responseCount ?? 0,
    };
  });

  const team = mockStaffUsers.map((s) => ({
    name: s.name,
    title: s.title,
    accessLevel: s.accessLevel,
  }));

  return res.json({
    processTotals: {
      total: processes.length,
      byStatus,
      byArea,
      staleCount,
      staleDaysThreshold: STALE_DAYS_THRESHOLD,
    },
    staffPerformance,
    team,
  });
});
