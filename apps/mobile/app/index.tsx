import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  InputAccessoryView,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { onlyDigits } from "@portal/shared";
import { login } from "@/lib/api";
import { colors } from "@/theme/colors";
import { Logo } from "@/components/Logo";
import { FadeInView } from "@/components/FadeInView";

// O teclado numérico do iOS não tem tecla de "concluído"/retorno — sem um
// jeito explícito de fechar, ele fica preso na tela e esconde o botão
// "Entrar". A barra abaixo (InputAccessoryView, só iOS) resolve isso; o
// toque fora dos campos (TouchableWithoutFeedback) cobre o Android também.
const KEYBOARD_ACCESSORY_ID = "login-keyboard-done";

export default function LoginScreen() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const data = await login(cpf, birthDate);
      router.replace(data.role === "escritorio" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      <FadeInView>
        <View style={{ marginBottom: 20, alignItems: "center" }}>
          <Logo height={56} variant="icon" />
        </View>
        <Text style={styles.title}>Portal do Cliente</Text>
        <Text style={styles.subtitle}>Acompanhe seu processo aqui, sem precisar ligar para o escritório.</Text>

        <Text style={styles.label}>CPF</Text>
        <TextInput
          style={styles.input}
          value={cpf}
          onChangeText={(text) => setCpf(onlyDigits(text).slice(0, 11))}
          keyboardType="numeric"
          placeholder="Só números, sem pontuação"
          maxLength={11}
          textContentType="username"
          autoComplete="username"
          returnKeyType="done"
          inputAccessoryViewID={Platform.OS === "ios" ? KEYBOARD_ACCESSORY_ID : undefined}
        />
        {cpf.length > 0 && (
          <Text
            style={cpf.length === 11 ? styles.fieldStatusOk : styles.fieldStatusPending}
            accessibilityLiveRegion="polite"
          >
            {cpf.length === 11 ? "✓ Número completo" : `Faltam ${11 - cpf.length} número(s)`}
          </Text>
        )}
        <Text style={styles.hintSmall}>
          Equipe do escritório: pode entrar com CPF ou telefone.
        </Text>

        <Text style={styles.label}>Data de nascimento (dia e mês)</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={(text) => setBirthDate(onlyDigits(text).slice(0, 4))}
          keyboardType="numeric"
          placeholder="DDMM"
          maxLength={4}
          textContentType="none"
          autoComplete="off"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          inputAccessoryViewID={Platform.OS === "ios" ? KEYBOARD_ACCESSORY_ID : undefined}
        />
        {birthDate.length > 0 && (
          <Text
            style={birthDate.length === 4 ? styles.fieldStatusOk : styles.fieldStatusPending}
            accessibilityLiveRegion="polite"
          >
            {birthDate.length === 4 ? "✓ Data completa" : `Faltam ${4 - birthDate.length} número(s)`}
          </Text>
        )}
        <Text style={styles.hintSmall}>
          Os 2 dígitos do dia seguidos dos 2 dígitos do mês em que você nasceu. Exemplo: 5 de
          março → 0503.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Entrando…" : "Entrar"}</Text>
        </Pressable>

        <Text style={styles.hint}>Demo: CPF 12345678909, nascimento 1204.</Text>
        <Link href="/ajuda" style={styles.helpLink}>
          Central de ajuda
        </Link>
      </FadeInView>
    </View>
    </TouchableWithoutFeedback>
    {Platform.OS === "ios" && (
      <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
        <View style={styles.accessoryBar}>
          <Pressable onPress={Keyboard.dismiss} hitSlop={8}>
            <Text style={styles.accessoryButtonText}>Concluído</Text>
          </Pressable>
        </View>
      </InputAccessoryView>
    )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink, padding: 24, justifyContent: "center" },
  title: { color: colors.white, fontSize: 28, fontWeight: "600", marginBottom: 6 },
  subtitle: { color: colors.fog2, fontSize: 13, marginBottom: 24 },
  label: { color: colors.fog2, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.white, borderRadius: 8, padding: 12, fontSize: 16 },
  hintSmall: { color: colors.fog2, fontSize: 11, marginTop: 6 },
  // colors.forest (verde escuro, pensado pra cards claros) quase some em
  // cima do fundo escuro da tela de login — aqui precisa de um tom claro.
  fieldStatusOk: { color: colors.brassLight, fontSize: 12, fontWeight: "600", marginTop: 4 },
  fieldStatusPending: { color: colors.fog2, fontSize: 12, marginTop: 4 },
  error: { color: "#f2a6a6", marginTop: 12 },
  button: {
    backgroundColor: colors.brass,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
    shadowColor: colors.brass,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  hint: { color: colors.fog2, fontSize: 12, marginTop: 16, textAlign: "center" },
  helpLink: { color: colors.brassLight, fontSize: 13, marginTop: 14, textAlign: "center" },
  accessoryBar: {
    backgroundColor: "#f2f2f2",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 10,
    alignItems: "flex-end",
  },
  accessoryButtonText: { color: colors.brass, fontWeight: "700", fontSize: 16, padding: 4 },
});
