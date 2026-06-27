import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../db.js";
import { initializeDefaults } from "./settingsService.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN_DAYS = 7;

function generateAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

function calculateRefreshExpiry() {
  return new Date(Date.now() + REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
}

export async function register({ name, email, password }) {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error("Email already registered"), { statusCode: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, password_hash]
  );

  const user = rows[0];

  await initializeDefaults(user.id);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = calculateRefreshExpiry();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, refreshToken, expiresAt]
  );

  return { user, accessToken, refreshToken, expiresAt };
}

export async function login({ email, password }) {
  const { rows } = await pool.query(
    "SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1",
    [email]
  );

  if (rows.length === 0) {
    throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
  }

  delete user.password_hash;

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = calculateRefreshExpiry();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, refreshToken, expiresAt]
  );

  return { user, accessToken, refreshToken, expiresAt };
}

export async function refresh(refreshToken) {
  const { rows } = await pool.query(
    `SELECT rt.*, u.id, u.name, u.email, u.created_at
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token = $1 AND rt.expires_at > NOW()`,
    [refreshToken]
  );

  if (rows.length === 0) {
    throw Object.assign(new Error("Invalid or expired refresh token"), { statusCode: 401 });
  }

  const row = rows[0];

  await pool.query("DELETE FROM refresh_tokens WHERE id = $1", [row.id]);

  const user = { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();
  const expiresAt = calculateRefreshExpiry();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, newRefreshToken, expiresAt]
  );

  return { user, accessToken, refreshToken: newRefreshToken, expiresAt };
}

export async function logout(refreshToken) {
  if (refreshToken) {
    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
  }
}

export async function getMe(userId) {
  const { rows } = await pool.query(
    "SELECT id, name, email, created_at FROM users WHERE id = $1",
    [userId]
  );

  if (rows.length === 0) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }

  return rows[0];
}
