"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LegalProcess } from "@portal/shared";
import { areaLabel, statusLabel } from "@portal/shared";
import { getSession, listProcesses, logout as apiLogout } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function DashboardPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState<LegalProcess[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.push("/");
        return;
      }
      if (session.role === "escritorio") {
        router.push("/admin");
        return;
      }
      listProcesses()
        .then((data) => setProcesses(data.processes))
        .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar."));
    });
  }, [router]);

  function logout() {
    apiLogout().finally(() => router.push("/"));
  }

  return (
    <div>
      <nav className="top-nav">
        <Logo height={36} variant="icon" href="/dashboard" />
        <button className="btn-secondary" onClick={logout} style={{ color: "var(--white)", borderColor: "#3a4a6b" }}>
          Sair
        </button>
      </nav>
      <main className="container">
        <h1 className="serif" style={{ fontSize: "1.6rem" }}>Seus processos</h1>
        {error && <p style={{ color: "var(--wine)" }}>{error}</p>}
        {!processes && !error && <p>Carregando...</p>}
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          {processes?.map((p) => (
            <Link key={p.id} href={`/processes/${p.id}`} className="card" style={{ display: "block", textDecoration: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {areaLabel(p.area)} · {p.court}
                  </p>
                  <h2 className="serif" style={{ margin: "4px 0", fontSize: "1.15rem" }}>
                    Processo nº {p.number}
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>{statusLabel(p.status)} — {p.currentPhase}</p>
                </div>
                <span className={p.nextAction.type === "acao" ? "pill pill-action" : "pill pill-ok"}>
                  {p.nextAction.type === "acao" ? "Ação necessária" : "Em dia"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
