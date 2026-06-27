import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";
let recurringId;

describe("Recurring Transactions CRUD API", () => {
  it("POST /api/recurring-transactions — creates a recurring transaction", async () => {
    const res = await request(app)
      .post("/api/recurring-transactions")
      .send({
        user_id: USER_ID,
        name: "Integration Test Netflix",
        amount: 500,
        type: "expense",
        frequency: "monthly",
        interval_value: 1,
        start_date: "2026-06-01",
        payment_method: "card",
      })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Integration Test Netflix");
    expect(Number(res.body.amount)).toBe(500);
    expect(res.body.frequency).toBe("monthly");
    expect(res.body.status).toBe("active");
    expect(res.body.next_run_date).toBeDefined();
    recurringId = res.body.id;
  });

  it("GET /api/recurring-transactions?user_id= — lists active", async () => {
    const res = await request(app)
      .get("/api/recurring-transactions")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const created = res.body.find((rt) => rt.id === recurringId);
    expect(created).toBeDefined();
    expect(created.name).toBe("Integration Test Netflix");
  });

  it("GET /api/recurring-transactions/:id — returns single", async () => {
    const res = await request(app)
      .get(`/api/recurring-transactions/${recurringId}`)
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body.id).toBe(recurringId);
    expect(Number(res.body.amount)).toBe(500);
  });

  it("PUT /api/recurring-transactions/:id — updates fields", async () => {
    const res = await request(app)
      .put(`/api/recurring-transactions/${recurringId}`)
      .query({ user_id: USER_ID })
      .send({ amount: 600, payment_method: "upi" })
      .expect(200);

    expect(Number(res.body.amount)).toBe(600);
    expect(res.body.payment_method).toBe("upi");
  });

  it("POST /api/recurring-transactions/:id/pause — pauses", async () => {
    const res = await request(app)
      .post(`/api/recurring-transactions/${recurringId}/pause`)
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body.status).toBe("paused");
  });

  it("POST /api/recurring-transactions/:id/resume — resumes", async () => {
    const res = await request(app)
      .post(`/api/recurring-transactions/${recurringId}/resume`)
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body.status).toBe("active");
  });

  it("DELETE /api/recurring-transactions/:id — soft-deletes", async () => {
    const res = await request(app)
      .delete(`/api/recurring-transactions/${recurringId}`)
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body.message).toBe("Recurring transaction archived");
  });

  it("GET /api/recurring-transactions/:id — returns 404 for archived", async () => {
    await request(app)
      .get(`/api/recurring-transactions/${recurringId}`)
      .query({ user_id: USER_ID })
      .expect(404);
  });

  it("POST /api/recurring-transactions — rejects negative amount", async () => {
    const res = await request(app)
      .post("/api/recurring-transactions")
      .send({
        user_id: USER_ID,
        name: "Bad",
        amount: -100,
        type: "expense",
        frequency: "monthly",
        start_date: "2026-06-01",
      })
      .expect(400);

    expect(res.body.error).toBe("Validation failed");
  });

  it("POST /api/recurring-transactions/:id/pause — returns 404 for archived", async () => {
    await request(app)
      .post(`/api/recurring-transactions/${recurringId}/pause`)
      .query({ user_id: USER_ID })
      .expect(404);
  });
});
