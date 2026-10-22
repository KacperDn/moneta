import { describe, it, expect } from 'vitest';
import { expensesToCsv, CSV_HEADER } from './exportCsv';
import type { Expense } from '../types';

const createExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'exp-1',
  user_id: 'user-1',
  date: '2025-01-15',
  cat: 'Jedzenie',
  description: 'Obiad w restauracji',
  amount: 45.5,
  created_at: '2025-01-15T12:00:00Z',
  ...overrides,
});

describe('expensesToCsv', () => {
  it('returns only the column header when expenses list is empty', () => {
    expect(expensesToCsv([])).toBe(CSV_HEADER);
  });

  it('formats a single expense row with correct column values', () => {
    const expenses: Expense[] = [createExpense()];
    const result = expensesToCsv(expenses);

    expect(result).toBe(`${CSV_HEADER}\n2025-01-15,Jedzenie,Obiad w restauracji,45.50`);
  });

  it('formats amounts with a dot decimal separator and two decimals', () => {
    const expenses: Expense[] = [
      createExpense({ id: '1', amount: 10 }),
      createExpense({ id: '2', amount: 12.3 }),
      createExpense({ id: '3', amount: 99.99 }),
      createExpense({ id: '4', amount: 0 }),
    ];
    const result = expensesToCsv(expenses);
    const lines = result.split('\n');

    expect(lines[1]).toContain(',10.00');
    expect(lines[2]).toContain(',12.30');
    expect(lines[3]).toContain(',99.99');
    expect(lines[4]).toContain(',0.00');
  });

  it('quotes fields containing commas per RFC 4180', () => {
    const expenses: Expense[] = [
      createExpense({ description: 'Kawa, herbata i ciastko' }),
    ];
    const result = expensesToCsv(expenses);

    expect(result).toBe(`${CSV_HEADER}\n2025-01-15,Jedzenie,"Kawa, herbata i ciastko",45.50`);
  });

  it('quotes fields and escapes double quotes by doubling them per RFC 4180', () => {
    const expenses: Expense[] = [
      createExpense({ description: 'Książka "Czysty kod"' }),
    ];
    const result = expensesToCsv(expenses);

    expect(result).toBe(`${CSV_HEADER}\n2025-01-15,Jedzenie,"Książka ""Czysty kod""",45.50`);
  });

  it('handles fields with both commas and quotes', () => {
    const expenses: Expense[] = [
      createExpense({ description: 'Owoce: "jabłka, gruszki"' }),
    ];
    const result = expensesToCsv(expenses);

    expect(result).toBe(`${CSV_HEADER}\n2025-01-15,Jedzenie,"Owoce: ""jabłka, gruszki""",45.50`);
  });

  it('quotes fields containing newline characters', () => {
    const expenses: Expense[] = [
      createExpense({ description: 'Linia 1\nLinia 2' }),
    ];
    const result = expensesToCsv(expenses);

    expect(result).toBe(`${CSV_HEADER}\n2025-01-15,Jedzenie,"Linia 1\nLinia 2",45.50`);
  });

  it('serializes multiple expenses in order', () => {
    const expenses: Expense[] = [
      createExpense({ id: '1', date: '2025-01-01', amount: 20 }),
      createExpense({ id: '2', date: '2025-01-02', cat: 'Transport', amount: 5.5 }),
    ];
    const result = expensesToCsv(expenses);

    expect(result).toBe(
      `${CSV_HEADER}\n2025-01-01,Jedzenie,Obiad w restauracji,20.00\n2025-01-02,Transport,Obiad w restauracji,5.50`
    );
  });

  it('handles empty description without errors', () => {
    const expenses: Expense[] = [
      createExpense({ description: '' }),
    ];
    const result = expensesToCsv(expenses);

    expect(result).toBe(`${CSV_HEADER}\n2025-01-15,Jedzenie,,45.50`);
  });
});