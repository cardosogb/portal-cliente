import { Stack } from "expo-router";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        // O tipo de headerStyle do expo-router só declara backgroundColor,
        // mas o componente nativo aceita o resto normalmente — daí o `as any`.
        headerStyle: {
          backgroundColor: colors.ink,
          borderBottomWidth: 2,
          borderBottomColor: colors.brass,
        } as any,
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: colors.fog },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Portal do Cliente" }} />
      <Stack.Screen name="dashboard" options={{ title: "Seus processos" }} />
      <Stack.Screen name="process/[id]" options={{ title: "Processo" }} />
    </Stack>
  );
}
