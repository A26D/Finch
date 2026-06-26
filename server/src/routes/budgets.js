import { Router } from "express";
import pool from "../db.js";
import {
  getBudgetsWithProgress,
  enrichBudgetWithProgress,
  validateBudgetCategories,
  createBudgetSchema,
  updateBudgetSchema,
} from "../services/budgetService.js";
import { ZodError } from "zod";

const router = Router();

// GET /api/budgets?user_id=X — list active budgets with progress
router.get("/", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const budgets = await getBudgetsWithProgress(user_id, pool);
    res.json(budgets);
  } catch (err) {
    console.error("GET /budgets error:", err);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

// GET /api/budgets/:id — single budget detail
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.* FROM budgets b WHERE b.id = $1 AND b.archived_at IS NULL`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Budget not found" });

    const { rows: cats } = await pool.query(
      `SELECT c.id, c.name FROM budget_categories bc
       JOIN categories c ON c.id = bc.category_id
       WHERE bc.budget_id = $1`,
      [req.params.id]
    );
    rows[0].categories = cats;
    rows[0].categoryIds = cats.map((c) => c.id);

    const enriched = await enrichBudgetWithProgress(rows[0], pool);
    res.json(enriched);
  } catch (err) {
    console.error("GET /budgets/:id error:", err);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
});

// POST /api/budgets — create
router.post("/", async (req, res) => {
  let data;
  try {
    data = createBudgetSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }
    throw err;
  }

  const { user_id, name, type, amount, period, start_date, end_date, rollover_enabled, strictness, alert_threshold, category_ids } = data;

  try {
    // Validate categories
    if (end_date && end_date <= start_date) {
      return res.status(400).json({ error: "end_date must be after start_date" });
    }

    if (category_ids && category_ids.length) {
      const valid = await validateBudgetCategories(category_ids, user_id, pool);
      if (!valid) {
        return res.status(400).json({ error: "One or more category IDs are invalid or don't belong to the user" });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO budgets (user_id, name, type, amount, period, start_date, end_date, rollover_enabled, strictness, alert_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [user_id, name, type, amount, period, start_date, end_date || null, rollover_enabled, strictness, alert_threshold]
    );

    const budget = rows[0];

    // Insert category links
    if (category_ids && category_ids.length) {
      for (const cid of category_ids) {
        await pool.query(
          `INSERT INTO budget_categories (budget_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [budget.id, cid]
        );
      }
    }

    budget.categories = category_ids || [];
    res.status(201).json(budget);
  } catch (err) {
    console.error("POST /budgets error:", err);
    if (err.code === "23503") {
      return res.status(400).json({ error: "Referenced user or category does not exist" });
    }
    res.status(500).json({ error: "Failed to create budget" });
  }
});

// PUT /api/budgets/:id — update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check exists
    const { rows: existing } = await pool.query(
      `SELECT * FROM budgets WHERE id = $1 AND archived_at IS NULL`,
      [id]
    );
    if (!existing.length) return res.status(404).json({ error: "Budget not found" });

    const data = updateBudgetSchema.parse(req.body);

    // Build SET clause dynamically
    const fields = [];
    const params = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (key === "category_ids") continue;
      fields.push(`${key} = $${idx++}`);
      params.push(value === undefined ? null : value);
    }

    if (fields.length) {
      params.push(id);
      await pool.query(
        `UPDATE budgets SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        params
      );
    }

    // Update category links
    if (data.category_ids !== undefined) {
      await pool.query(`DELETE FROM budget_categories WHERE budget_id = $1`, [id]);
      for (const cid of data.category_ids) {
        await pool.query(
          `INSERT INTO budget_categories (budget_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, cid]
        );
      }
    }

    // Fetch updated
    const { rows: updated } = await pool.query(
      `SELECT * FROM budgets WHERE id = $1`,
      [id]
    );

    const { rows: cats } = await pool.query(
      `SELECT c.id, c.name FROM budget_categories bc
       JOIN categories c ON c.id = bc.category_id
       WHERE bc.budget_id = $1`,
      [id]
    );
    updated[0].categories = cats;
    updated[0].categoryIds = cats.map((c) => c.id);

    const enriched = await enrichBudgetWithProgress(updated[0], pool);
    res.json(enriched);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }
    console.error("PUT /budgets/:id error:", err);
    if (err.code === "23503") {
      return res.status(400).json({ error: "Referenced category does not exist" });
    }
    res.status(500).json({ error: "Failed to update budget" });
  }
});

// DELETE /api/budgets/:id — soft delete
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE budgets SET archived_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND archived_at IS NULL
       RETURNING *`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: "Budget not found" });

    res.json({ message: "Budget archived", budget: rows[0] });
  } catch (err) {
    console.error("DELETE /budgets/:id error:", err);
    res.status(500).json({ error: "Failed to archive budget" });
  }
});

export default router;
