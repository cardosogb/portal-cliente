"use client";

import type { LegalProcess } from "@portal/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "portal_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
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

export async function login(email: string, password: string) {
  const data = await request<{ token: string; client: { name: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.client;
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
