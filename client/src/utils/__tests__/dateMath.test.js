import { describe, it, expect } from "vitest";
import {
  daysBetween,
  daysRemaining,
  calculatePercentage,
  toDateStr,
} from "../dateMath";

describe("dateMath", () => {
  describe("daysBetween", () => {
    it("returns days between two dates", () => {
      expect(daysBetween("2026-06-01", "2026-06-10")).toBe(9);
    });

    it("returns 0 when start is after end", () => {
      expect(daysBetween("2026-06-10", "2026-06-01")).toBe(0);
    });

    it("returns 0 for same day", () => {
      expect(daysBetween("2026-06-10", "2026-06-10")).toBe(0);
    });
  });

  describe("daysRemaining", () => {
    it("returns days until target date", () => {
      const result = daysRemaining("2026-07-05", new Date("2026-06-25"));
      expect(result).toBe(10);
    });

    it("returns 0 when target is in the past", () => {
      const result = daysRemaining("2026-06-20", new Date("2026-06-25"));
      expect(result).toBe(0);
    });
  });

  describe("calculatePercentage", () => {
    it("returns percentage of value over total", () => {
      expect(calculatePercentage(50, 100)).toBe(50);
    });

    it("returns 0 when total is 0", () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });

    it("returns 0 when total is negative", () => {
      expect(calculatePercentage(50, -100)).toBe(0);
    });

    it("returns 0 when value is 0", () => {
      expect(calculatePercentage(0, 100)).toBe(0);
    });

    it("rounds to 2 decimal places", () => {
      expect(calculatePercentage(3333, 10000)).toBe(33.33);
    });
  });

  describe("toDateStr", () => {
    it("formats a date to YYYY-MM-DD", () => {
      expect(toDateStr("2026-06-01")).toBe("2026-06-01");
    });

    it("pads month and day", () => {
      expect(toDateStr("2026-01-05")).toBe("2026-01-05");
    });
  });
});
