import { Image } from "react-native";

const FULL_RATIO = 1980 / 812;
const ICON_RATIO = 754 / 459;

/**
 * Logo oficial da Fernando Miranda Advogados.
 * - variant="full": marca completa (ícone + nome), para fundos claros.
 * - variant="icon": só o monograma dourado, para fundos escuros (ex.: tela de login).
 */
export function Logo({ height = 36, variant = "full" }: { height?: number; variant?: "full" | "icon" }) {
  if (variant === "icon") {
    return (
      <Image
        source={require("../../assets/logo-icon.png")}
        style={{ height, width: height * ICON_RATIO }}
        resizeMode="contain"
      />
    );
  }
  return (
    <Image
      source={require("../../assets/logo-full.png")}
      style={{ height, width: height * FULL_RATIO }}
      resizeMode="contain"
    />
  );
}
