import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "@/theme/colors";

// Mantém a splash screen nativa (logo no fundo escuro) visível até a tela
// inicial (app/index.tsx) terminar de checar se já existe uma sessão
// salva e decidir pra onde ir — sem isso, apareceria um instante de tela
// branca/vazia entre o app abrir e o login (ou o painel) aparecer.
SplashScreen.preventAutoHideAsync();

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
      <Stack.Screen name="ajuda" options={{ title: "Central de ajuda" }} />
      <Stack.Screen name="admin" options={{ title: "Painel interno" }} />
      <Stack.Screen name="admin/executivo" options={{ title: "Dashboard executivo" }} />
    </Stack>
  );
}
