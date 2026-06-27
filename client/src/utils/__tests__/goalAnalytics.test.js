import { describe, it, expect } from "vitest";
import {
  calculateGoalProgress,
  calculateRemainingAmount,
  calculateDaysRemaining,
  calculateRequiredDailySaving,
  calculateRequiredMonthlySaving,
  calculateProjectedCompletionDate,
  calculateGoalStatus,
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
} from "../goalAnalytics";

describe("goalAnalytics", () => {
  describe("calculateGoalProgress", () => {
    it("returns percentage saved toward target", () => {
      expect(calculateGoalProgress(5000, 10000)).toBe(50);
    });

    it("returns 100 when saved equals target", () => {
      expect(calculateGoalProgress(10000, 10000)).toBe(100);
    });

    it("returns 0 when target is 0", () => {
      expect(calculateGoalProgress(100, 0)).toBe(0);
    });

    it("returns 0 when saved is 0", () => {
      expect(calculateGoalProgress(0, 10000)).toBe(0);
    });
  });

  describe("calculateRemainingAmount", () => {
    it("returns target minus saved", () => {
      expect(calculateRemainingAmount(3000, 10000)).toBe(7000);
    });

    it("returns 0 when saved exceeds target", () => {
      expect(calculateRemainingAmount(12000, 10000)).toBe(0);
    });
  });

  describe("calculateDaysRemaining", () => {
    it("returns days remaining until target date", () => {
      const result = calculateDaysRemaining("2026-07-05", new Date("2026-06-25"));
      expect(result).toBe(10);
    });

    it("returns null when no target date", () => {
      expect(calculateDaysRemaining(null)).toBe(null);
    });
  });

  describe("calculateRequiredDailySaving", () => {
    it("divides remaining by days remaining", () => {
      expect(calculateRequiredDailySaving(7000, 10)).toBe(700);
    });

    it("returns null when daysRemaining is 0", () => {
      expect(calculateRequiredDailySaving(7000, 0)).toBe(null);
    });

    it("returns null when daysRemaining is negative", () => {
      expect(calculateRequiredDailySaving(7000, -5)).toBe(null);
    });

    it("rounds to 2 decimal places", () => {
      expect(calculateRequiredDailySaving(1000, 3)).toBe(333.33);
    });
  });

  describe("calculateRequiredMonthlySaving", () => {
    it("returns required monthly saving", () => {
      const result = calculateRequiredMonthlySaving(10000, "2026-07-05", new Date("2026-06-25"));
      expect(result).toBeGreaterThan(0);
    });

    it("returns null when target date is missing", () => {
      expect(calculateRequiredMonthlySaving(10000, null)).toBe(null);
    });

    it("returns null when target date is past", () => {
      const result = calculateRequiredMonthlySaving(10000, "2026-06-20", new Date("2026-06-25"));
      expect(result).toBe(null);
    });
  });

  describe("calculateProjectedCompletionDate", () => {
    it("returns a future date when there is a contribution rate", () => {
      const result = calculateProjectedCompletionDate(5000, 10000, 100);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });

    it("returns today when already at target", () => {
      const result = calculateProjectedCompletionDate(10000, 10000, 100);
      expect(result).toBeInstanceOf(Date);
    });

    it("returns null when no contribution rate", () => {
      expect(calculateProjectedCompletionDate(5000, 10000, 0)).toBe(null);
    });

    it("returns null when contribution rate is negative", () => {
      expect(calculateProjectedCompletionDate(5000, 10000, -10)).toBe(null);
    });
  });

  describe("calculateGoalStatus", () => {
    it("returns 'completed' when progress >= 100", () => {
      expect(calculateGoalStatus(100, 10, 50)).toBe("completed");
    });

    it("returns 'on_track' when no target date", () => {
      expect(calculateGoalStatus(50, null, null)).toBe("on_track");
    });

    it("returns 'behind' when past deadline and not completed", () => {
      expect(calculateGoalStatus(50, 0, 100)).toBe("behind");
    });

    it("returns 'on_track' when days remain but no required rate", () => {
      expect(calculateGoalStatus(50, 10, null)).toBe("on_track");
    });

    it("returns 'at_risk' when days remain and required rate exists", () => {
      expect(calculateGoalStatus(50, 10, 100)).toBe("at_risk");
    });

    it("returns 'completed' when past deadline but at 100%", () => {
      expect(calculateGoalStatus(100, 0, 50)).toBe("completed");
    });
  });

  describe("constants", () => {
    it("exports status colors", () => {
      expect(GOAL_STATUS_COLORS.on_track).toBe("green");
      expect(GOAL_STATUS_COLORS.at_risk).toBe("amber");
      expect(GOAL_STATUS_COLORS.behind).toBe("orange");
      expect(GOAL_STATUS_COLORS.completed).toBe("blue");
    });

    it("exports status labels", () => {
      expect(GOAL_STATUS_LABELS.on_track).toBe("On Track");
      expect(GOAL_STATUS_LABELS.at_risk).toBe("At Risk");
      expect(GOAL_STATUS_LABELS.behind).toBe("Behind");
      expect(GOAL_STATUS_LABELS.completed).toBe("Completed");
    });
  });
});
