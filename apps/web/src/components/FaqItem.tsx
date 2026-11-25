"use client";

import { useState } from "react";

export function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? "open" : ""}`}>
      {/* <h3> em volta do botão dá a cada pergunta um nível de heading —
          numa lista longa de FAQ, quem usa leitor de tela navega por
          heading em vez de ouvir tudo em sequência. */}
      <h3 style={{ margin: 0, fontSize: "inherit", fontFamily: "inherit", fontWeight: "inherit" }}>
        <button type="button" className="faq-question" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {question}
          <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h3>
      <div className="faq-answer-wrap">
        <div className="faq-answer-inner">
          <div className="faq-answer" aria-hidden={!open}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
