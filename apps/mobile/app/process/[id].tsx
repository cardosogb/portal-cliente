import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import type { LegalProcess } from "@portal/shared";
import {
  formatDatePtBR,
  areaLabel,
  phaseExplanation,
  whatsappLink,
  pendingActionWhatsappMessage,
} from "@portal/shared";
import { getProcess } from "@/lib/api";
import { colors } from "@/theme/colors";
import { FadeInView } from "@/components/FadeInView";

type Tab = "timeline" | "documentos";
const TABS: Array<[Tab, string]> = [
  ["timeline", "Linha do tempo"],
  ["documentos", "Documentos"],
];

export default function ProcessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [process, setProcess] = useState<LegalProcess | null>(null);
  const [tab, setTab] = useState<Tab>("timeline");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) getProcess(id).then((data) => setProcess(data.process));
  }, [id]);

  if (!process) {
    return (
      <View style={styles.container}>
        <Text>Carregando…</Text>
      </View>
    );
  }

  const needsAction = process.nextAction.type === "acao";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.meta}>
        {areaLabel(process.area)} · {process.court}
      </Text>
      <Text style={styles.title}>Processo nº {process.number}</Text>
      {process.startedAt && (
        <Text style={styles.mutedSmall}>Entrou na Justiça em: {formatDatePtBR(process.startedAt)}</Text>
      )}
      <Text style={styles.mutedSmall}>
        Fase atual: {process.currentPhase} — {phaseExplanation(process.currentPhase)}
      </Text>

      <FadeInView style={styles.actionCard}>
        <Text style={{ color: needsAction ? colors.wine : colors.forest, fontWeight: "600" }}>
          {process.nextAction.text}
        </Text>
        <Text style={styles.mutedSmall}>{process.forecast}</Text>
        {needsAction && (
          <Pressable
            style={({ pressed }) => [styles.whatsappButton, pressed && styles.whatsappButtonPressed]}
            onPress={() =>
              Linking.openURL(whatsappLink(pendingActionWhatsappMessage(process.number, process.nextAction.text)))
            }
          >
            <Text style={styles.whatsappButtonText}>Enviar pelo WhatsApp do escritório</Text>
          </Pressable>
        )}
      </FadeInView>

      <View style={styles.tabRow}>
        {TABS.map(([key, label]) => (
          <Pressable
            key={key}
            style={({ pressed }) => [styles.tabButton, tab === key && styles.tabButtonActive, pressed && { opacity: 0.8 }]}
            onPress={() => setTab(key)}
          >
            <Text style={{ color: tab === key ? colors.white : colors.text }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <FadeInView key={tab}>
        {tab === "timeline" &&
          process.timeline.map((event, i) => (
            <FadeInView key={event.id} delay={i * 50} style={styles.card}>
              <Text style={styles.mutedSmall}>{formatDatePtBR(event.date)}</Text>
              <Text style={styles.tlPlain}>{event.plainText}</Text>
              <Text style={styles.tlExplanation}>{event.explanation}</Text>
              <Pressable
                onPress={() => setExpanded((s) => ({ ...s, [event.id]: !s[event.id] }))}
                style={styles.linkTouchArea}
                hitSlop={8}
              >
                <Text style={styles.link}>
                  {expanded[event.id] ? "Ocultar texto original" : "Ver texto original do processo"}
                </Text>
              </Pressable>
              {expanded[event.id] && <Text style={styles.original}>{event.originalText}</Text>}
            </FadeInView>
          ))}

        {tab === "documentos" &&
          process.documents.map((doc, i) => (
            <FadeInView key={doc.id} delay={i * 50} style={[styles.card, { flexDirection: "row", justifyContent: "space-between" }]}>
              <Text>{doc.title}</Text>
              <Text style={styles.mutedSmall}>
                {formatDatePtBR(doc.uploadedAt)} · {doc.sizeKb} KB
              </Text>
            </FadeInView>
          ))}
      </FadeInView>

      <Link href="/ajuda" style={styles.helpLink}>
        Dúvidas sobre o que você está vendo aqui?
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fog, padding: 16 },
  meta: { color: colors.textMuted, fontSize: 12 },
  title: { fontSize: 20, fontWeight: "700", marginVertical: 6 },
  mutedSmall: { color: colors.textMuted, fontSize: 12 },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 12,
    gap: 6,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  whatsappButton: {
    backgroundColor: "#25d366",
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#25d366",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsappButtonPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  whatsappButtonText: { color: "#fff", fontWeight: "600", fontSize: 13.5 },
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tabButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  tabButtonActive: { backgroundColor: colors.brass, borderColor: colors.brass },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  link: { color: colors.brass, fontSize: 13, fontWeight: "600" },
  linkTouchArea: { minHeight: 44, justifyContent: "center" },
  helpLink: { color: colors.textMuted, fontSize: 13, textAlign: "center", marginTop: 16 },
  original: { marginTop: 8, fontStyle: "italic", color: colors.textMuted, fontSize: 13 },
  tlPlain: { marginTop: 6, marginBottom: 4, fontWeight: "600" },
  tlExplanation: { marginBottom: 10, fontSize: 13.5, color: colors.textMuted },
});
