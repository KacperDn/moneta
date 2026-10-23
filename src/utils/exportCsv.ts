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
 * Amounts use a dot as the decimal separator so they never collide with the column delimiter.
 */
export function expensesToCsv(expenses: Expense[]): string {
  const rows = expenses.map(e => [
    escapeCsvField(e.date),
    escapeCsvField(e.cat),
    escapeCsvField(e.description),
    parseFloat(String(e.amount)).toFixed(2),
  ].join(","));

  return [CSV_HEADER, ...rows].join("\n");
}
