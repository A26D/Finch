import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const { rows } = await pool.query(
      "SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name",
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
