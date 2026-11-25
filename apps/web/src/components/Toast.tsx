"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Confirmação rápida e discreta depois de uma ação simples (copiar algo,
 * por exemplo) — some sozinha, sem precisar clicar em nada. Pensada pra
 * quem não tem certeza se "funcionou" depois de tocar num botão.
 */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(text);
    timeoutRef.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  return { message, showToast };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span aria-hidden="true">✓</span> {message}
    </div>
  );
}
