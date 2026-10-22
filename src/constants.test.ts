import { describe, it, expect } from "vitest";
import { fmt, getCat, CATS } from "./constants";

describe("fmt", () => {
  it("formats with 2 decimals using Polish locale separators", () => {
    expect(fmt(1234.5)).toBe("1234,50");
  });

  it("rounds to 2 decimals", () => {
    expect(fmt(10.005)).toBe("10,01");
  });

  it("formats zero and negative amounts", () => {
    expect(fmt(0)).toBe("0,00");
    expect(fmt(-42)).toBe("-42,00");
  });
});

describe("getCat", () => {
  it("returns the matching category by exact name", () => {
    expect(getCat("Transport").icon).toBe("TrainFront");
  });

  it("falls back to the last category (Inne) for an unknown name", () => {
    expect(getCat("Nieistniejąca kategoria")).toEqual(CATS[CATS.length - 1]);
  });
});
