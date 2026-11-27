import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import type { LegalProcess } from "@portal/shared";

/**
 * No celular físico, "localhost" aponta pro próprio celular, não pro
 * computador rodando a API — por isso dá pra sobrescrever via variável
 * de ambiente (EXPO_PUBLIC_API_URL), que o Expo já injeta sozinho em
 * process.env no bundle, sem precisar mexer em app.json por máquina.
 */
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:4000";
const TOKEN_KEY = "portal_token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // Sem internet, wi-fi caiu etc. — sem isso, quem usa o app vê um erro
    // técnico em inglês sem entender nada.
    throw new Error("Não foi possível conectar. Verifique sua internet e tente novamente.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }
  return res.json();
}

export async function login(cpf: string, birthDate: string) {
  const data = await request<{ token: string; role: string; client?: { name: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ cpf, birthDate }),
  });
  await setToken(data.token);
  return data;
}

export function listProcesses() {
  return request<{ processes: LegalProcess[] }>("/processes");
}

export function getProcess(id: string) {
  return request<{ process: LegalProcess }>(`/processes/${id}`);
}

export async function logout(): Promise<void> {
  await request("/auth/logout", { method: "POST" }).catch(() => {
    // Mesmo se a chamada falhar (sem internet, por exemplo), o usuário
    // precisa conseguir sair do app localmente.
  });
  await clearToken();
}

export interface Session {
  role: "cliente" | "escritorio";
  clientId?: string;
  staffId?: string;
  staffAccessLevel?: "padrao" | "executivo";
}

export async function getSession(): Promise<Session | null> {
  try {
    return await request<Session>("/auth/me");
  } catch {
    return null;
  }
}

export interface AdminOverviewRow {
  clientName: string;
  processNumber: string;
  lawyerName: string;
  lastAccessAt: string | null;
  status: string;
  daysSinceLastMovement: number | null;
  isStale: boolean;
}

export interface AdminOverview {
  staleProcessesCount: number;
  staleDaysThreshold: number;
  rows: AdminOverviewRow[];
  satisfaction: Array<{ lawyerName: string; averageScore: number; responseCount: number }>;
}

export function getAdminOverview() {
  return request<AdminOverview>("/admin/overview");
}

export interface ExecutiveOverview {
  processTotals: {
    total: number;
    byStatus: Record<string, number>;
    byArea: Record<string, number>;
    staleCount: number;
    staleDaysThreshold: number;
  };
  staffPerformance: Array<{
    lawyerName: string;
    activeProcesses: number;
    concludedProcesses: number;
    staleProcesses: number;
    averageScore: number | null;
    responseCount: number;
  }>;
  team: Array<{ name: string; title: string; accessLevel: "padrao" | "executivo" }>;
}

export function getExecutiveOverview() {
  return request<ExecutiveOverview>("/admin/executive-overview");
}
