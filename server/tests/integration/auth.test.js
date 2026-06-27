import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import pool from "../../src/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_EMAIL = `auth-test-${Date.now()}@example.com`;
const TEST_PASSWORD = "testpassword123";
const TEST_NAME = "Auth Test User";
let accessToken = "";
let refreshTokenCookie = "";

function extractCookie(res, name) {
  const header = res.headers["set-cookie"];
  if (!header) return null;
  const cookies = Array.isArray(header) ? header : [header];
  const found = cookies.find((c) => c.startsWith(`${name}=`));
  if (!found) return null;
  return found.split(";")[0];
}

describe("Authentication API", () => {
  beforeAll(async () => {
    // Ensure refresh_tokens table exists
    const migrationPath = path.resolve(__dirname, "../../src/migrations/007_create_refresh_tokens.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");
    await pool.query(sql);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user and returns tokens", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(201);

      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.name).toBe(TEST_NAME);
      expect(res.body.user.email).toBe(TEST_EMAIL);
      expect(res.body.user).not.toHaveProperty("password_hash");
      expect(res.body).toHaveProperty("accessToken");

      accessToken = res.body.accessToken;
      const rtCookie = extractCookie(res, "refreshToken");
      expect(rtCookie).toBeTruthy();
      refreshTokenCookie = rtCookie;
    });

    it("rejects duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Duplicate", email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(409);

      expect(res.body.error).toBe("Email already registered");
    });

    it("rejects missing name", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "missing@test.com", password: TEST_PASSWORD })
        .expect(400);

      expect(res.body.error).toContain("required");
    });

    it("rejects missing email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "No Email", password: TEST_PASSWORD })
        .expect(400);

      expect(res.body.error).toContain("required");
    });

    it("rejects missing password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "No Password", email: "nopass@test.com" })
        .expect(400);

      expect(res.body.error).toContain("required");
    });

    it("rejects short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Short", email: "short@test.com", password: "12345" })
        .expect(400);

      expect(res.body.error).toContain("at least 6 characters");
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(TEST_EMAIL);
      expect(res.body).toHaveProperty("accessToken");

      accessToken = res.body.accessToken;
      const rtCookie = extractCookie(res, "refreshToken");
      expect(rtCookie).toBeTruthy();
      refreshTokenCookie = rtCookie;
    });

    it("rejects wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: "wrongpassword" })
        .expect(401);

      expect(res.body.error).toBe("Invalid email or password");
    });

    it("rejects non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@test.com", password: TEST_PASSWORD })
        .expect(401);

      expect(res.body.error).toBe("Invalid email or password");
    });

    it("rejects missing email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: TEST_PASSWORD })
        .expect(400);

      expect(res.body.error).toContain("required");
    });

    it("rejects missing password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL })
        .expect(400);

      expect(res.body.error).toContain("required");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns current user with valid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("id");
      expect(res.body.email).toBe(TEST_EMAIL);
      expect(res.body.name).toBe(TEST_NAME);
    });

    it("rejects without auth header", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .expect(401);

      expect(res.body.error).toBe("Authentication required");
    });

    it("rejects with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalidtoken123")
        .expect(401);

      expect(res.body.error).toBe("Invalid or expired token");
    });

    it("rejects with expired token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQwMjIyfQ.4xJpVT6dC7lZQ2K6qO0W0yZ6Q5tQg5w6l7p2s1e8f0c")
        .expect(401);

      expect(res.body.error).toBe("Invalid or expired token");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("returns new tokens with valid refresh cookie", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", refreshTokenCookie)
        .expect(200);

      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(TEST_EMAIL);

      // Store new tokens
      accessToken = res.body.accessToken;
      const newRtCookie = extractCookie(res, "refreshToken");
      expect(newRtCookie).toBeTruthy();
      refreshTokenCookie = newRtCookie;
    });

    it("rejects without refresh cookie", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .expect(401);

      expect(res.body.error).toBe("Refresh token not provided");
    });

    it("rejects with invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", "refreshToken=invalidtoken123")
        .expect(401);

      expect(res.body.error).toContain("Invalid or expired refresh token");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("logs out successfully", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", refreshTokenCookie)
        .expect(200);

      expect(res.body.message).toBe("Logged out successfully");
    });

    it("old refresh token no longer works after logout", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", refreshTokenCookie)
        .expect(401);

      expect(res.body.error).toContain("Invalid or expired refresh token");
    });
  });

  describe("Route protection", () => {
    it("blocks unauthenticated access to /api/transactions", async () => {
      const res = await request(app)
        .get("/api/transactions")
        .expect(401);

      expect(res.body.error).toBe("Authentication required");
    });

    it("blocks unauthenticated access to /api/budgets", async () => {
      const res = await request(app)
        .get("/api/budgets")
        .expect(401);

      expect(res.body.error).toBe("Authentication required");
    });

    it("blocks unauthenticated access to /api/goals", async () => {
      const res = await request(app)
        .get("/api/goals")
        .expect(401);

      expect(res.body.error).toBe("Authentication required");
    });

    it("blocks unauthenticated access to /api/notifications", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .expect(401);

      expect(res.body.error).toBe("Authentication required");
    });

    it("allows access with valid Bearer token", async () => {
      // Re-login to get a fresh token
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("transactions");
    });

    it("allows access with ?user_id= fallback", async () => {
      // First get the user ID
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const res = await request(app)
        .get("/api/transactions")
        .query({ user_id: loginRes.body.user.id })
        .expect(200);

      expect(res.body).toHaveProperty("transactions");
    });

    it("allows public access to /api/health", async () => {
      const res = await request(app)
        .get("/api/health")
        .expect(200);

      expect(res.body.status).toBe("ok");
    });

    it("allows public access to /api/auth/login", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      expect(res.body).toHaveProperty("accessToken");
    });
  });

  describe("Settings auto-initialization on register", () => {
    it("creates default settings for newly registered user", async () => {
      const tempEmail = `settings-test-${Date.now()}@example.com`;
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({ name: "Settings Test", email: tempEmail, password: TEST_PASSWORD });

      const { rows } = await pool.query(
        "SELECT * FROM user_settings WHERE user_id = $1",
        [regRes.body.user.id]
      );

      expect(rows.length).toBe(1);
      expect(rows[0].currency).toBe("INR");
      expect(rows[0].theme).toBe("system");

      await pool.query("DELETE FROM users WHERE email = $1", [tempEmail]);
    });
  });
});
