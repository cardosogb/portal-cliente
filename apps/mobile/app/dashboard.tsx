import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import type { LegalProcess } from "@portal/shared";
import { areaLabel, statusLabel } from "@portal/shared";
import { getToken, listProcesses } from "@/lib/api";
import { colors } from "@/theme/colors";
import { Logo } from "@/components/Logo";

export default function DashboardScreen() {
  const router = useRouter();
  const [processes, setProcesses] = useState<LegalProcess[]>([]);
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

  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 16 }}>
        <Logo height={32} variant="full" />
      </View>
      <Text style={styles.sectionTitle}>Seus processos</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={processes}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/process/${item.id}`)}>
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
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fog, padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 12 },
  error: { color: colors.wine, marginBottom: 12 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 4 },
  meta: { color: colors.textMuted, fontSize: 12 },
  title: { fontSize: 17, fontWeight: "600", color: colors.text },
  subtitle: { color: colors.text },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
});
