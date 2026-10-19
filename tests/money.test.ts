import { describe, expect, it } from "vitest";
import { addMoney, compareMoney, convertAmount, fromScaled, normalizeDecimalInput, subMoney, toScaled } from "@/lib/money";

describe("money", () => {
  it("adds without floating point errors", () => {
    expect(addMoney("0.10", "0.20")).toBe("0.30");
    expect(addMoney("1999999999.99", "0.01")).toBe("2000000000.00");
    expect(subMoney("100.00", "100.01")).toBe("-0.01");
  });
  it("converts with half-away-from-zero rounding", () => {
    expect(convertAmount("100.00", "36.454500")).toBe("3645.45");
    expect(convertAmount("10.00", "0.333335")).toBe("3.33");
    expect(convertAmount("1.00", "0.005000")).toBe("0.01");
    expect(convertAmount("1250.50", "1")).toBe("1250.50");
  });
  it("scales and unscales", () => {
    expect(toScaled("12.345", 2)).toBe(1235n);
    expect(fromScaled(-5n, 2)).toBe("-0.05");
    expect(compareMoney("10.00", "9.99")).toBe(1);
  });
  it("normalises Turkish and international inputs", () => {
    expect(normalizeDecimalInput("1.234,56")).toBe("1234.56");
    expect(normalizeDecimalInput("1,234.56")).toBe("1234.56");
    expect(normalizeDecimalInput("1234,5")).toBe("1234.5");
    expect(normalizeDecimalInput("12.500")).toBe("12500");
    expect(normalizeDecimalInput("0.500")).toBe("0.500");
    expect(normalizeDecimalInput("99.95")).toBe("99.95");
    expect(normalizeDecimalInput("₺ 2.000")).toBe("2000");
    expect(normalizeDecimalInput("abc")).toBeNull();
    expect(normalizeDecimalInput("")).toBeNull();
  });
});
