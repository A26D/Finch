import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";
let budgetId;

describe("Budgets CRUD API", () => {
  it("POST /api/budgets — creates a budget", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .send({
        user_id: USER_ID,
        name: "Integration Test Budget",
        type: "fixed",
        amount: 10000,
        period: "monthly",
        start_date: "2026-06-01",
        end_date: "2026-06-30",
        category_ids: [],
        alert_threshold: 0.8,
        strictness: "soft",
      })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Integration Test Budget");
    expect(Number(res.body.amount)).toBe(10000);
    budgetId = res.body.id;
  });

  it("GET /api/budgets?user_id= — lists budgets with progress", async () => {
    const res = await request(app)
      .get("/api/budgets")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const created = res.body.find((b) => b.id === budgetId);
    expect(created).toBeDefined();
    expect(created).toHaveProperty("spent");
    expect(created).toHaveProperty("remaining");
    expect(created).toHaveProperty("percentUsed");
    expect(created).toHaveProperty("periodStart");
    expect(created).toHaveProperty("periodEnd");
  });

  it("GET /api/budgets/:id — returns single budget with progress", async () => {
    const res = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .expect(200);

    expect(res.body.id).toBe(budgetId);
    expect(typeof res.body.spent).toBe("number");
    expect(typeof res.body.percentUsed).toBe("number");
  });

  it("PUT /api/budgets/:id — updates a budget", async () => {
    const res = await request(app)
      .put(`/api/budgets/${budgetId}`)
      .send({ amount: 12000 })
      .expect(200);

    expect(Number(res.body.amount)).toBe(12000);
  });

  it("DELETE /api/budgets/:id — soft-deletes a budget", async () => {
    const res = await request(app)
      .delete(`/api/budgets/${budgetId}`)
      .expect(200);

    expect(res.body.message).toBe("Budget archived");
  });

  it("GET /api/budgets/:id — returns 404 for archived budget", async () => {
    await request(app)
      .get(`/api/budgets/${budgetId}`)
      .expect(404);
  });

  it("GET /api/budgets?user_id= — excludes archived budgets", async () => {
    const res = await request(app)
      .get("/api/budgets")
      .query({ user_id: USER_ID })
      .expect(200);

    const archived = res.body.find((b) => b.id === budgetId);
    expect(archived).toBeUndefined();
  });

  it("POST /api/budgets — rejects negative amounts", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .send({
        user_id: USER_ID,
        name: "Bad Budget",
        amount: -100,
        period: "monthly",
        start_date: "2026-06-01",
      })
      .expect(400);

    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toBeDefined();
  });

  it("POST /api/budgets — rejects invalid date format", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .send({
        user_id: USER_ID,
        name: "Bad Budget",
        amount: 5000,
        period: "monthly",
        start_date: "not-a-date",
      })
      .expect(400);

    expect(res.body.error).toBe("Validation failed");
  });
});
