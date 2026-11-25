import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

export function FaqItem({ question, children }: { question: string; children: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.item}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.questionRow}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.question}>{question}</Text>
        <Text style={styles.chevron}>{open ? "▲" : "▼"}</Text>
      </Pressable>
      {open && <Text style={styles.answer}>{children}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 44,
    gap: 12,
  },
  question: { flex: 1, fontWeight: "600", fontSize: 15, color: colors.text },
  chevron: { color: colors.brass, fontSize: 12 },
  answer: { paddingHorizontal: 16, paddingBottom: 16, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
