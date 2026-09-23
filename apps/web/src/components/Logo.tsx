/**
 * Logo placeholder do escritório. Troque por um <img src="/logo.svg" />
 * (ou similar) quando a arte oficial da Fernando Miranda Advogados
 * estiver disponível — o restante do layout já reserva o espaço certo.
 */
export function Logo({
  size = 40,
  showWordmark = true,
  variant = "light",
}: {
  size?: number;
  showWordmark?: boolean;
  variant?: "light" | "dark";
}) {
  const subColor = variant === "dark" ? "#c7ccd8" : "var(--text-muted)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="var(--ink)" stroke="var(--brass)" strokeWidth="1.5" />
        <text
          x="20"
          y="26"
          textAnchor="middle"
          fontFamily="'Fraunces', serif"
          fontSize="15"
          fontWeight={600}
          fill="var(--brass-light)"
        >
          FM
        </text>
      </svg>
      {showWordmark && (
        <div style={{ lineHeight: 1.1 }}>
          <p style={{ margin: 0, fontSize: "0.65rem", letterSpacing: 1.5, textTransform: "uppercase", color: "var(--brass)", fontWeight: 700 }}>
            Fernando Miranda
          </p>
          <p style={{ margin: 0, fontSize: "0.78rem", color: subColor }}>Advogados</p>
        </div>
      )}
    </div>
  );
}
