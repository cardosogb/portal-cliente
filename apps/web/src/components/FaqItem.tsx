"use client";

import { useState } from "react";

export function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? "open" : ""}`}>
      <button type="button" className="faq-question" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {question}
        <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
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
