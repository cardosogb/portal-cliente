import { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from "react-native";
import { useRouter, Stack, Link } from "expo-router";
import { statusLabel } from "@portal/shared";
import {
  getToken,
  getSession,
  getAdminOverview,
  logout,
  type AdminOverview,
  type AdminOverviewRow,
  type Session,
} from "@/lib/api";
import { colors } from "@/theme/colors";
import { Logo } from "@/components/Logo";
import { FadeInView } from "@/components/FadeInView";

const PAGE_SIZE = 100;

function daysSinceLabel(days: number | null): string {
  if (days === null) return "sem movimentação registrada";
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export default function AdminScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/");
        return;
      }
      const s = await getSession();
      if (!s) {
        router.replace("/");
        return;
      }
      if (s.role !== "escritorio") {
        router.replace("/dashboard");
        return;
      }
      setSession(s);
      try {
        const overview = await getAdminOverview();
        setData(overview);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar.");
      }
    })();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!data) return null;
    return data.rows.filter(
      (r) =>
        !normalizedSearch ||
        r.clientName.toLowerCase().includes(normalizedSearch) ||
        r.processNumber.toLowerCase().includes(normalizedSearch)
    );
  }, [data, normalizedSearch]);

  const totalPages = Math.max(1, Math.ceil((filteredRows?.length ?? 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
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
        <Text style={styles.sectionTitle}>Painel interno</Text>
        {session?.staffAccessLevel === "executivo" && (
          <Link href="/admin/executivo" style={styles.execLink}>
            Dashboard executivo →
          </Link>
        )}
      </View>
      <Text style={styles.subtitle}>Visão da equipe do escritório — não é o que o cliente vê.</Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {!data && !error && <Text style={styles.loading}>Carregando… (primeira sincronização pode demorar um pouco)</Text>}

      {data && (
        <>
          <View style={[styles.card, styles.staleCard]}>
            <Text style={styles.staleLabel}>Processos sem movimentação há mais de {data.staleDaysThreshold} dias</Text>
            <Text style={styles.staleNumber}>{data.staleProcessesCount}</Text>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por cliente ou número do processo..."
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          <Text style={styles.meta}>
            Mostrando {pagedRows && pagedRows.length > 0 ? (safePage - 1) * PAGE_SIZE + 1 : 0}–
            {Math.min(safePage * PAGE_SIZE, filteredRows?.length ?? 0)} de {filteredRows?.length ?? 0} processos
          </Text>

          <FlatList
            data={pagedRows ?? []}
            keyExtractor={(r, i) => r.processNumber + i}
            contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
            renderItem={({ item, index }) => <RowCard row={item} delay={index * 30} />}
            ListEmptyComponent={<Text style={styles.meta}>Nenhum cliente ou processo encontrado.</Text>}
          />

          {totalPages > 1 && (
            <View style={styles.paginationRow}>
              <Pressable
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={[styles.pageButton, safePage <= 1 && styles.pageButtonDisabled]}
              >
                <Text style={styles.pageButtonText}>← Anterior</Text>
              </Pressable>
              <Text style={styles.meta}>
                Página {safePage} de {totalPages}
              </Text>
              <Pressable
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                style={[styles.pageButton, safePage >= totalPages && styles.pageButtonDisabled]}
              >
                <Text style={styles.pageButtonText}>Próxima →</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function RowCard({ row, delay }: { row: AdminOverviewRow; delay: number }) {
  return (
    <FadeInView delay={delay} style={styles.card}>
      <Text style={styles.rowClient}>{row.clientName}</Text>
      <Text style={styles.meta}>{row.processNumber}</Text>
      <Text style={styles.meta}>{row.lawyerName}</Text>
      <View style={styles.rowFooter}>
        <Text style={row.isStale ? styles.staleText : styles.meta}>
          {row.isStale ? "⚠ " : ""}
          {daysSinceLabel(row.daysSinceLastMovement)}
        </Text>
        <View
          style={[
            styles.pill,
            { backgroundColor: row.status === "concluido" ? "#dcecdf" : row.status === "suspenso" ? colors.border : "#f6e6c8" },
          ]}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: row.status === "concluido" ? colors.forest : row.status === "suspenso" ? colors.textMuted : "#7a5a13",
            }}
          >
            {statusLabel(row.status)}
          </Text>
        </View>
      </View>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fog, padding: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2, marginBottom: 12 },
  execLink: { color: colors.brass, fontSize: 13, fontWeight: "700" },
  headerButton: { minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "flex-end" },
  headerButtonText: { color: colors.white, fontSize: 14 },
  error: { color: colors.wine, marginBottom: 12 },
  loading: { color: colors.textMuted },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  staleCard: { marginBottom: 14, borderColor: "#e8c78a", backgroundColor: "#fbf3e4" },
  staleLabel: { color: colors.textMuted, fontSize: 12 },
  staleNumber: { color: colors.wine, fontSize: 28, fontWeight: "700", marginTop: 2 },
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  meta: { color: colors.textMuted, fontSize: 12, marginBottom: 8 },
  rowClient: { fontWeight: "700", color: colors.text, fontSize: 15 },
  rowFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  staleText: { color: colors.wine, fontWeight: "700", fontSize: 12 },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  paginationRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 10 },
  pageButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: colors.text, fontSize: 13 },
});
