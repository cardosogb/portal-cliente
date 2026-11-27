"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FaqItem } from "@/components/FaqItem";

export default function HelpPage() {
  return (
    <div>
      <nav className="top-nav">
        <Logo height={36} variant="icon" href="/" />
        <Link href="/dashboard" style={{ color: "var(--white)", textDecoration: "none", fontSize: "0.85rem" }}>
          ← Voltar
        </Link>
      </nav>
      <main className="container" style={{ maxWidth: 720 }}>
        <h1 className="serif" style={{ marginBottom: 4 }}>Central de ajuda</h1>
        <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Respostas rápidas pras dúvidas mais comuns sobre o portal. Toque numa pergunta pra ver a resposta.
        </p>

        <div className="stagger-fade">
        <FaqItem question="O que significa 'Em andamento'?">
          Significa que seu processo ainda está sendo analisado pela Justiça — ninguém tomou uma
          decisão final ainda. É a situação mais comum, e não quer dizer que algo deu errado.
        </FaqItem>

        <FaqItem question="O que significa 'Concluído'?">
          Significa que o processo já terminou — a Justiça já decidiu e não há mais nada pendente
          nessa ação.
        </FaqItem>

        <FaqItem question="O que é a 'Linha do tempo' do processo?">
          É a lista de tudo o que já aconteceu no seu processo, em ordem, com a data de cada
          acontecimento. Cada item já vem explicado em linguagem simples — e dá pra tocar em
          "Ver texto original do processo" se quiser ler o texto jurídico de verdade.
        </FaqItem>

        <FaqItem question="Como eu baixo um documento do meu processo?">
          Na página do seu processo, toque na aba "Documentos" e depois no documento que você
          quer — ele abre (ou baixa, dependendo do seu celular/computador) automaticamente.
        </FaqItem>

        <FaqItem question="Apareceu 'Ação necessária' no meu processo — o que eu faço?">
          Significa que o escritório precisa de alguma coisa sua (por exemplo, um documento) pra
          o processo continuar sem atraso. Toque no processo pra ver exatamente o que é pedido —
          nessas telas aparece um botão pra resolver isso diretamente pelo WhatsApp do escritório.
        </FaqItem>

        <FaqItem question="Esqueci minha senha de acesso, e agora?">
          Sua senha é sempre a sua data de nascimento (dia e mês, sem o ano) — por exemplo, 5 de
          março vira 0503. Não existe outra senha pra lembrar.
        </FaqItem>

        <FaqItem question="Posso usar o portal pelo celular?">
          Sim — o portal funciona direto no navegador do celular, sem precisar instalar nada.
        </FaqItem>

        <FaqItem question="Os dados do meu processo aqui são atualizados automaticamente?">
          Sim. Tudo que você vê vem direto do sistema do escritório — ninguém precisa digitar ou
          atualizar nada manualmente pra você ver as novidades do seu processo.
        </FaqItem>
        </div>
      </main>
    </div>
  );
}
