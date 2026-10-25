/** Money is summed in integer cents so repeated additions never drift (0.1 + 0.2). */
export function toCents(value: number | string): number {
  return Math.round(parseFloat(String(value)) * 100) || 0;
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function sumAmounts(values: Array<number | string>): number {
  return fromCents(values.reduce<number>((total, v) => total + toCents(v), 0));
}
