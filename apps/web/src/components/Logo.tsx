import Image from "next/image";

/**
 * Logo oficial da Fernando Miranda Advogados.
 * - variant="full": marca completa (ícone + nome), para fundos claros.
 * - variant="icon": só o monograma dourado, para fundos escuros (ex.: navegação).
 */
export function Logo({ height = 40, variant = "full" }: { height?: number; variant?: "full" | "icon" }) {
  if (variant === "icon") {
    return (
      <Image
        src="/logo-icon.png"
        alt="Fernando Miranda Advogados"
        height={height}
        width={height * (754 / 459)}
        style={{ height, width: "auto" }}
        priority
      />
    );
  }
  return (
    <Image
      src="/logo-full.png"
      alt="Fernando Miranda Advogados"
      height={height}
      width={height * (1980 / 812)}
      style={{ height, width: "auto" }}
      priority
    />
  );
}
