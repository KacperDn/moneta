import { Category } from "./types";

export const CATS: Category[] = [
  { name: "Jedzenie",  icon: "Utensils",     color: "#f97316" },
  { name: "Transport", icon: "TrainFront",   color: "#3b82f6" },
  { name: "Rozrywka",  icon: "Clapperboard", color: "#a855f7" },
  { name: "Rachunki",  icon: "House",        color: "#ef4444" },
  { name: "Zdrowie",   icon: "Pill",         color: "#10b981" },
  { name: "Ubrania",   icon: "Shirt",        color: "#ec4899" },
  { name: "Edukacja",  icon: "BookOpen",     color: "#f59e0b" },
  { name: "Inne",      icon: "Package",      color: "#6b7280" },
];

export const fmt = (n: number): string =>
  n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const getCat = (name: string): Category =>
  CATS.find(c => c.name === name) ?? CATS[CATS.length - 1];