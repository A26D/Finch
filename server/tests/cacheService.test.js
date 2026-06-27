import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStorage = new Map();
const mockRedis = {
  get: vi.fn((key) => Promise.resolve(mockStorage.get(key) || null)),
  set: vi.fn((key, val) => {
    mockStorage.set(key, val);
    return Promise.resolve("OK");
  }),
  setex: vi.fn((key, ttl, val) => {
    mockStorage.set(key, val);
    return Promise.resolve("OK");
  }),
  del: vi.fn((key) => {
    mockStorage.delete(key);
    return Promise.resolve(1);
  }),
  on: vi.fn(),
  connect: vi.fn(),
};

vi.mock("ioredis", () => {
  return {
    default: function MockRedis() {
      return mockRedis;
    },
  };
});

let cacheService;

beforeEach(async () => {
  mockStorage.clear();
  vi.clearAllMocks();
  cacheService = await import("../src/services/cacheService.js");
});

describe("cacheService", () => {
  it("set and get a value", async () => {
    await cacheService.set("test:key", { foo: "bar" });
    const result = await cacheService.get("test:key");
    expect(result).toEqual({ foo: "bar" });
  });

  it("get returns null for missing key", async () => {
    const result = await cacheService.get("nonexistent");
    expect(result).toBeNull();
  });

  it("set with TTL", async () => {
    await cacheService.set("ttl:key", { data: 42 }, 3600);
    const result = await cacheService.get("ttl:key");
    expect(result).toEqual({ data: 42 });
    expect(mockRedis.setex).toHaveBeenCalledWith("ttl:key", 3600, JSON.stringify({ data: 42 }));
  });

  it("del removes key", async () => {
    await cacheService.set("del:key", "value");
    expect(await cacheService.get("del:key")).toBe("value");
    await cacheService.del("del:key");
    expect(await cacheService.get("del:key")).toBeNull();
  });

  it("get returns null when Redis errors", async () => {
    mockRedis.get.mockRejectedValueOnce(new Error("Connection refused"));
    const result = await cacheService.get("err:key");
    expect(result).toBeNull();
  });

  it("set silently handles Redis error", async () => {
    mockRedis.set.mockRejectedValueOnce(new Error("Connection refused"));
    await expect(cacheService.set("err:key", "val")).resolves.toBeUndefined();
  });
});
