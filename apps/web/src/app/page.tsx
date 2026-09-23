"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

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
        <p style={{ textTransform: "uppercase", letterSpacing: 2, color: "var(--brass)", fontSize: "0.75rem", fontWeight: 700 }}>
          Fernando Miranda Advogados
        </p>
        <h1 style={{ fontSize: "1.6rem", margin: "8px 0 24px" }}>Portal do Cliente</h1>
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
