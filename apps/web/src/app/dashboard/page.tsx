"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LegalProcess } from "@portal/shared";
import { areaLabel, statusLabel } from "@portal/shared";
import { getSession, listProcesses, logout as apiLogout } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { CardSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";

export default function DashboardPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState<LegalProcess[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
      setError(null);
      listProcesses()
        .then((data) => setProcesses(data.processes))
        .catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar seus processos agora."));
    });
  }, [router, retryCount]);

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <h1 className="serif" style={{ fontSize: "1.6rem", margin: 0 }}>Seus processos</h1>
          <Link href="/ajuda" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            ❓ Central de ajuda
          </Link>
        </div>
        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              color: "var(--wine)",
              background: "#f6e6c8",
              padding: "12px 16px",
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <span>⚠️ {error}</span>
            <button type="button" className="btn-secondary" onClick={() => setRetryCount((c) => c + 1)}>
              Tentar novamente
            </button>
          </div>
        )}
        {!processes && !error && (
          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        {processes && processes.length === 0 && (
          <EmptyState
            icon="📂"
            title="Você ainda não tem nenhum processo vinculado."
            description="Assim que o escritório vincular um processo ao seu cadastro, ele aparece aqui automaticamente — não precisa fazer nada."
          />
        )}
        <div className="stagger-fade" style={{ display: "grid", gap: 16, marginTop: 16 }}>
          {processes?.map((p) => (
            <Link key={p.id} href={`/processes/${p.id}`} className="card" style={{ display: "block", textDecoration: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
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
