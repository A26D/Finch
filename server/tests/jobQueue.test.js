import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAdd = vi.fn().mockResolvedValue({ id: "job-1" });

vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: mockAdd,
  })),
}));

vi.mock("ioredis", () => ({
  default: function MockRedis() {
    return {
      on: vi.fn(),
      connect: vi.fn(),
    };
  },
}));

let jobQueue;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  jobQueue = await import("../src/jobs/jobQueue.js");
});

describe("enqueueDashboardRecompute", () => {
  it("enqueues a job with userId and reason", async () => {
    await jobQueue.enqueueDashboardRecompute("user-1", "transaction_created");

    expect(mockAdd).toHaveBeenCalledWith(
      "recompute",
      expect.objectContaining({
        userId: "user-1",
        reason: "transaction_created",
        triggeredAt: expect.any(String),
      }),
      expect.any(Object)
    );
  });

  it("enqueues with triggeredAt as ISO string", async () => {
    await jobQueue.enqueueDashboardRecompute("user-2", "goal_contributed");

    const callArg = mockAdd.mock.calls[0][1];
    expect(callArg.triggeredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("accepts any reason string", async () => {
    const reasons = [
      "transaction_created",
      "transaction_updated",
      "transaction_deleted",
      "budget_created",
      "budget_updated",
      "budget_deleted",
      "goal_created",
      "goal_updated",
      "goal_deleted",
      "goal_contributed",
      "recurring_created",
      "recurring_updated",
      "recurring_deleted",
      "recurring_paused",
      "recurring_resumed",
    ];

    for (const reason of reasons) {
      await jobQueue.enqueueDashboardRecompute("user-1", reason);
    }

    expect(mockAdd).toHaveBeenCalledTimes(reasons.length);
  });
});
