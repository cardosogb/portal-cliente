export type ProcessStatus = "em_andamento" | "concluido" | "suspenso";

export type ProcessArea =
  | "trabalhista"
  | "previdenciario"
  | "civel"
  | "familia"
  | "outro";

export interface Client {
  id: string;
  name: string;
  cpf: string;
  /** ISO (yyyy-mm-dd). O login usa apenas o dia e o mês (DDMM) como senha. */
  birthDate: string;
  email: string;
  phone: string;
  lastAccessAt: string | null;
}

/** Membro do escritório com acesso ao painel interno. */
export interface StaffUser {
  id: string;
  name: string;
  cpf: string;
  /** ISO (yyyy-mm-dd). O login usa apenas o dia e o mês (DDMM) como senha. */
  birthDate: string;
  email: string;
}

export interface TimelineEvent {
  id: string;
  date: string; // ISO date
  /** Texto em linguagem simples, para o cliente leigo. */
  plainText: string;
  /** Texto jurídico original, como consta no processo. */
  originalText: string;
  /** Se este evento representa uma ação que o cliente precisa tomar. */
  requiresAction?: boolean;
}

export interface NextAction {
  type: "acao" | "ok" | "aviso";
  text: string;
  dueDate?: string;
}

export interface ProcessDocument {
  id: string;
  title: string;
  category: "peticao" | "decisao" | "comprovante" | "contrato" | "outro";
  uploadedAt: string;
  url: string;
  sizeKb: number;
}

export interface FinancialInstallment {
  id: string;
  description: string;
  dueDate: string;
  amountCents: number;
  status: "pago" | "pendente" | "atrasado";
  paidAt?: string;
}

export interface LegalProcess {
  id: string;
  clientId: string;
  number: string;
  area: ProcessArea;
  court: string;
  status: ProcessStatus;
  currentPhase: string;
  startedAt: string;
  concludedAt?: string;
  lawyerName: string;
  nextAction: NextAction;
  forecast: string;
  timeline: TimelineEvent[];
  documents: ProcessDocument[];
  financial: FinancialInstallment[];
}

export interface SatisfactionSurveyResult {
  lawyerName: string;
  averageScore: number; // 0-5
  responseCount: number;
}

export interface NotificationTemplate {
  id: string;
  channel: "whatsapp";
  kind: "movimentacao" | "acao_pendente" | "relacionamento" | "pesquisa_satisfacao";
  text: string;
}

export interface AuthSession {
  token: string;
  role: "cliente" | "escritorio";
  clientId?: string;
  staffId?: string;
}
