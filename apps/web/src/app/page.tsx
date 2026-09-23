"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("maria.souza@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
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
          <Logo size={48} />
        </div>
        <h1 style={{ fontSize: "1.6rem", margin: "0 0 6px" }}>Portal do Cliente</h1>
        <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Acompanhe seu processo aqui, sem precisar ligar para o escritório.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>E-mail</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginTop: 4 }}
            />
          </label>
          <label style={{ display: "block", marginBottom: 20 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Senha</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ marginTop: 4 }}
            />
          </label>
          {error && <p style={{ color: "var(--wine)", marginBottom: 16 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 16 }}>
          Demo: qualquer senha funciona para maria.souza@example.com
        </p>
      </div>
    </main>
  );
}
