import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { areaLabel, statusLabel, formatDatePtBR } from "@portal/shared";
import { getToken, getSession, getExecutiveOverview, logout, type ExecutiveOverview } from "@/lib/api";
import { colors } from "@/theme/colors";
import { FadeInView } from "@/components/FadeInView";

export default function ExecutivoScreen() {
  const router = useRouter();
  const [data, setData] = useState<ExecutiveOverview | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/");
        return;
      }
      const session = await getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      if (session.role !== "escritorio") {
        router.replace("/dashboard");
        return;
      }
      if (session.staffAccessLevel !== "executivo") {
        setDenied(true);
        return;
      }
      try {
        setData(await getExecutiveOverview());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar.");
      }
    })();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  if (denied) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Acesso restrito</Text>
        <Text style={styles.meta}>Esse dashboard é só para TI, Diretoria e CEO.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={handleLogout} hitSlop={10} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Sair</Text>
            </Pressable>
          ),
        }}
      />
      <Text style={styles.sectionTitle}>Dashboard executivo</Text>
      <Text style={styles.subtitle}>
        Visão do desenvolvimento do escritório — equipe e processos. Acesso restrito a TI, Diretoria e CEO.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {!data && !error && <Text style={styles.meta}>Carregando…</Text>}

      {data && (
        <>
          <View style={styles.tileGrid}>
            <StatTile label="Processos no escritório" value={data.processTotals.total} />
            <StatTile
              label={`Parados há mais de ${data.processTotals.staleDaysThreshold} dias`}
              value={data.processTotals.staleCount}
              accent={data.processTotals.staleCount > 0 ? colors.wine : colors.forest}
            />
            <StatTile label="Concluídos" value={data.processTotals.byStatus["concluido"] ?? 0} accent={colors.forest} />
            <StatTile label="Funcionários com acesso" value={data.team.length} />
            <StatTile label={`Prazos em ${data.deadlines.windowDays} dias`} value={data.deadlines.upcomingCount} />
          </View>

          <Text style={styles.subsectionTitle}>Processos por status</Text>
          <View style={styles.card}>
            {Object.entries(data.processTotals.byStatus).map(([status, count]) => (
              <View key={status} style={styles.barRow}>
                <Text style={styles.barLabel}>{statusLabel(status)}</Text>
                <Text style={styles.barValue}>{count}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.subsectionTitle}>Processos por área</Text>
          <View style={styles.card}>
            {Object.entries(data.processTotals.byArea).map(([area, count]) => (
              <View key={area} style={styles.barRow}>
                <Text style={styles.barLabel}>{areaLabel(area)}</Text>
                <Text style={styles.barValue}>{count}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.subsectionTitle}>Prazos mais próximos</Text>
          <Text style={styles.meta}>
            Intimações recebidas nos últimos {data.deadlines.windowDays} dias, com prazo ainda não vencido.
          </Text>
          {data.deadlines.nearest.length === 0 ? (
            <Text style={[styles.meta, { marginTop: 8, marginBottom: 8 }]}>Nenhum prazo pendente no momento.</Text>
          ) : (
            data.deadlines.nearest.map((d, i) => (
              <FadeInView key={`${d.processNumber}-${d.date}-${i}`} delay={i * 30} style={styles.card}>
                <View style={styles.teamRow}>
                  <Text style={styles.rowTitle}>{formatDatePtBR(d.date)}</Text>
                  <Text style={styles.meta}>{d.court}</Text>
                </View>
                <Text style={styles.meta}>{d.processNumber}</Text>
                <Text style={styles.meta}>{d.clientName} · {d.lawyerName}</Text>
              </FadeInView>
            ))
          )}

          <Text style={styles.subsectionTitle}>Desenvolvimento por advogado</Text>
          {data.staffPerformance.map((s, i) => (
            <FadeInView key={s.lawyerName} delay={i * 40} style={styles.card}>
              <Text style={styles.rowTitle}>{s.lawyerName}</Text>
              <Text style={styles.meta}>
                Ativos: {s.activeProcesses} · Concluídos: {s.concludedProcesses} ·{" "}
                <Text style={{ color: s.staleProcesses > 0 ? colors.wine : colors.textMuted }}>
                  Parados: {s.staleProcesses}
                </Text>
              </Text>
              <Text style={styles.meta}>
                {s.averageScore !== null ? `${s.averageScore.toFixed(1)} ★ (${s.responseCount})` : "Sem avaliações"}
              </Text>
            </FadeInView>
          ))}

          <Text style={styles.subsectionTitle}>Equipe com acesso ao painel interno</Text>
          {data.team.map((member, i) => (
            <FadeInView key={member.name} delay={i * 40} style={[styles.card, styles.teamRow]}>
              <View>
                <Text style={styles.rowTitle}>{member.name}</Text>
                <Text style={styles.meta}>{member.title}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: member.accessLevel === "executivo" ? "#f6e6c8" : colors.border }]}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: member.accessLevel === "executivo" ? "#7a5a13" : colors.textMuted }}>
                  {member.accessLevel === "executivo" ? "Acesso executivo" : "Acesso padrão"}
                </Text>
              </View>
            </FadeInView>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fog, padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2, marginBottom: 16 },
  subsectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 18, marginBottom: 8 },
  error: { color: colors.wine, marginBottom: 12 },
  meta: { color: colors.textMuted, fontSize: 12 },
  headerButton: { minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "flex-end" },
  headerButtonText: { color: colors.white, fontSize: 14 },
  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileLabel: { color: colors.textMuted, fontSize: 12 },
  tileValue: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    gap: 4,
  },
  barRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  barLabel: { color: colors.text, fontSize: 13 },
  barValue: { color: colors.text, fontWeight: "700", fontSize: 13 },
  rowTitle: { fontWeight: "700", color: colors.text, fontSize: 14 },
  teamRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
});
