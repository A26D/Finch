import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import pool from "../../src/db.js";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

describe("Settings API", () => {
  beforeAll(async () => {
    // Ensure clean state
    await pool.query("DELETE FROM user_settings WHERE user_id = $1", [USER_ID]);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM user_settings WHERE user_id = $1", [USER_ID]);
  });

  it("GET /api/settings — creates defaults on first fetch and returns them", async () => {
    const res = await request(app)
      .get("/api/settings")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("currency", "INR");
    expect(res.body).toHaveProperty("theme", "system");
    expect(res.body).toHaveProperty("budget_alert_threshold", 0.8);
    expect(res.body).toHaveProperty("goal_alert_days", 14);
    expect(res.body).toHaveProperty("first_day_of_week", "monday");
    expect(res.body).toHaveProperty("notifications_enabled", true);
    expect(res.body).toHaveProperty("dashboard_compact_mode", false);
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).toHaveProperty("updated_at");
  });

  it("PUT /api/settings — updates settings", async () => {
    const res = await request(app)
      .put("/api/settings")
      .query({ user_id: USER_ID })
      .send({
        currency: "USD",
        theme: "dark",
        budget_alert_threshold: 0.85,
        goal_alert_days: 7,
        first_day_of_week: "sunday",
        notifications_enabled: false,
        dashboard_compact_mode: true,
      })
      .expect(200);

    expect(res.body.currency).toBe("USD");
    expect(res.body.theme).toBe("dark");
    expect(res.body.budget_alert_threshold).toBe(0.85);
    expect(res.body.goal_alert_days).toBe(7);
    expect(res.body.first_day_of_week).toBe("sunday");
    expect(res.body.notifications_enabled).toBe(false);
    expect(res.body.dashboard_compact_mode).toBe(true);
  });

  it("GET /api/settings — returns updated values", async () => {
    const res = await request(app)
      .get("/api/settings")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body.currency).toBe("USD");
    expect(res.body.theme).toBe("dark");
  });

  it("PUT /api/settings — rejects invalid currency", async () => {
    const res = await request(app)
      .put("/api/settings")
      .query({ user_id: USER_ID })
      .send({ currency: "invalid" })
      .expect(400);

    expect(res.body).toHaveProperty("error", "Validation failed");
  });

  it("PUT /api/settings — rejects invalid budget_alert_threshold", async () => {
    const res = await request(app)
      .put("/api/settings")
      .query({ user_id: USER_ID })
      .send({ budget_alert_threshold: 2.0 })
      .expect(400);

    expect(res.body).toHaveProperty("error", "Validation failed");
  });

  it("POST /api/settings/reset — resets all settings to defaults", async () => {
    const res = await request(app)
      .post("/api/settings/reset")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body.currency).toBe("INR");
    expect(res.body.theme).toBe("system");
    expect(res.body.budget_alert_threshold).toBe(0.8);
    expect(res.body.goal_alert_days).toBe(14);
    expect(res.body.first_day_of_week).toBe("monday");
    expect(res.body.notifications_enabled).toBe(true);
    expect(res.body.dashboard_compact_mode).toBe(false);
  });

  it("PUT /api/settings — partial update works", async () => {
    const res = await request(app)
      .put("/api/settings")
      .query({ user_id: USER_ID })
      .send({ timezone: "America/New_York" })
      .expect(200);

    expect(res.body.timezone).toBe("America/New_York");
    // Other fields should remain at defaults
    expect(res.body.currency).toBe("INR");
    expect(res.body.theme).toBe("system");
  });
});
