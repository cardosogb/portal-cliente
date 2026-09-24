import type { Client, LegalProcess, SatisfactionSurveyResult } from "./types";

export const mockClients: Client[] = [
  {
    id: "cli_maria",
    name: "Maria Souza",
    email: "maria.souza@example.com",
    phone: "+55 11 91234-5678",
    lastAccessAt: "2026-09-20T14:32:00-03:00",
  },
  {
    id: "cli_joao",
    name: "João Pereira",
    email: "joao.pereira@example.com",
    phone: "+55 11 99876-5432",
    lastAccessAt: "2026-08-11T09:10:00-03:00",
  },
];

export const mockProcesses: LegalProcess[] = [
  {
    id: "proc_trabalhista_1",
    clientId: "cli_maria",
    number: "0001234-56.2026.5.02.0001",
    area: "trabalhista",
    court: "1ª Vara do Trabalho",
    status: "em_andamento",
    currentPhase: "Instrução",
    startedAt: "2026-07-30",
    lawyerName: "Dra. Fernanda Lima",
    nextAction: {
      type: "acao",
      text: "Envie o comprovante de endereço atualizado até 30/09 para o processo seguir sem atrasos.",
      dueDate: "2026-09-30",
    },
    forecast:
      "Processos como este costumam levar entre 10 e 16 meses até a sentença. Seu processo está no mês 2.",
    timeline: [
      {
        id: "tl_1",
        date: "2026-09-05",
        plainText: "Seu advogado enviou um documento importante ao processo.",
        originalText:
          "Juntada de petição intercorrente com manifestação sobre os documentos apresentados pela parte reclamada.",
      },
      {
        id: "tl_2",
        date: "2026-08-22",
        plainText: "A empresa (parte contrária) respondeu ao processo.",
        originalText:
          "Juntada de contestação apresentada pela reclamada, com preliminares e mérito.",
      },
      {
        id: "tl_3",
        date: "2026-07-30",
        plainText: "O processo foi formalmente aberto na Justiça do Trabalho.",
        originalText:
          "Distribuição da reclamação trabalhista à 1ª Vara do Trabalho.",
      },
    ],
    documents: [
      {
        id: "doc_1",
        title: "Petição inicial",
        category: "peticao",
        uploadedAt: "2026-07-30",
        url: "/documents/proc_trabalhista_1/peticao-inicial.pdf",
        sizeKb: 412,
      },
      {
        id: "doc_2",
        title: "Contestação da parte contrária",
        category: "outro",
        uploadedAt: "2026-08-22",
        url: "/documents/proc_trabalhista_1/contestacao.pdf",
        sizeKb: 289,
      },
    ],
    financial: [
      {
        id: "fin_1",
        description: "Honorários - parcela 1/6",
        dueDate: "2026-08-05",
        amountCents: 120000,
        status: "pago",
        paidAt: "2026-08-04",
      },
      {
        id: "fin_2",
        description: "Honorários - parcela 2/6",
        dueDate: "2026-09-05",
        amountCents: 120000,
        status: "pendente",
      },
    ],
  },
  {
    id: "proc_previdenciario_1",
    clientId: "cli_maria",
    number: "0007890-12.2026.4.03.0002",
    area: "previdenciario",
    court: "3ª Vara Federal",
    status: "concluido",
    currentPhase: "Sentença",
    startedAt: "2026-03-02",
    concludedAt: "2026-09-01",
    lawyerName: "Dr. Ricardo Alves",
    nextAction: {
      type: "ok",
      text: "Nenhuma ação necessária. Seu processo foi encerrado com sucesso.",
    },
    forecast:
      "Este processo foi concluído em 6 meses, dentro da média para casos semelhantes.",
    timeline: [
      {
        id: "tl_4",
        date: "2026-06-14",
        plainText: "O INSS apresentou sua defesa no processo.",
        originalText: "Juntada de contestação apresentada pelo INSS.",
      },
      {
        id: "tl_5",
        date: "2026-03-02",
        plainText: "O processo foi formalmente aberto na Justiça Federal.",
        originalText: "Distribuição da ação previdenciária à 3ª Vara Federal.",
      },
    ],
    documents: [
      {
        id: "doc_3",
        title: "Sentença",
        category: "decisao",
        uploadedAt: "2026-09-01",
        url: "/documents/proc_previdenciario_1/sentenca.pdf",
        sizeKb: 198,
      },
    ],
    financial: [
      {
        id: "fin_3",
        description: "Honorários - parcela única",
        dueDate: "2026-03-10",
        amountCents: 250000,
        status: "pago",
        paidAt: "2026-03-09",
      },
    ],
  },
];

export const mockSatisfaction: SatisfactionSurveyResult[] = [
  { lawyerName: "Dra. Fernanda Lima", averageScore: 4.7, responseCount: 32 },
  { lawyerName: "Dr. Ricardo Alves", averageScore: 4.9, responseCount: 21 },
];
