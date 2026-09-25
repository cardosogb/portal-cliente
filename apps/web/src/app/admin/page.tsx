"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getAdminOverview, getRole, getToken, type AdminOverview } from "@/lib/api";
import { formatDatePtBR, statusLabel } from "@portal/shared";
import { Logo } from "@/components/Logo";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function statusPillClass(status: string): string {
  if (status === "concluido") return "pill pill-ok";
  if (status === "suspenso") return "pill pill-neutral";
  return "pill pill-action";
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    if (getRole() !== "escritorio") {
      router.push("/dashboard");
      return;
    }
    getAdminOverview().then(setData);
  }, [router]);

  function logout() {
    clearToken();
    router.push("/");
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = data?.rows.filter(
    (r) =>
      !normalizedSearch ||
      r.clientName.toLowerCase().includes(normalizedSearch) ||
      r.processNumber.toLowerCase().includes(normalizedSearch)
  );

  return (
    <div>
      <nav className="top-nav">
        <Logo height={36} variant="icon" />
        <button className="btn-secondary" onClick={logout} style={{ color: "var(--white)", borderColor: "#3a4a6b" }}>
          Sair
        </button>
      </nav>
      <main className="container">
        <h1 className="serif" style={{ marginBottom: 4 }}>Painel interno</h1>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Visão da equipe do escritório — não é o que o cliente vê.
        </p>
        {!data && <p>Carregando...</p>}
        {data && (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Processos sem atualização há mais de 15 dias
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 700 }}>{data.staleProcessesCount}</p>
            </div>

            <h2 className="serif" style={{ marginBottom: 10 }}>Clientes e processos</h2>

            <div className="admin-search-bar">
              <svg className="admin-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por cliente ou número do processo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="admin-search-meta">
              <span>
                {search ? (
                  <>
                    <strong>{filteredRows?.length ?? 0}</strong> de {data.rows.length} processos
                  </>
                ) : (
                  <>
                    <strong>{data.rows.length}</strong> processos no total
                  </>
                )}
              </span>
            </div>

            <div className="card" style={{ overflowX: "auto", marginBottom: 20, padding: 0 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Processo</th>
                    <th>Advogado</th>
                    <th>Último acesso</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows && filteredRows.length > 0 ? (
                    filteredRows.map((r) => (
                      <tr key={r.processNumber}>
                        <td>
                          <div className="admin-client-cell">
                            <span className="admin-avatar">{initials(r.clientName)}</span>
                            <span>{r.clientName}</span>
                          </div>
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{r.processNumber}</td>
                        <td>{r.lawyerName}</td>
                        <td>{r.lastAccessAt ? formatDatePtBR(r.lastAccessAt) : "—"}</td>
                        <td>
                          <span className={statusPillClass(r.status)}>{statusLabel(r.status)}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="admin-empty-state">
                          <div className="icon">🔍</div>
                          Nenhum cliente ou processo encontrado para &ldquo;{search}&rdquo;.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h2 className="serif">Satisfação consolidada por advogado</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {data.satisfaction.map((s) => (
                <div key={s.lawyerName} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{s.lawyerName}</span>
                  <span>{s.averageScore.toFixed(1)} ★ ({s.responseCount} respostas)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
