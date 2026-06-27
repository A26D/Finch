import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllActive,
  getById,
  create,
  update,
  archive,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  runAllDue,
  createRecurringSchema,
  updateRecurringSchema,
  runDueSchema,
  validateStartBeforeEnd,
} from "../src/services/recurringTransactionService.js";

describe("createRecurringSchema", () => {
  it("accepts valid data", () => {
    const data = {
      user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
      name: "Netflix",
      amount: 500,
      type: "expense",
      frequency: "monthly",
      start_date: "2026-06-01",
    };
    const result = createRecurringSchema.parse(data);
    expect(result.name).toBe("Netflix");
    expect(result.interval_value).toBe(1);
    expect(result.status).toBe("active");
    expect(result.auto_create).toBe(true);
  });

  it("rejects negative amount", () => {
    expect(() =>
      createRecurringSchema.parse({
        user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
        name: "Bad",
        amount: -100,
        type: "expense",
        frequency: "monthly",
        start_date: "2026-06-01",
      })
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() =>
      createRecurringSchema.parse({
        user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
        name: "",
        amount: 500,
        type: "expense",
        frequency: "monthly",
        start_date: "2026-06-01",
      })
    ).toThrow();
  });

  it("rejects invalid frequency", () => {
    expect(() =>
      createRecurringSchema.parse({
        user_id: "860e5c75-ad13-454d-899d-f140a3767fb6",
        name: "Test",
        amount: 500,
        type: "expense",
        frequency: "fortnightly",
        start_date: "2026-06-01",
      })
    ).toThrow();
  });
});

describe("updateRecurringSchema", () => {
  it("accepts partial updates", () => {
    const result = updateRecurringSchema.parse({ amount: 600 });
    expect(result.amount).toBe(600);
  });

  it("accepts empty object", () => {
    const result = updateRecurringSchema.parse({});
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe("runDueSchema", () => {
  it("accepts valid reference_date", () => {
    const result = runDueSchema.parse({ reference_date: "2026-07-01" });
    expect(result.reference_date).toBe("2026-07-01");
  });

  it("accepts empty body", () => {
    const result = runDueSchema.parse({});
    expect(result.reference_date).toBeUndefined();
  });
});

describe("validateStartBeforeEnd", () => {
  it("returns null when no end date", () => {
    expect(validateStartBeforeEnd("2026-06-01", null)).toBe(null);
  });

  it("returns null when end is after start", () => {
    expect(validateStartBeforeEnd("2026-06-01", "2026-07-01")).toBe(null);
  });

  it("returns error when end equals start", () => {
    expect(validateStartBeforeEnd("2026-06-01", "2026-06-01")).toBe(
      "end_date must be after start_date"
    );
  });

  it("returns error when end is before start", () => {
    expect(validateStartBeforeEnd("2026-07-01", "2026-06-01")).toBe(
      "end_date must be after start_date"
    );
  });
});

describe("getAllActive", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("returns active recurring transactions", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: "rt1", name: "Test" }] });
    const result = await getAllActive("u1", mockPool);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rt1");
  });

  it("returns empty array for user with none", async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const result = await getAllActive("u1", mockPool);
    expect(result).toEqual([]);
  });
});

describe("getById", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("returns transaction when found", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: "rt1", name: "Test" }] });
    const result = await getById("rt1", "user-id", mockPool);
    expect(result.id).toBe("rt1");
  });

  it("returns null when not found", async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const result = await getById("nonexistent", "user-id", mockPool);
    expect(result).toBe(null);
  });
});

describe("create", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("inserts and returns the new recurring transaction", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: "rt1", name: "Netflix", amount: "500" }] });
    const data = {
      user_id: "u1",
      name: "Netflix",
      amount: 500,
      type: "expense",
      frequency: "monthly",
      interval_value: 1,
      start_date: "2026-06-01",
      auto_create: true,
      status: "active",
    };
    const result = await create(data, mockPool);
    expect(result.id).toBe("rt1");
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO recurring_transactions"),
      expect.arrayContaining(["Netflix", 500, "expense"])
    );
  });
});

describe("update", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("returns null when no fields to update", async () => {
    const result = await update("rt1", {}, mockPool);
    expect(result).toBe(null);
  });

  it("updates fields and returns updated record", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: "rt1", name: "Updated", amount: "600" }] });

    const result = await update("rt1", { amount: 600 }, mockPool);
    expect(result.id).toBe("rt1");
    expect(result.amount).toBe("600");
  });

  it("recalculates next_run_date when frequency changes", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ start_date: "2026-01-01", frequency: "monthly", interval_value: 1, end_date: null }] })
      .mockResolvedValueOnce({ rows: [{ id: "rt1", name: "Updated", frequency: "weekly" }] });

    const result = await update("rt1", { frequency: "weekly" }, mockPool);
    expect(result.id).toBe("rt1");
    expect(result.frequency).toBe("weekly");
  });
});

describe("archive", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("soft-deletes and returns the record", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: "rt1", name: "Test" }] });
    const result = await archive("rt1", mockPool);
    expect(result.id).toBe("rt1");
  });

  it("returns null when not found", async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const result = await archive("nonexistent", mockPool);
    expect(result).toBe(null);
  });
});

describe("pauseRecurringTransaction", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("sets status to paused", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: "rt1", status: "paused" }] });
    const result = await pauseRecurringTransaction("rt1", mockPool);
    expect(result.status).toBe("paused");
  });
});

describe("resumeRecurringTransaction", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("sets status to active", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: "rt1", status: "active" }] });
    const result = await resumeRecurringTransaction("rt1", mockPool);
    expect(result.status).toBe("active");
  });
});

describe("runAllDue", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
  });

  it("returns empty array when no due transactions", async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const result = await runAllDue(new Date("2026-06-15"), mockPool);
    expect(result).toEqual([]);
  });
});
