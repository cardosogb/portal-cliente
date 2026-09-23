import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { LegalProcess, Message } from "@portal/shared";
import { formatBRL, formatDatePtBR, areaLabel, phaseExplanation } from "@portal/shared";
import { getProcess, listMessages, sendMessage } from "@/lib/api";
import { colors } from "@/theme/colors";

type Tab = "timeline" | "documentos" | "financeiro" | "mensagens";
const TABS: Array<[Tab, string]> = [
  ["timeline", "Linha do tempo"],
  ["documentos", "Documentos"],
  ["financeiro", "Financeiro"],
  ["mensagens", "Mensagens"],
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
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.meta}>
        {areaLabel(process.area)} · {process.court}
      </Text>
      <Text style={styles.title}>Processo nº {process.number}</Text>
      <Text style={styles.mutedSmall}>
        Fase atual: {process.currentPhase} — {phaseExplanation(process.currentPhase)}
      </Text>

      <View style={styles.actionCard}>
        <Text style={{ color: process.nextAction.type === "acao" ? colors.wine : colors.forest, fontWeight: "600" }}>
          {process.nextAction.text}
        </Text>
        <Text style={styles.mutedSmall}>{process.forecast}</Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tabButton, tab === key && styles.tabButtonActive]}
            onPress={() => setTab(key)}
          >
            <Text style={{ color: tab === key ? colors.white : colors.text }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "timeline" &&
        process.timeline.map((event) => (
          <View key={event.id} style={styles.card}>
            <Text style={styles.mutedSmall}>{formatDatePtBR(event.date)}</Text>
            <Text style={{ marginVertical: 6 }}>{event.plainText}</Text>
            <Pressable onPress={() => setExpanded((s) => ({ ...s, [event.id]: !s[event.id] }))}>
              <Text style={styles.link}>
                {expanded[event.id] ? "Ocultar texto original" : "Ver texto original do processo"}
              </Text>
            </Pressable>
            {expanded[event.id] && <Text style={styles.original}>{event.originalText}</Text>}
          </View>
        ))}

      {tab === "documentos" &&
        process.documents.map((doc) => (
          <View key={doc.id} style={[styles.card, { flexDirection: "row", justifyContent: "space-between" }]}>
            <Text>{doc.title}</Text>
            <Text style={styles.mutedSmall}>
              {formatDatePtBR(doc.uploadedAt)} · {doc.sizeKb} KB
            </Text>
          </View>
        ))}

      {tab === "financeiro" &&
        process.financial.map((f) => (
          <View key={f.id} style={[styles.card, { flexDirection: "row", justifyContent: "space-between" }]}>
            <View>
              <Text>{f.description}</Text>
              <Text style={styles.mutedSmall}>Vencimento: {formatDatePtBR(f.dueDate)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontWeight: "600" }}>{formatBRL(f.amountCents)}</Text>
              <Text style={styles.mutedSmall}>{f.status}</Text>
            </View>
          </View>
        ))}

      {tab === "mensagens" && <MessagesPanel processId={process.id} />}
    </ScrollView>
  );
}

function MessagesPanel({ processId }: { processId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    listMessages(processId).then((data) => setMessages(data.messages));
  }, [processId]);

  async function handleSend() {
    if (!text.trim()) return;
    const { message } = await sendMessage(processId, text);
    setMessages((m) => [...m, message]);
    setText("");
  }

  return (
    <View>
      {messages.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.mutedSmall}>{m.authorName}</Text>
          <Text>{m.text}</Text>
        </View>
      ))}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={text}
          onChangeText={setText}
          placeholder="Escreva uma mensagem..."
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={{ color: colors.white, fontWeight: "600" }}>Enviar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fog, padding: 16 },
  meta: { color: colors.textMuted, fontSize: 12 },
  title: { fontSize: 20, fontWeight: "700", marginVertical: 6 },
  mutedSmall: { color: colors.textMuted, fontSize: 12 },
  actionCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginVertical: 12, gap: 6 },
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tabButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  tabButtonActive: { backgroundColor: colors.brass, borderColor: colors.brass },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  link: { color: colors.brass, fontSize: 13, fontWeight: "600" },
  original: { marginTop: 8, fontStyle: "italic", color: colors.textMuted, fontSize: 13 },
  input: { backgroundColor: colors.white, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.border },
  sendButton: { backgroundColor: colors.brass, borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
});
