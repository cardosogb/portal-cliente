"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { onlyDigits } from "@portal/shared";
import { login } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState("12345678909");
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
          </label>
          <label style={{ display: "block", marginBottom: 8 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Data de nascimento (dia e mês)</span>
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
          </label>
          <p style={{ margin: "0 0 20px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Use sua senha do portal: os 2 dígitos do dia seguidos dos 2 dígitos do mês em
            que você nasceu. Exemplo: nascido em 5 de março → 0503.
          </p>
          {error && <p style={{ color: "var(--wine)", marginBottom: 16 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 16 }}>
          Demo: CPF 12345678909, nascimento 1204 → entra como cliente.
          CPF 11122233396, nascimento 2207 → entra no painel interno.
        </p>
      </div>
    </main>
  );
}
