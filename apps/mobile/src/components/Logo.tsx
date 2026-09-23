import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

/**
 * Logo placeholder do escritório. Troque por uma <Image source={...} />
 * quando a arte oficial da Fernando Miranda Advogados estiver disponível.
 */
export function Logo({
  size = 36,
  showWordmark = true,
  variant = "light",
}: {
  size?: number;
  showWordmark?: boolean;
  variant?: "light" | "dark";
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.badgeText, { fontSize: size * 0.36 }]}>FM</Text>
      </View>
      {showWordmark && (
        <View>
          <Text style={styles.eyebrow}>FERNANDO MIRANDA</Text>
          <Text style={[styles.sub, { color: variant === "dark" ? "#c7ccd8" : colors.textMuted }]}>Advogados</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: {
    backgroundColor: colors.ink,
    borderWidth: 1.5,
    borderColor: colors.brass,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.brassLight, fontWeight: "700" },
  eyebrow: { color: colors.brass, fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  sub: { fontSize: 12 },
});
