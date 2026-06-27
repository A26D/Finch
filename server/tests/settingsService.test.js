import { describe, it, expect, vi, beforeEach } from "vitest";
import * as settingsService from "../src/services/settingsService.js";

const mockSettingsRow = {
  id: "s1",
  user_id: "u1",
  currency: "INR",
  locale: "en-IN",
  timezone: "Asia/Kolkata",
  theme: "system",
  first_day_of_week: "monday",
  date_format: "DD/MM/YYYY",
  number_format: "1,234.56",
  budget_alert_threshold: "0.80",
  goal_alert_days: 14,
  notifications_enabled: true,
  email_notifications: true,
  push_notifications: false,
  weekly_summary_enabled: true,
  monthly_summary_enabled: true,
  default_budget_period: "monthly",
  default_budget_strictness: "soft",
  default_goal_priority: "medium",
  dashboard_compact_mode: false,
  large_expense_threshold: "10000.00",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

vi.mock("../src/db.js", () => ({
  default: { query: vi.fn() },
}));

let pool;

beforeEach(async () => {
  vi.clearAllMocks();
  pool = (await import("../src/db.js")).default;
});

describe("initializeDefaults", () => {
  it("creates a row with default values when none exists", async () => {
    pool.query.mockResolvedValue({ rows: [mockSettingsRow] });
    const result = await settingsService.initializeDefaults("u1");
    expect(result).toEqual(mockSettingsRow);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO user_settings"),
      ["u1"]
    );
  });

  it("returns null when row already exists (ON CONFLICT DO NOTHING)", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await settingsService.initializeDefaults("u1");
    expect(result).toBeNull();
  });
});

describe("rowToSettings", () => {
  it("converts numeric string fields to numbers", () => {
    const result = settingsService.rowToSettings(mockSettingsRow);
    expect(result.budget_alert_threshold).toBe(0.8);
    expect(result.large_expense_threshold).toBe(10000);
    expect(result.goal_alert_days).toBe(14);
    expect(result.dashboard_compact_mode).toBe(false);
  });

  it("returns null for null input", () => {
    expect(settingsService.rowToSettings(null)).toBeNull();
  });
});

describe("getSettings", () => {
  it("returns existing settings", async () => {
    pool.query.mockResolvedValue({ rows: [mockSettingsRow] });
    const result = await settingsService.getSettings("u1");
    expect(result.currency).toBe("INR");
    expect(result.theme).toBe("system");
  });

  it("creates defaults if no row exists", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [mockSettingsRow] });
    const result = await settingsService.getSettings("u1");
    expect(result.currency).toBe("INR");
  });
});

describe("updateSettings", () => {
  it("updates specified fields", async () => {
    pool.query.mockResolvedValue({
      rows: [{ ...mockSettingsRow, currency: "USD", theme: "dark" }],
    });
    const result = await settingsService.updateSettings("u1", {
      currency: "USD",
      theme: "dark",
    });
    expect(result.currency).toBe("USD");
    expect(result.theme).toBe("dark");
  });

  it("returns current settings when no fields provided", async () => {
    pool.query.mockResolvedValue({ rows: [mockSettingsRow] });
    const result = await settingsService.updateSettings("u1", {});
    expect(result.currency).toBe("INR");
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("sets updated_at timestamp", async () => {
    pool.query.mockResolvedValue({
      rows: [{ ...mockSettingsRow, currency: "EUR" }],
    });
    await settingsService.updateSettings("u1", { currency: "EUR" });
    const query = pool.query.mock.calls[0][0];
    expect(query).toContain("updated_at = NOW()");
  });
});

describe("resetSettings", () => {
  it("restores all default values", async () => {
    pool.query.mockResolvedValue({ rows: [mockSettingsRow] });
    const result = await settingsService.resetSettings("u1");
    expect(result.currency).toBe("INR");
    expect(result.theme).toBe("system");
    expect(result.budget_alert_threshold).toBe(0.8);
    expect(result.goal_alert_days).toBe(14);
    expect(result.dashboard_compact_mode).toBe(false);
  });
});

describe("updateSettingsSchema", () => {
  it("validates currency as 3-letter uppercase", () => {
    const valid = settingsService.updateSettingsSchema.safeParse({ currency: "USD" });
    expect(valid.success).toBe(true);
    const invalid = settingsService.updateSettingsSchema.safeParse({ currency: "usd" });
    expect(invalid.success).toBe(false);
    const tooLong = settingsService.updateSettingsSchema.safeParse({ currency: "USDD" });
    expect(tooLong.success).toBe(false);
  });

  it("validates theme enum", () => {
    const valid = settingsService.updateSettingsSchema.safeParse({ theme: "dark" });
    expect(valid.success).toBe(true);
    const invalid = settingsService.updateSettingsSchema.safeParse({ theme: "blue" });
    expect(invalid.success).toBe(false);
  });

  it("validates budget_alert_threshold range", () => {
    const valid = settingsService.updateSettingsSchema.safeParse({ budget_alert_threshold: 0.75 });
    expect(valid.success).toBe(true);
    const tooLow = settingsService.updateSettingsSchema.safeParse({ budget_alert_threshold: 0.3 });
    expect(tooLow.success).toBe(false);
    const tooHigh = settingsService.updateSettingsSchema.safeParse({ budget_alert_threshold: 1.5 });
    expect(tooHigh.success).toBe(false);
  });

  it("validates goal_alert_days as positive integer", () => {
    const valid = settingsService.updateSettingsSchema.safeParse({ goal_alert_days: 7 });
    expect(valid.success).toBe(true);
    const zero = settingsService.updateSettingsSchema.safeParse({ goal_alert_days: 0 });
    expect(zero.success).toBe(false);
    const negative = settingsService.updateSettingsSchema.safeParse({ goal_alert_days: -1 });
    expect(negative.success).toBe(false);
    const decimal = settingsService.updateSettingsSchema.safeParse({ goal_alert_days: 1.5 });
    expect(decimal.success).toBe(false);
  });

  it("validates timezone as IANA-like string", () => {
    const valid = settingsService.updateSettingsSchema.safeParse({ timezone: "America/New_York" });
    expect(valid.success).toBe(true);
    const invalid = settingsService.updateSettingsSchema.safeParse({ timezone: "not-a-tz" });
    expect(invalid.success).toBe(false);
  });

  it("validates first_day_of_week", () => {
    const valid = settingsService.updateSettingsSchema.safeParse({ first_day_of_week: "sunday" });
    expect(valid.success).toBe(true);
    const invalid = settingsService.updateSettingsSchema.safeParse({ first_day_of_week: "friday" });
    expect(invalid.success).toBe(false);
  });

  it("validates partial update with one field", () => {
    const result = settingsService.updateSettingsSchema.safeParse({
      notifications_enabled: false,
    });
    expect(result.success).toBe(true);
  });
});
