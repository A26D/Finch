import { Router } from "express";
import * as authService from "../services/authService.js";
import auth from "../middleware/auth.js";

const router = Router();

function setTokenCookies(res, { accessToken, refreshToken, expiresAt }) {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const result = await authService.register({ name, email, password });
    setTokenCookies(res, result);

    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ error: err.message });
    }
    console.error("POST /auth/register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await authService.login({ email, password });
    setTokenCookies(res, result);

    res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ error: err.message });
    }
    console.error("POST /auth/login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(refreshToken);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/auth" });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("POST /auth/logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    console.error("GET /auth/me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "Refresh token not provided" });
    }

    const result = await authService.refresh(token);
    setTokenCookies(res, result);

    res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ error: err.message });
    }
    console.error("POST /auth/refresh error:", err);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

export default router;
