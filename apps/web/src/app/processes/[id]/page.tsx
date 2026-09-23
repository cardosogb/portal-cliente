"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { LegalProcess, Message } from "@portal/shared";
import { formatBRL, formatDatePtBR, areaLabel, phaseExplanation } from "@portal/shared";
import { getProcess, getToken, listMessages, sendMessage } from "@/lib/api";
import { Logo } from "@/components/Logo";

type Tab = "timeline" | "documentos" | "financeiro" | "mensagens";

const TAB_LABELS: Array<[Tab, string]> = [
  ["timeline", "Linha do tempo"],
  ["documentos", "Documentos"],
  ["financeiro", "Financeiro"],
  ["mensagens", "Mensagens"],
];

export default function ProcessPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [process, setProcess] = useState<LegalProcess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("timeline");
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    getProcess(params.id)
      .then((data) => setProcess(data.process))
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar."));
  }, [params.id, router]);

  if (error) {
    return (
      <div className="container">
        <p style={{ color: "var(--wine)" }}>{error}</p>
        <Link href="/dashboard">Voltar</Link>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="container">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <nav className="top-nav">
        <Logo size={32} variant="dark" />
        <Link href="/dashboard" style={{ color: "var(--white)", textDecoration: "none", fontSize: "0.85rem" }}>
          ← Voltar
        </Link>
      </nav>
      <main className="container">
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {areaLabel(process.area)} · {process.court}
        </p>
        <h1 className="serif" style={{ margin: "4px 0 4px" }}>Processo nº {process.number}</h1>
        <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Fase atual: <strong>{process.currentPhase}</strong> — {phaseExplanation(process.currentPhase)}
        </p>

        <div className="card" style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontWeight: 600, color: process.nextAction.type === "acao" ? "var(--wine)" : "var(--forest)" }}>
            {process.nextAction.text}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>{process.forecast}</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {TAB_LABELS.map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "btn-primary" : "btn-secondary"}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "timeline" && (
          <div style={{ display: "grid", gap: 12 }}>
            {process.timeline.map((event) => (
              <div key={event.id} className="card">
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{formatDatePtBR(event.date)}</p>
                <p style={{ margin: "6px 0" }}>{event.plainText}</p>
                <button
                  className="btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                  onClick={() => setShowOriginal((s) => ({ ...s, [event.id]: !s[event.id] }))}
                >
                  {showOriginal[event.id] ? "Ocultar texto original" : "Ver texto original do processo"}
                </button>
                {showOriginal[event.id] && (
                  <p style={{ marginTop: 10, fontSize: "0.85rem", fontStyle: "italic", color: "var(--text-muted)" }}>
                    {event.originalText}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "documentos" && (
          <div style={{ display: "grid", gap: 8 }}>
            {process.documents.map((doc) => (
              <a key={doc.id} href={doc.url} className="card" style={{ display: "flex", justifyContent: "space-between", textDecoration: "none" }}>
                <span>{doc.title}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{formatDatePtBR(doc.uploadedAt)} · {doc.sizeKb} KB</span>
              </a>
            ))}
          </div>
        )}

        {tab === "financeiro" && (
          <div style={{ display: "grid", gap: 8 }}>
            {process.financial.map((f) => (
              <div key={f.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0 }}>{f.description}</p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>Vencimento: {formatDatePtBR(f.dueDate)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{formatBRL(f.amountCents)}</p>
                  <span className={f.status === "pago" ? "pill pill-ok" : "pill pill-action"}>{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "mensagens" && <MessagesPanel processId={process.id} />}
      </main>
    </div>
  );
}

function MessagesPanel({ processId }: { processId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    listMessages(processId).then((data) => setMessages(data.messages));
  }, [processId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { message } = await sendMessage(processId, text);
      setMessages((m) => [...m, message]);
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            className="card"
            style={{
              maxWidth: "80%",
              alignSelf: m.authorRole === "cliente" ? "flex-end" : "flex-start",
              background: m.authorRole === "cliente" ? "var(--fog-2)" : "var(--white)",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.authorName}</p>
            <p style={{ margin: "4px 0 0" }}>{m.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem..." />
        <button className="btn-primary" type="submit" disabled={sending}>
          Enviar
        </button>
      </form>
    </div>
  );
}
