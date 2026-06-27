import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

describe("Reports API", () => {
  it("GET /api/reports/summary — returns summary object", async () => {
    const res = await request(app)
      .get("/api/reports/summary")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("totalIncome");
    expect(res.body).toHaveProperty("totalExpenses");
    expect(res.body).toHaveProperty("currentBalance");
    expect(res.body).toHaveProperty("savingsRate");
    expect(res.body).toHaveProperty("averageDailySpend");
    expect(res.body).toHaveProperty("averageMonthlySpend");
    expect(res.body).toHaveProperty("activeBudgets");
    expect(res.body).toHaveProperty("activeGoals");
  });

  it("GET /api/reports/monthly — returns array", async () => {
    const res = await request(app)
      .get("/api/reports/monthly")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/reports/yearly — returns array", async () => {
    const res = await request(app)
      .get("/api/reports/yearly")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/reports/categories — returns category breakdown", async () => {
    const res = await request(app)
      .get("/api/reports/categories")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("categories");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("highest");
    expect(res.body).toHaveProperty("lowest");
    expect(res.body).toHaveProperty("topCategories");
  });

  it("GET /api/reports/cashflow — returns cash flow data", async () => {
    const res = await request(app)
      .get("/api/reports/cashflow")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("monthly");
    expect(res.body).toHaveProperty("netWorth");
    expect(res.body).toHaveProperty("monthlyGrowth");
    expect(res.body).toHaveProperty("expenseGrowth");
    expect(res.body).toHaveProperty("incomeGrowth");
  });

  it("GET /api/reports/budgets — returns budget stats", async () => {
    const res = await request(app)
      .get("/api/reports/budgets")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("totalBudgeted");
    expect(res.body).toHaveProperty("totalSpent");
    expect(res.body).toHaveProperty("utilization");
    expect(res.body).toHaveProperty("warningCount");
    expect(res.body).toHaveProperty("exceededCount");
  });

  it("GET /api/reports/goals — returns goal stats", async () => {
    const res = await request(app)
      .get("/api/reports/goals")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("completed");
    expect(res.body).toHaveProperty("completionRate");
    expect(res.body).toHaveProperty("totalTarget");
    expect(res.body).toHaveProperty("totalSaved");
  });

  it("GET /api/reports/recurring — returns recurring stats", async () => {
    const res = await request(app)
      .get("/api/reports/recurring")
      .query({ user_id: USER_ID })
      .expect(200);

    expect(res.body).toHaveProperty("monthlyRecurringExpenses");
    expect(res.body).toHaveProperty("monthlyRecurringIncome");
    expect(res.body).toHaveProperty("upcoming");
  });

  it("GET /api/reports/export?format=csv — returns CSV", async () => {
    const res = await request(app)
      .get("/api/reports/export")
      .query({ format: "csv", user_id: USER_ID })
      .expect(200);

    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("=== SUMMARY ===");
  });

  it("GET /api/reports/export?format=pdf — returns HTML", async () => {
    const res = await request(app)
      .get("/api/reports/export")
      .query({ format: "pdf", user_id: USER_ID })
      .expect(200);

    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("<!DOCTYPE html>");
  });

  it("GET /api/reports/export — returns 400 for invalid format", async () => {
    const res = await request(app)
      .get("/api/reports/export")
      .query({ format: "xlsx", user_id: USER_ID })
      .expect(400);

    expect(res.body.error).toBe("Unsupported export format. Use 'csv' or 'pdf'.");
  });
});
