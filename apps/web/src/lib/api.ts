"use client";

import type { LegalProcess } from "@portal/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * A sessão vive num cookie httpOnly, setado pela própria API no login —
 * o JavaScript da página nunca chega a ler o token (diferente de guardar
 * em `localStorage`, que qualquer script injetado por um XSS conseguiria
 * ler). Por isso `credentials: "include"` em toda chamada, e nenhuma
 * leitura/escrita de token aqui.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }
  return res.json();
}

export interface LoginResult {
  role: "cliente" | "escritorio";
  client?: { id: string; name: string };
  staff?: { id: string; name: string };
}

export async function login(cpf: string, birthDate: string): Promise<LoginResult> {
  const data = await request<{ token: string } & LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ cpf, birthDate }),
  });
  return { role: data.role, client: data.client, staff: data.staff };
}

export async function logout(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
}

export interface Session {
  role: "cliente" | "escritorio";
  clientId?: string;
  staffId?: string;
}

/**
 * Como o token não fica acessível via JS, cada tela pergunta pra API
 * quem está logado (o cookie vai junto sozinho). Retorna `null` se não
 * houver sessão válida — em vez de lançar erro, pra facilitar o uso em
 * um `useEffect` de guarda de rota.
 */
export async function getSession(): Promise<Session | null> {
  try {
    return await request<Session>("/auth/me");
  } catch {
    return null;
  }
}

export function listProcesses() {
  return request<{ processes: LegalProcess[] }>("/processes");
}

export function getProcess(id: string) {
  return request<{ process: LegalProcess }>(`/processes/${id}`);
}

export interface AdminOverview {
  staleProcessesCount: number;
  staleDaysThreshold: number;
  rows: Array<{
    clientName: string;
    processNumber: string;
    lawyerName: string;
    lastAccessAt: string | null;
    status: string;
    daysSinceLastMovement: number | null;
    isStale: boolean;
  }>;
  satisfaction: Array<{ lawyerName: string; averageScore: number; responseCount: number }>;
}

export function getAdminOverview() {
  return request<AdminOverview>("/admin/overview");
}

export interface AuditEntry {
  staffId: string;
  staffName: string;
  action: string;
  ip: string;
  at: string;
}

export function getAuditLog() {
  return request<{ entries: AuditEntry[] }>("/admin/audit-log");
}
