"use client";

import type { LegalProcess } from "@portal/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "portal_token";
const ROLE_KEY = "portal_role";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getRole(): "cliente" | "escritorio" | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ROLE_KEY) as "cliente" | "escritorio" | null;
}

export function setRole(role: "cliente" | "escritorio") {
  window.localStorage.setItem(ROLE_KEY, role);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  setToken(data.token);
  setRole(data.role);
  return { role: data.role, client: data.client, staff: data.staff };
}

export function listProcesses() {
  return request<{ processes: LegalProcess[] }>("/processes");
}

export function getProcess(id: string) {
  return request<{ process: LegalProcess }>(`/processes/${id}`);
}

export interface AdminOverview {
  staleProcessesCount: number;
  rows: Array<{
    clientName: string;
    processNumber: string;
    lawyerName: string;
    lastAccessAt: string | null;
    status: string;
  }>;
  satisfaction: Array<{ lawyerName: string; averageScore: number; responseCount: number }>;
}

export function getAdminOverview() {
  return request<AdminOverview>("/admin/overview");
}
