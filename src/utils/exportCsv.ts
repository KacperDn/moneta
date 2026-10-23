import type { Expense } from "../types";

export const CSV_HEADER = "Data,Kategoria,Opis,Kwota";

/**
 * Escapes a field according to RFC 4180 rules: fields containing commas,
 * double quotes, or newlines must be wrapped in quotes, with internal quotes doubled.
 */
function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Serializes a list of expenses into a CSV string without performing any I/O.
 * Decimal values use dot separators to prevent column delimiter collisions.
 */
export function expensesToCsv(expenses: Expense[]): string {
  const rows = expenses.map((expense) => {
    const date = escapeCsvField(expense.date ?? "");
    const category = escapeCsvField(expense.cat ?? "");
    const description = escapeCsvField(expense.description ?? "");
    const amount = typeof expense.amount === "number" && Number.isFinite(expense.amount)
      ? expense.amount.toFixed(2)
      : escapeCsvField(String(expense.amount ?? ""));

    return `${date},${category},${description},${amount}`;
  });

  return [CSV_HEADER, ...rows].join("\n");
}
