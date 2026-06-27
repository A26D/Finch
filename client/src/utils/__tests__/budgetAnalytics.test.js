import { describe, it, expect } from "vitest";
import {
  calculateBudgetProgress,
  calculateRemainingBudget,
  calculateProjectedOverspend,
  calculateDaysRemaining,
  calculateDailySafeSpend,
  calculateBudgetStatus,
} from "../budgetAnalytics";

describe("budgetAnalytics", () => {
  describe("calculateBudgetProgress", () => {
    it("returns percentage of budget used", () => {
      expect(calculateBudgetProgress(2500, 5000)).toBe(50);
    });

    it("returns 100 when spent equals amount", () => {
      expect(calculateBudgetProgress(5000, 5000)).toBe(100);
    });

    it("returns values above 100 for overspend", () => {
      expect(calculateBudgetProgress(6000, 5000)).toBe(120);
    });

    it("returns 0 when amount is 0", () => {
      expect(calculateBudgetProgress(100, 0)).toBe(0);
    });

    it("returns 0 when amount is negative", () => {
      expect(calculateBudgetProgress(100, -500)).toBe(0);
    });

    it("returns 0 when spent is 0", () => {
      expect(calculateBudgetProgress(0, 5000)).toBe(0);
    });

    it("rounds to 2 decimal places", () => {
      expect(calculateBudgetProgress(3333, 10000)).toBe(33.33);
    });
  });

  describe("calculateRemainingBudget", () => {
    it("returns amount minus spent", () => {
      expect(calculateRemainingBudget(3000, 5000)).toBe(2000);
    });

    it("returns 0 when spent exceeds amount", () => {
      expect(calculateRemainingBudget(6000, 5000)).toBe(0);
    });

    it("returns same amount when spent is 0", () => {
      expect(calculateRemainingBudget(0, 5000)).toBe(5000);
    });
  });

  describe("calculateProjectedOverspend", () => {
    it("returns projected overspend based on current rate", () => {
      const result = calculateProjectedOverspend(2500, 5000, 15, 30);
      expect(result).toBe(0);
    });

    it("returns positive value when projected exceeds amount", () => {
      const result = calculateProjectedOverspend(4000, 5000, 15, 30);
      expect(result).toBe(3000);
    });

    it("returns 0 when daysElapsed is 0", () => {
      expect(calculateProjectedOverspend(100, 500, 0, 30)).toBe(0);
    });

    it("returns 0 when daysTotal is 0", () => {
      expect(calculateProjectedOverspend(100, 500, 15, 0)).toBe(0);
    });

    it("returns 0 when daysElapsed is negative", () => {
      expect(calculateProjectedOverspend(100, 500, -5, 30)).toBe(0);
    });
  });

  describe("calculateDaysRemaining", () => {
    it("returns days between today and period end", () => {
      const result = calculateDaysRemaining("2026-07-05", new Date("2026-06-25"));
      expect(result).toBe(10);
    });

    it("returns 0 when period end is in the past", () => {
      const result = calculateDaysRemaining("2026-06-20", new Date("2026-06-25"));
      expect(result).toBe(0);
    });

    it("returns 0 for same day", () => {
      const result = calculateDaysRemaining("2026-06-25", new Date("2026-06-25"));
      expect(result).toBe(0);
    });
  });

  describe("calculateDailySafeSpend", () => {
    it("divides remaining by days remaining", () => {
      expect(calculateDailySafeSpend(3000, 10)).toBe(300);
    });

    it("returns 0 when daysRemaining is 0", () => {
      expect(calculateDailySafeSpend(3000, 0)).toBe(0);
    });

    it("returns 0 when daysRemaining is negative", () => {
      expect(calculateDailySafeSpend(3000, -5)).toBe(0);
    });

    it("returns 0 when remaining is 0", () => {
      expect(calculateDailySafeSpend(0, 10)).toBe(0);
    });

    it("rounds to 2 decimal places", () => {
      expect(calculateDailySafeSpend(1000, 3)).toBe(333.33);
    });
  });

  describe("calculateBudgetStatus", () => {
    it("returns 'safe' when under threshold", () => {
      expect(calculateBudgetStatus(50, 0.8)).toBe("safe");
    });

    it("returns 'warning' when at or above threshold", () => {
      expect(calculateBudgetStatus(80, 0.8)).toBe("warning");
    });

    it("returns 'critical' when at 100%", () => {
      expect(calculateBudgetStatus(100, 0.8)).toBe("critical");
    });

    it("returns 'exceeded' when at 110% or above", () => {
      expect(calculateBudgetStatus(110, 0.8)).toBe("exceeded");
    });

    it("returns 'exceeded' for values well above 110", () => {
      expect(calculateBudgetStatus(150, 0.8)).toBe("exceeded");
    });
  });
});
