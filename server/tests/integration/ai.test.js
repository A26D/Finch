import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

describe("AI Insights API", () => {
  it("GET /api/ai/insights — returns insight payload", async () => {
    const res = await request(app)
      .get("/api/ai/insights")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("headline");
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("insights");
    expect(res.body).toHaveProperty("recommendations");
    expect(res.body).toHaveProperty("generatedAt");
    expect(Array.isArray(res.body.insights)).toBe(true);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it("GET /api/ai/dashboard — returns short insight summary", async () => {
    const res = await request(app)
      .get("/api/ai/dashboard")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("headline");
    expect(res.body).toHaveProperty("insights");
    expect(res.body).toHaveProperty("recommendations");
    expect(res.body).toHaveProperty("generatedAt");
    expect(res.body.insights.length).toBeLessThanOrEqual(3);
  });

  it("GET /api/ai/insights — works with user_id", async () => {
    const res = await request(app)
      .get("/api/ai/insights")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("headline");
  });

  it("GET /api/dashboard — includes aiInsightSlot", async () => {
    const res = await request(app)
      .get("/api/dashboard")
      .query({ user_id: USER_ID })
      .expect(200);

    // Dashboard should include aiInsightSlot
    expect(res.body).toHaveProperty("aiInsightSlot");
    if (res.body.aiInsightSlot) {
      expect(res.body.aiInsightSlot).toHaveProperty("headline");
    }
  });
});
