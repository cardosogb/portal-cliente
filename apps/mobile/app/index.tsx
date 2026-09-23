import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { login } from "@/lib/api";
import { colors } from "@/theme/colors";
import { Logo } from "@/components/Logo";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("maria.souza@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
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
        <Logo size={48} variant="dark" />
      </View>
      <Text style={styles.title}>Portal do Cliente</Text>
      <Text style={styles.subtitle}>Acompanhe seu processo aqui, sem precisar ligar para o escritório.</Text>

      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Senha</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
      </Pressable>

      <Text style={styles.hint}>Demo: qualquer senha funciona para maria.souza@example.com</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink, padding: 24, justifyContent: "center" },
  title: { color: colors.white, fontSize: 28, fontWeight: "600", marginBottom: 6 },
  subtitle: { color: colors.fog2, fontSize: 13, marginBottom: 24 },
  label: { color: colors.fog2, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.white, borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: "#f2a6a6", marginTop: 12 },
  button: { backgroundColor: colors.brass, borderRadius: 8, padding: 14, alignItems: "center", marginTop: 24 },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  hint: { color: colors.fog2, fontSize: 12, marginTop: 16, textAlign: "center" },
});
