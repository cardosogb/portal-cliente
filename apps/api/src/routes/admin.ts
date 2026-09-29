import { Router } from "express";
import { advboxClient } from "../integrations/advboxAdapter";
import { daysSinceLastMovement, isStale, STALE_DAYS_THRESHOLD } from "../integrations/processHealth";
import { mockClients, mockSatisfaction } from "@portal/shared";
import { requireAuth, requireRole } from "../auth";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("escritorio"));

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
