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

/**
 * Membro do escritório com acesso ao painel interno.
 *
 * Não existe cadastro manual dentro do portal: assim que a pessoa existir
 * na fonte de dados do escritório (ADVBOX e/ou diretório de funcionários),
 * ela já consegue entrar, se identificando por CPF OU telefone + data de
 * nascimento — o mesmo padrão de login usado pelo cliente.
 */
export interface StaffUser {
  id: string;
  name: string;
  cpf: string;
  /** Também serve como login alternativo ao CPF. */
  phone: string;
  /** ISO (yyyy-mm-dd). O login usa apenas o dia e o mês (DDMM) como senha. */
  birthDate: string;
  email: string;
}

export interface TimelineEvent {
  id: string;
  date: string; // ISO date
  /** Título em linguagem simples, para o cliente leigo (uma frase curta). */
  plainText: string;
  /**
   * Explicação um pouco mais completa, em linguagem simples: o que
   * aconteceu, o que isso significa e o que vem a seguir. Mostrada junto
   * com o título, não só o texto jurídico original escondido atrás de um
   * clique — é o que evita o cliente ligar pro escritório perguntando
   * "o que isso quer dizer?".
   */
  explanation: string;
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
  /**
   * ISO da movimentação mais recente do processo, tirado direto do
   * ADVBOX — antes de qualquer filtro do que aparece pro cliente (ex.:
   * andamentos de RPV, escondidos em `timeline`). É o que o painel
   * interno usa para calcular "dias sem movimentação"; usar `timeline`
   * pra isso geraria um número errado, já que `timeline` pode não ter
   * o andamento mais recente do processo.
   */
  lastMovementAt: string;
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
