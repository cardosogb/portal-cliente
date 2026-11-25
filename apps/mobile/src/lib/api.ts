import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import type { LegalProcess } from "@portal/shared";

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:4000";
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
