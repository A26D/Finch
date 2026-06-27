import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
