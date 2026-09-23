import { Stack } from "expo-router";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
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
