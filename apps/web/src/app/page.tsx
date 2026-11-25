"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onlyDigits } from "@portal/shared";
import { login } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(cpf, birthDate);
      router.push(result.role === "escritorio" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, var(--ink) 0%, #0d1830 100%)",
        padding: 24,
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ marginBottom: 20 }}>
          <Logo height={56} variant="full" />
        </div>
        <h1 style={{ fontSize: "1.6rem", margin: "0 0 6px" }}>Portal do Cliente</h1>
        <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Acompanhe seu processo aqui, sem precisar ligar para o escritório.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>CPF</span>
            <div className="input-wrap">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="Só números, sem pontuação"
                value={cpf}
                onChange={(e) => setCpf(onlyDigits(e.target.value).slice(0, 11))}
                maxLength={11}
                required
                style={{ marginTop: 4 }}
              />
              {cpf.length === 11 && (
                <span className="input-check" aria-hidden="true">✓</span>
              )}
            </div>
            <span style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>Se você faz parte da equipe do escritório, também pode entrar com seu telefone.</span>
            </span>
            {cpf.length > 0 && (
              <span className={`field-status ${cpf.length === 11 ? "ok" : "pending"}`} style={{ marginTop: 4 }}>
                {cpf.length === 11 ? "✓ Número completo" : `Faltam ${11 - cpf.length} número(s)`}
              </span>
            )}
          </label>
          <label style={{ display: "block", marginBottom: 8 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Data de nascimento (dia e mês)</span>
            <div className="input-wrap">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="DDMM"
                value={birthDate}
                onChange={(e) => setBirthDate(onlyDigits(e.target.value).slice(0, 4))}
                maxLength={4}
                required
                style={{ marginTop: 4 }}
              />
              {birthDate.length === 4 && (
                <span className="input-check" aria-hidden="true">✓</span>
              )}
            </div>
            {birthDate.length > 0 && (
              <span className={`field-status ${birthDate.length === 4 ? "ok" : "pending"}`} style={{ marginTop: 4 }}>
                {birthDate.length === 4 ? "✓ Data completa" : `Faltam ${4 - birthDate.length} número(s)`}
              </span>
            )}
          </label>
          <p style={{ margin: "8px 0 20px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Use sua senha do portal: os 2 dígitos do dia seguidos dos 2 dígitos do mês em
            que você nasceu. Exemplo: nascido em 5 de março → 0503.
          </p>
          {error && (
            <p
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--wine)",
                background: "#f6e6c8",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: "0.88rem",
              }}
            >
              <span aria-hidden="true">⚠️</span> {error}
            </p>
          )}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 16 }}>
          Demo: CPF 12345678909, nascimento 1204 → entra como cliente.
          CPF 11122233396 (ou telefone 27998210707), nascimento 2207 → entra no painel interno.
        </p>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 12, textAlign: "center" }}>
          <Link href="/ajuda" style={{ color: "inherit" }}>
            Central de ajuda
          </Link>
          {" · "}
          <Link href="/privacidade" style={{ color: "inherit" }}>
            Como cuidamos dos seus dados
          </Link>
        </p>
      </div>
    </main>
  );
}
