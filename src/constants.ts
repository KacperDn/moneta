import { Category } from "./types";

export const CATS: Category[] = [
  { name: "Jedzenie",  icon: "🥑", color: "#f97316" },
  { name: "Transport", icon: "🚇", color: "#3b82f6" },
  { name: "Rozrywka",  icon: "🎬", color: "#a855f7" },
  { name: "Rachunki",  icon: "🏠", color: "#ef4444" },
  { name: "Zdrowie",   icon: "💊", color: "#10b981" },
  { name: "Ubrania",   icon: "👟", color: "#ec4899" },
  { name: "Edukacja",  icon: "📖", color: "#f59e0b" },
  { name: "Inne",      icon: "📦", color: "#6b7280" },
];

export const fmt = (n: number): string =>
  n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const getCat = (name: string): Category =>
  CATS.find(c => c.name === name) ?? CATS[CATS.length - 1];