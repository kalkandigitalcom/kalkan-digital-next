import { describe, expect, it } from "vitest";
import { addMonths, formatDate, isIsoDate, resolveRange, todayIso } from "@/lib/dates";
import { nextPeriodStart, periodEnd } from "@/server/finance/recurring";

describe("dates", () => {
  it("validates ISO dates strictly", () => {
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-13-01")).toBe(false);
  });
  it("uses Istanbul time for 'today'", () => {
    // 2026-10-18 22:30 UTC is already 19 Oct in Istanbul (UTC+3)
    expect(todayIso(new Date("2026-10-18T22:30:00Z"))).toBe("2026-10-19");
  });
  it("clamps month arithmetic to month end", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-02-28", 1, 31)).toBe("2026-03-31");
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
  });
  it("resolves dashboard ranges", () => {
    const t = "2026-10-19";
    expect(resolveRange({ range: "this_month" }, t)).toMatchObject({ from: "2026-10-01", to: "2026-10-31" });
    expect(resolveRange({ range: "last_30" }, t)).toMatchObject({ from: "2026-09-20", to: "2026-10-19" });
    expect(resolveRange({ range: "this_year" }, t)).toMatchObject({ from: "2026-01-01", to: "2026-12-31" });
    expect(resolveRange({ range: "prev_year" }, t)).toMatchObject({ from: "2025-01-01", to: "2025-12-31" });
    expect(resolveRange({ range: "custom", from: "2026-05-10", to: "2026-03-01" }, t)).toMatchObject({ from: "2026-03-01", to: "2026-05-10" });
    expect(resolveRange({ range: "custom", from: "bad", to: "2026-03-01" }, t).preset).toBe("this_month");
    expect(resolveRange({ range: "<script>" }, t).preset).toBe("this_month");
  });
  it("formats Turkish dates", () => {
    expect(formatDate("2026-10-19")).toBe("19.10.2026");
  });
  it("computes recurring periods anchored to the start day", () => {
    expect(nextPeriodStart("2026-01-31", "monthly", 31)).toBe("2026-02-28");
    expect(nextPeriodStart("2026-02-28", "monthly", 31)).toBe("2026-03-31");
    expect(periodEnd("2026-03-15", "yearly", 15)).toBe("2027-03-14");
    expect(nextPeriodStart("2026-08-31", "semiannual", 31)).toBe("2027-02-28");
    expect(nextPeriodStart("2026-11-30", "quarterly", 30)).toBe("2027-02-28");
  });
});
