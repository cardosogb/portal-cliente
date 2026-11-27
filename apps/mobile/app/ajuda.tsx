import { ScrollView, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";
import { FaqItem } from "@/components/FaqItem";

export default function AjudaScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Central de ajuda</Text>
      <Text style={styles.subtitle}>
        Respostas rápidas pras dúvidas mais comuns sobre o portal. Toque numa pergunta pra ver a
        resposta.
      </Text>

      <FaqItem question="O que significa &quot;Em andamento&quot;?">
        Significa que seu processo ainda está sendo analisado pela Justiça — ninguém tomou uma
        decisão final ainda. É a situação mais comum, e não quer dizer que algo deu errado.
      </FaqItem>

      <FaqItem question="O que significa &quot;Concluído&quot;?">
        Significa que o processo já terminou — a Justiça já decidiu e não há mais nada pendente
        nessa ação.
      </FaqItem>

      <FaqItem question="O que é a &quot;Linha do tempo&quot; do processo?">
        É a lista de tudo o que já aconteceu no seu processo, em ordem, com a data de cada
        acontecimento. Cada item já vem explicado em linguagem simples — e dá pra tocar em "Ver
        texto original do processo" se quiser ler o texto jurídico de verdade.
      </FaqItem>

      <FaqItem question="Como eu baixo um documento do meu processo?">
        Na página do seu processo, toque na aba "Documentos" e depois no documento que você quer
        — ele abre (ou baixa) automaticamente.
      </FaqItem>

      <FaqItem question="Apareceu &quot;Ação necessária&quot; no meu processo — o que eu faço?">
        Significa que o escritório precisa de alguma coisa sua (por exemplo, um documento) pra o
        processo continuar sem atraso. Toque no processo pra ver exatamente o que é pedido —
        nessas telas aparece um botão pra resolver isso diretamente pelo WhatsApp do escritório.
      </FaqItem>

      <FaqItem question="Esqueci minha senha de acesso, e agora?">
        Sua senha é sempre a sua data de nascimento (dia e mês, sem o ano) — por exemplo, 5 de
        março vira 0503. Não existe outra senha pra lembrar.
      </FaqItem>

      <FaqItem question="Os dados do meu processo aqui são atualizados automaticamente?">
        Sim. Tudo que você vê vem direto do sistema do escritório — ninguém precisa digitar ou
        atualizar nada manualmente pra você ver as novidades do seu processo.
      </FaqItem>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fog },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 18 },
});
