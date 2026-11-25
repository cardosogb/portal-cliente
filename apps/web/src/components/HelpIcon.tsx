/**
 * Ícone de ajuda em SVG, não emoji (❓). O emoji "❓" tem cor própria
 * (vermelho/laranja) definida pela fonte do sistema — não dá pra combinar
 * com a cor do texto ao lado, e destoa da paleta discreta do resto do
 * app. Com `currentColor` o ícone sempre acompanha a cor do link.
 */
export function HelpIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ verticalAlign: "-2px", marginRight: 5, flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.5 9.2c0-1.4 1.1-2.4 2.6-2.4s2.5.9 2.5 2.1c0 1-0.6 1.6-1.5 2.2-0.8.5-1.1.9-1.1 1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="16.6" r="1.1" fill="currentColor" />
    </svg>
  );
}
