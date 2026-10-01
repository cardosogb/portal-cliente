"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { areaLabel, statusLabel } from "@portal/shared";
import { getExecutiveOverview, getSession, logout as apiLogout, type ExecutiveOverview } from "@/lib/api";
import { Logo } from "@/components/Logo";

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: "wine" | "forest" }) {
  return (
    <div className="card">
      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>{label}</p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: "2rem",
          fontWeight: 700,
          color: accent ? `var(--${accent})` : "var(--text)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

/** Barra horizontal simples de magnitude (uma cor só — a identidade já vem do rótulo ao lado). */
function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ width: 140, fontSize: "0.85rem", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, background: "var(--fog-2)", borderRadius: 4, height: 10 }}>
        <div style={{ width: `${pct}%`, background: "var(--brass)", borderRadius: 4, height: 10 }} />
      </div>
      <span style={{ width: 28, fontSize: "0.85rem", textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
    </div>
  );
}

export default function ExecutiveDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ExecutiveOverview | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.push("/");
        return;
      }
      if (session.role !== "escritorio") {
        router.push("/dashboard");
        return;
      }
      if (session.staffAccessLevel !== "executivo") {
        setDenied(true);
        return;
      }
      getExecutiveOverview().then(setData);
    });
  }, [router]);

  function logout() {
    apiLogout().finally(() => router.push("/"));
  }

  if (denied) {
    return (
      <div>
        <nav className="top-nav">
          <Logo height={36} variant="icon" href="/admin" />
          <button className="btn-secondary" onClick={logout} style={{ color: "var(--white)", borderColor: "#3a4a6b" }}>
            Sair
          </button>
        </nav>
        <main className="container">
          <h1 className="serif">Acesso restrito</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Esse dashboard é só para TI, Diretoria e CEO. Se você acha que deveria ter acesso, fale com a diretoria.
          </p>
          <Link href="/admin">← Voltar ao painel interno</Link>
        </main>
      </div>
    );
  }

  const maxStatus = data ? Math.max(1, ...Object.values(data.processTotals.byStatus)) : 1;
  const maxArea = data ? Math.max(1, ...Object.values(data.processTotals.byArea)) : 1;

  return (
    <div>
      <nav className="top-nav">
        <Logo height={36} variant="icon" href="/admin" />
        <button className="btn-secondary" onClick={logout} style={{ color: "var(--white)", borderColor: "#3a4a6b" }}>
          Sair
        </button>
      </nav>
      <main className="container">
        <Link href="/admin" style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "none" }}>
          ← Painel interno
        </Link>
        <h1 className="serif" style={{ margin: "4px 0 4px" }}>Dashboard executivo</h1>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Visão do desenvolvimento do escritório — equipe e processos. Acesso restrito a TI, Diretoria e CEO.
        </p>

        {!data && <p>Carregando...</p>}
        {data && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
              <StatTile label="Processos no escritório" value={data.processTotals.total} />
              <StatTile
                label={`Parados há mais de ${data.processTotals.staleDaysThreshold} dias`}
                value={data.processTotals.staleCount}
                accent={data.processTotals.staleCount > 0 ? "wine" : "forest"}
              />
              <StatTile label="Concluídos" value={data.processTotals.byStatus["concluido"] ?? 0} accent="forest" />
              <StatTile label="Funcionários com acesso ao painel" value={data.team.length} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div className="card">
                <h2 className="serif" style={{ fontSize: "1.05rem", marginBottom: 12 }}>Processos por status</h2>
                {Object.entries(data.processTotals.byStatus).map(([status, count]) => (
                  <BarRow key={status} label={statusLabel(status)} value={count} max={maxStatus} />
                ))}
              </div>
              <div className="card">
                <h2 className="serif" style={{ fontSize: "1.05rem", marginBottom: 12 }}>Processos por área</h2>
                {Object.entries(data.processTotals.byArea).map(([area, count]) => (
                  <BarRow key={area} label={areaLabel(area)} value={count} max={maxArea} />
                ))}
              </div>
            </div>

            <h2 className="serif" style={{ marginBottom: 10 }}>Desenvolvimento por advogado</h2>
            <div className="card" style={{ overflowX: "auto", marginBottom: 24, padding: 0 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Advogado</th>
                    <th>Ativos</th>
                    <th>Concluídos</th>
                    <th>Parados</th>
                    <th>Satisfação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staffPerformance.map((s) => (
                    <tr key={s.lawyerName}>
                      <td>{s.lawyerName}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{s.activeProcesses}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{s.concludedProcesses}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums", color: s.staleProcesses > 0 ? "var(--wine)" : undefined }}>
                        {s.staleProcesses}
                      </td>
                      <td>
                        {s.averageScore !== null ? `${s.averageScore.toFixed(1)} ★ (${s.responseCount})` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="serif" style={{ marginBottom: 10 }}>Equipe com acesso ao painel interno</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {data.team.map((member) => (
                <div key={member.name} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0 }}>{member.name}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{member.title}</p>
                  </div>
                  <span className={member.accessLevel === "executivo" ? "pill pill-action" : "pill pill-neutral"}>
                    {member.accessLevel === "executivo" ? "Acesso executivo" : "Acesso padrão"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
