const MAX_LENGTH = 10;

/** Keeps digits and one dot (a comma is accepted as the decimal separator), at most two decimals. */
export function sanitizeAmount(raw: string): string {
  const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  const decimals = rest.join("").slice(0, 2);
  const result = rest.length > 0 ? `${whole}.${decimals}` : whole;
  return result.slice(0, MAX_LENGTH);
}

/** Formats a stepped amount: never negative, rounded to cents, no trailing zeros. */
export function formatAmount(n: number): string {
  return String(Math.round(Math.max(0, n) * 100) / 100);
}
