import Image from "next/image";
import Link from "next/link";

/**
 * Logo oficial da Fernando Miranda Advogados.
 * - variant="full": marca completa (ícone + nome), para fundos claros.
 * - variant="icon": só o monograma dourado, para fundos escuros (ex.: navegação).
 * - href: quando informado, a logo vira um link (padrão comum de sites:
 *   clicar na logo volta para a página principal). Deixe vazio em telas
 *   sem "home" para voltar, como o login.
 */
export function Logo({
  height = 40,
  variant = "full",
  href,
}: {
  height?: number;
  variant?: "full" | "icon";
  href?: string;
}) {
  const image =
    variant === "icon" ? (
      <Image
        src="/logo-icon.png"
        alt="Fernando Miranda Advogados"
        height={height}
        width={height * (754 / 459)}
        style={{ height, width: "auto" }}
        priority
      />
    ) : (
      <Image
        src="/logo-full.png"
        alt="Fernando Miranda Advogados"
        height={height}
        width={height * (1980 / 812)}
        style={{ height, width: "auto" }}
        priority
      />
    );

  if (!href) return image;

  return (
    <Link href={href} style={{ display: "inline-flex", lineHeight: 0 }} aria-label="Ir para a página principal">
      {image}
    </Link>
  );
}
