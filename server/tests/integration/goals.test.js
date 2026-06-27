import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";
let goalId;

describe("Goals CRUD API", () => {
  it("POST /api/goals — creates a goal", async () => {
    const res = await request(app)
      .post("/api/goals")
      .send({
        user_id: USER_ID,
        name: "Integration Test Goal",
        target_amount: 50000,
        current_saved_amount: 5000,
        target_date: "2026-12-31",
        priority: "high",
      })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Integration Test Goal");
    expect(Number(res.body.target_amount)).toBe(50000);
    goalId = res.body.id;
  });

  it("GET /api/goals?user_id= — lists goals with progress", async () => {
    const res = await request(app)
      .get("/api/goals")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const created = res.body.find((g) => g.id === goalId);
    expect(created).toBeDefined();
    expect(created).toHaveProperty("progress");
    expect(created).toHaveProperty("remaining");
  });

  it("GET /api/goals/:id — returns single goal with progress", async () => {
    const res = await request(app)
      .get(`/api/goals/${goalId}`)
      .expect(200);

    expect(res.body.id).toBe(goalId);
    expect(typeof res.body.progress).toBe("number");
    expect(typeof res.body.remaining).toBe("number");
  });

  it("PUT /api/goals/:id — updates a goal", async () => {
    const res = await request(app)
      .put(`/api/goals/${goalId}`)
      .send({ target_amount: 75000 })
      .expect(200);

    expect(Number(res.body.target_amount)).toBe(75000);
  });

  it("POST /api/goals/:id/contribute — contributes to a goal", async () => {
    const res = await request(app)
      .post(`/api/goals/${goalId}/contribute`)
      .send({ amount: 10000 })
      .expect(200);

    expect(Number(res.body.current_saved_amount)).toBe(15000);
  });

  it("DELETE /api/goals/:id — soft-deletes a goal", async () => {
    const res = await request(app)
      .delete(`/api/goals/${goalId}`)
      .expect(200);

    expect(res.body.message).toBe("Goal archived");
  });

  it("GET /api/goals/:id — returns 404 for archived goal", async () => {
    await request(app)
      .get(`/api/goals/${goalId}`)
      .expect(404);
  });

  it("GET /api/goals?user_id= — excludes archived goals", async () => {
    const res = await request(app)
      .get("/api/goals")
      .query({ user_id: USER_ID })
      .expect(200);

    const archived = res.body.find((g) => g.id === goalId);
    expect(archived).toBeUndefined();
  });

  it("POST /api/goals — rejects negative target amount", async () => {
    const res = await request(app)
      .post("/api/goals")
      .send({
        user_id: USER_ID,
        name: "Bad Goal",
        target_amount: -100,
      })
      .expect(400);

    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toBeDefined();
  });

  it("POST /api/goals/:id/contribute — rejects negative contribution", async () => {
    const res = await request(app)
      .post(`/api/goals/${goalId}/contribute`)
      .send({ amount: -50 })
      .expect(400);

    expect(res.body.error).toBe("Validation failed");
  });
});
