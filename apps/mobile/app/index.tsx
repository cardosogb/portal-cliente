import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { formatCpf, onlyDigits } from "@portal/shared";
import { login } from "@/lib/api";
import { colors } from "@/theme/colors";
import { Logo } from "@/components/Logo";

export default function LoginScreen() {
  const router = useRouter();
  const [cpf, setCpf] = useState("123.456.789-09");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const data = await login(cpf, birthDate);
      if (data.role === "escritorio") {
        setError("Esta conta é do escritório. O painel interno só está disponível no site.");
        return;
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 20 }}>
        <Logo height={56} variant="icon" />
      </View>
      <Text style={styles.title}>Portal do Cliente</Text>
      <Text style={styles.subtitle}>Acompanhe seu processo aqui, sem precisar ligar para o escritório.</Text>

      <Text style={styles.label}>CPF</Text>
      <TextInput
        style={styles.input}
        value={cpf}
        onChangeText={(text) => setCpf(formatCpf(text))}
        keyboardType="numeric"
        placeholder="000.000.000-00"
        maxLength={14}
      />

      <Text style={styles.label}>Data de nascimento (dia e mês)</Text>
      <TextInput
        style={styles.input}
        value={birthDate}
        onChangeText={(text) => setBirthDate(onlyDigits(text).slice(0, 4))}
        keyboardType="numeric"
        placeholder="DDMM"
        maxLength={4}
      />
      <Text style={styles.hintSmall}>
        Os 2 dígitos do dia seguidos dos 2 dígitos do mês em que você nasceu. Exemplo: 5 de
        março → 0503.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
      </Pressable>

      <Text style={styles.hint}>Demo: CPF 123.456.789-09, nascimento 1204.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink, padding: 24, justifyContent: "center" },
  title: { color: colors.white, fontSize: 28, fontWeight: "600", marginBottom: 6 },
  subtitle: { color: colors.fog2, fontSize: 13, marginBottom: 24 },
  label: { color: colors.fog2, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.white, borderRadius: 8, padding: 12, fontSize: 16 },
  hintSmall: { color: colors.fog2, fontSize: 11, marginTop: 6 },
  error: { color: "#f2a6a6", marginTop: 12 },
  button: { backgroundColor: colors.brass, borderRadius: 8, padding: 14, alignItems: "center", marginTop: 24 },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  hint: { color: colors.fog2, fontSize: 12, marginTop: 16, textAlign: "center" },
});
