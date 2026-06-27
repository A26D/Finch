import { Router } from "express";
import pool from "../db.js";
import { validate } from "../middleware/validate.js";
import { enqueueDashboardRecompute } from "../jobs/jobQueue.js";

const router = Router();

const createSchema = {
  account_id: { required: true, type: "uuid" },
  category_id: { type: "uuid" },
  amount: { required: true, type: "number" },
  date: { required: true, type: "date" },
  description: { maxLength: 500 },
  payment_method: { maxLength: 50 },
};

const updateSchema = {
  account_id: { type: "uuid" },
  category_id: { type: "uuid" },
  amount: { type: "number" },
  date: { type: "date" },
  description: { maxLength: 500 },
  payment_method: { maxLength: 50 },
};

// GET /api/transactions — list with filters + pagination
router.get("/", async (req, res) => {
  try {
    const {
      account_id,
      category_id,
      start_date,
      end_date,
      page = 1,
      limit = 20,
    } = req.query;

    const conditions = ["t.user_id = $1"];
    const params = [req.user.id];
    let idx = 2;

    if (account_id) {
      conditions.push(`t.account_id = $${idx++}`);
      params.push(account_id);
    }
    if (category_id) {
      conditions.push(`t.category_id = $${idx++}`);
      params.push(category_id);
    }
    if (start_date) {
      conditions.push(`t.date >= $${idx++}`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`t.date <= $${idx++}`);
      params.push(end_date);
    }

    const offset = (Number(page) - 1) * Number(limit);
    const where = conditions.join(" AND ");

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions t WHERE ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT t.*, c.name AS category_name, a.name AS account_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN accounts a ON a.id = t.account_id
       WHERE ${where}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, Number(limit), offset]
    );

    res.json({
      transactions: dataResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("GET /transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// GET /api/transactions/:id — get one
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT t.*, c.name AS category_name, a.name AS account_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN accounts a ON a.id = t.account_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("GET /transactions/:id error:", err);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

// POST /api/transactions — create
router.post("/", async (req, res) => {
  try {
    const errors = validate(createSchema, req.body);
    if (errors) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const { account_id, category_id, amount, date, description, payment_method } =
      req.body;

    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, account_id, category_id, amount, date, description, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, account_id, category_id || null, amount, date, description || null, payment_method || null]
    );

    res.status(201).json(rows[0]);
    enqueueDashboardRecompute(req.user.id, "transaction_created").catch(() => {});
  } catch (err) {
    console.error("POST /transactions error:", err);
    if (err.code === "23503") {
      return res.status(400).json({ error: "Referenced user, account, or category does not exist" });
    }
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// PUT /api/transactions/:id — partial update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const errors = validate(updateSchema, req.body);
    if (errors) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const existing = await pool.query("SELECT * FROM transactions WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (!existing.rows.length) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const fields = ["account_id", "category_id", "amount", "date", "description", "payment_method"];
    const setClauses = [];
    const params = [];
    let idx = 1;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        setClauses.push(`${field} = $${idx++}`);
        params.push(req.body[field] === "" ? null : req.body[field]);
      }
    }

    if (!setClauses.length) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE transactions SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );

    res.json(rows[0]);
    enqueueDashboardRecompute(existing.rows[0].user_id, "transaction_updated").catch(() => {});
  } catch (err) {
    console.error("PUT /transactions/:id error:", err);
    if (err.code === "23503") {
      return res.status(400).json({ error: "Referenced account or category does not exist" });
    }
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// DELETE /api/transactions/:id — delete
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted", transaction: rows[0] });
    enqueueDashboardRecompute(rows[0].user_id, "transaction_deleted").catch(() => {});
  } catch (err) {
    console.error("DELETE /transactions/:id error:", err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
