import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Privacidade — Portal do Cliente",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 className="serif" style={{ fontSize: "1.15rem", marginBottom: 8 }}>
        {title}
      </h2>
      <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div>
      <nav className="top-nav">
        <Logo height={36} variant="icon" href="/" />
        <Link href="/" style={{ color: "var(--white)", textDecoration: "none", fontSize: "0.85rem" }}>
          ← Voltar
        </Link>
      </nav>
      <main className="container" style={{ maxWidth: 720 }}>
        <h1 className="serif" style={{ marginBottom: 4 }}>Como cuidamos dos seus dados</h1>
        <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Explicação em linguagem simples de quais dados o Portal do Cliente guarda, para
          que servem e como você pode pedir para acessá-los, corrigi-los ou apagá-los.
        </p>

        <Section title="Quais dados guardamos">
          <p>
            Para você conseguir entrar no portal e acompanhar seu processo, guardamos: seu
            nome, CPF, telefone, e-mail, data de nascimento (usada como parte da senha de
            acesso) e os dados do seu processo (andamentos, documentos e valores
            financeiros) que vêm do sistema do escritório.
          </p>
        </Section>

        <Section title="Para que usamos esses dados">
          <p>
            Só para prestar o serviço advocatício e te dar acesso ao andamento do seu
            processo sem você precisar ligar toda hora para o escritório — nada de venda
            de dados, nem uso para outra finalidade sem te avisar antes.
          </p>
        </Section>

        <Section title="Como protegemos seus dados">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>A senha de acesso fica guardada de forma que ninguém no escritório consegue ver — só você sabe.</li>
            <li>O acesso ao portal usa conexão protegida e um token de sessão que a página não consegue ler diretamente (protege contra alguns tipos de ataque comuns na internet).</li>
            <li>Tentativas repetidas de adivinhar a senha de uma conta são bloqueadas automaticamente por um tempo.</li>
            <li>Só quem trabalha no escritório e precisa consultar processos tem acesso ao painel interno, e cada acesso fica registrado — para sabermos sempre quem viu o quê.</li>
            <li>O painel interno é só para consulta: ninguém altera os dados do seu processo por ali. Toda informação vem direto do sistema de gestão do escritório.</li>
          </ul>
        </Section>

        <Section title="Por quanto tempo guardamos">
          <p>
            Enquanto durar o seu contrato com o escritório e, depois disso, pelo tempo que a
            lei exigir guardar registros desse tipo de processo. Depois desse prazo, os
            dados são apagados.
          </p>
        </Section>

        <Section title="Seus direitos">
          <p>
            A qualquer momento você pode pedir para ver quais dados temos sobre você,
            corrigir alguma informação errada ou solicitar a exclusão dos seus dados
            (respeitando prazos que a lei exige manter). É só chamar o escritório pelo
            WhatsApp ou e-mail de contato.
          </p>
        </Section>

        <p
          style={{
            marginTop: 32,
            padding: 14,
            border: "1px solid #e8c78a",
            background: "#fbf3e4",
            borderRadius: 8,
            fontSize: "0.82rem",
            color: "var(--ink)",
          }}
        >
          ⚠️ Este texto é um rascunho-base, escrito para deixar a política de privacidade
          pronta desde já, em linguagem simples. Antes de publicar o portal para clientes de
          verdade, ele precisa ser revisado por um advogado responsável (o próprio
          escritório), para conferir se está de acordo com a LGPD e com a realidade do
          escritório.
        </p>
      </main>
    </div>
  );
}
