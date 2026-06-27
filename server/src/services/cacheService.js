import Redis from "ioredis";

let client = null;

function getClient() {
  if (!client) {
    const host = process.env.REDIS_HOST || "localhost";
    const port = Number(process.env.REDIS_PORT) || 6379;
    client = new Redis({
      host,
      port,
      lazyConnect: true,
      connectTimeout: 2000,
      retryStrategy: () => null,
    });
    client.on("connect", () => console.log("Redis connected"));
    client.on("error", () => {});
  }
  return client;
}

export async function get(key) {
  try {
    const raw = await getClient().get(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function set(key, value, ttl) {
  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await getClient().setex(key, ttl, serialized);
    } else {
      await getClient().set(key, serialized);
    }
  } catch {
    // Redis unavailable — skip caching
  }
}

export async function del(key) {
  try {
    await getClient().del(key);
  } catch {
    // Redis unavailable — skip
  }
}

export function getRedisClient() {
  return getClient();
}
