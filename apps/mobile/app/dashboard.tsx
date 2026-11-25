import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter, Stack, Link } from "expo-router";
import type { LegalProcess } from "@portal/shared";
import { areaLabel, statusLabel } from "@portal/shared";
import { getToken, listProcesses, logout } from "@/lib/api";
import { colors } from "@/theme/colors";
import { Logo } from "@/components/Logo";
import { FadeInView } from "@/components/FadeInView";

export default function DashboardScreen() {
  const router = useRouter();
  const [processes, setProcesses] = useState<LegalProcess[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/");
        return;
      }
      try {
        const data = await listProcesses();
        setProcesses(data.processes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar.");
      }
    })();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={handleLogout} hitSlop={10} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Sair</Text>
            </Pressable>
          ),
        }}
      />
      <View style={{ marginBottom: 16 }}>
        <Logo height={32} variant="full" />
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Seus processos</Text>
        <Link href="/ajuda" style={styles.helpLink}>
          Central de ajuda
        </Link>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {processes === null && !error && (
        <View style={{ gap: 12 }}>
          <View style={[styles.card, styles.skeletonCard]} />
          <View style={[styles.card, styles.skeletonCard]} />
        </View>
      )}
      {processes !== null && processes.length === 0 && !error && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Você ainda não tem nenhum processo vinculado.</Text>
          <Text style={styles.emptyDesc}>
            Assim que o escritório vincular um processo ao seu cadastro, ele aparece aqui
            automaticamente — não precisa fazer nada.
          </Text>
        </View>
      )}
      <FlatList
        data={processes ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item, index }) => (
          <FadeInView delay={index * 70}>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/process/${item.id}`)}
            >
              <Text style={styles.meta}>
                {areaLabel(item.area)} · {item.court}
              </Text>
              <Text style={styles.title}>Processo nº {item.number}</Text>
              <Text style={styles.subtitle}>
                {statusLabel(item.status)} — {item.currentPhase}
              </Text>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: item.nextAction.type === "acao" ? "#f6e6c8" : "#dcecdf" },
                ]}
              >
                <Text style={{ color: item.nextAction.type === "acao" ? "#7a5a13" : colors.forest, fontSize: 12, fontWeight: "700" }}>
                  {item.nextAction.type === "acao" ? "Ação necessária" : "Em dia"}
                </Text>
              </View>
            </Pressable>
          </FadeInView>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fog, padding: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  helpLink: { color: colors.textMuted, fontSize: 13, textDecorationLine: "underline" },
  headerButton: { minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "flex-end" },
  headerButtonText: { color: colors.white, fontSize: 14 },
  skeletonCard: { height: 84, backgroundColor: colors.border, borderColor: colors.border },
  emptyState: { padding: 24, alignItems: "center" },
  emptyTitle: { fontWeight: "600", color: colors.text, textAlign: "center", marginBottom: 4 },
  emptyDesc: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
  error: { color: colors.wine, marginBottom: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { transform: [{ scale: 0.98 }], borderColor: colors.brass },
  meta: { color: colors.textMuted, fontSize: 12 },
  title: { fontSize: 17, fontWeight: "600", color: colors.text },
  subtitle: { color: colors.text },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
});
