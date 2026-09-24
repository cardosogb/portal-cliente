import { Router } from "express";
import { advboxClient } from "../integrations/advboxAdapter";
import { mockClients, mockSatisfaction } from "@portal/shared";
import { requireAuth, requireRole } from "../auth";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("escritorio"));

const STALE_DAYS_THRESHOLD = 15;

adminRouter.get("/overview", async (_req, res) => {
  const processes = await advboxClient.listAllProcesses();

  const staleProcesses = processes.filter((p) => {
    const lastEvent = p.timeline[0];
    if (!lastEvent) return true;
    const days = (Date.now() - new Date(lastEvent.date).getTime()) / 86_400_000;
    return days > STALE_DAYS_THRESHOLD && p.status === "em_andamento";
  });

  const rows = processes.map((p) => {
    const client = mockClients.find((c) => c.id === p.clientId);
    return {
      clientName: client?.name ?? "—",
      processNumber: p.number,
      lawyerName: p.lawyerName,
      lastAccessAt: client?.lastAccessAt ?? null,
      status: p.status,
    };
  });

  return res.json({
    staleProcessesCount: staleProcesses.length,
    rows,
    satisfaction: mockSatisfaction,
  });
});
