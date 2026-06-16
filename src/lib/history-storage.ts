// Local-only history storage for risk analyses and investment calculations.

import type { DealRiskResult } from "@/lib/ai.functions";

const KEY = "aep_history_v1";

export type RiskHistoryItem = {
  id: string;
  kind: "risk";
  createdAt: number;
  location: string;
  price_eur: number;
  construction_type: string;
  document_status: string;
  notes: string;
  result: DealRiskResult;
};

export type CalcInputs = {
  price: number;
  down: number;
  rate: number;
  years: number;
  rent: number;
  expenses: number;
};

export type CalcResults = {
  monthlyPayment: number;
  cashFlow: number;
  grossYield: number;
  roi: number;
};

export type CalcHistoryItem = {
  id: string;
  kind: "calc";
  createdAt: number;
  location: string;
  inputs: CalcInputs;
  results: CalcResults;
};

export type HistoryItem = RiskHistoryItem | CalcHistoryItem;

function read(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function listHistory(): HistoryItem[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getHistoryItem(id: string): HistoryItem | undefined {
  return read().find((i) => i.id === id);
}

export function addHistory(item: Omit<HistoryItem, "id" | "createdAt"> & { id?: string; createdAt?: number }): HistoryItem {
  const all = read();
  const full: HistoryItem = {
    ...(item as HistoryItem),
    id: item.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
    createdAt: item.createdAt ?? Date.now(),
  };
  all.push(full);
  write(all);
  return full;
}

export function removeHistory(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function clearHistory() {
  write([]);
}

export function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date(ts).toISOString();
  }
}
