"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getAdminOverview, getRole, getToken, type AdminOverview } from "@/lib/api";
import { formatDatePtBR, statusLabel } from "@portal/shared";
import { Logo } from "@/components/Logo";

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

            <h2 className="serif">Clientes e processos</h2>
            <input
              className="input"
              type="text"
              placeholder="Buscar por cliente ou número do processo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div className="card" style={{ overflowX: "auto", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: 8 }}>Cliente</th>
                    <th style={{ padding: 8 }}>Processo</th>
                    <th style={{ padding: 8 }}>Advogado</th>
                    <th style={{ padding: 8 }}>Último acesso</th>
                    <th style={{ padding: 8 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows && filteredRows.length > 0 ? (
                    filteredRows.map((r) => (
                      <tr key={r.processNumber} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: 8 }}>{r.clientName}</td>
                        <td style={{ padding: 8 }}>{r.processNumber}</td>
                        <td style={{ padding: 8 }}>{r.lawyerName}</td>
                        <td style={{ padding: 8 }}>{r.lastAccessAt ? formatDatePtBR(r.lastAccessAt) : "—"}</td>
                        <td style={{ padding: 8 }}>{statusLabel(r.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: 8, color: "var(--text-muted)" }}>
                        Nenhum cliente ou processo encontrado para "{search}".
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
