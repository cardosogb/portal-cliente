"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { LegalProcess } from "@portal/shared";
import {
  formatBRL,
  formatDatePtBR,
  areaLabel,
  phaseExplanation,
  whatsappLink,
  pendingActionWhatsappMessage,
} from "@portal/shared";
import { getProcess, getToken } from "@/lib/api";
import { Logo } from "@/components/Logo";

type Tab = "timeline" | "documentos" | "financeiro";

const TAB_LABELS: Array<[Tab, string]> = [
  ["timeline", "Linha do tempo"],
  ["documentos", "Documentos"],
  ["financeiro", "Financeiro"],
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

  const needsAction = process.nextAction.type === "acao";

  return (
    <div>
      <nav className="top-nav">
        <Logo height={36} variant="icon" />
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
          <p style={{ margin: 0, fontWeight: 600, color: needsAction ? "var(--wine)" : "var(--forest)" }}>
            {process.nextAction.text}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>{process.forecast}</p>
          {needsAction && (
            <a
              href={whatsappLink(pendingActionWhatsappMessage(process.number, process.nextAction.text))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{ marginTop: 14 }}
            >
              <WhatsappIcon /> Enviar pelo WhatsApp do escritório
            </a>
          )}
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
                <p style={{ margin: "6px 0 4px", fontWeight: 600 }}>{event.plainText}</p>
                <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--text-muted)" }}>{event.explanation}</p>
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
      </main>
    </div>
  );
}

function WhatsappIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ verticalAlign: "-3px", marginRight: 6 }}>
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.43 1.32 4.92L2.05 22l5.31-1.39a9.87 9.87 0 0 0 4.68 1.19h.01c5.46 0 9.9-4.45 9.9-9.9 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.19 0 4.25.85 5.8 2.4a8.2 8.2 0 0 1 2.41 5.84c0 4.55-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.15.83.84-3.07-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.55 3.7-8.23 8.29-8.23Zm-3.9 4.4c-.16 0-.42.06-.64.31s-.85.83-.85 2.02.87 2.34.99 2.5c.12.16 1.7 2.6 4.13 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.36-.77-1.86-.2-.48-.4-.42-.55-.43h-.1Z"
      />
    </svg>
  );
}
