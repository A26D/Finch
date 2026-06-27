import { Router } from "express";
import pool from "../db.js";
import {
  getGoalsWithProgress,
  enrichGoalWithProgress,
  getLinkedBudgetsForGoal,
  contributeToGoal,
  validateCurrentSavedAmount,
  createGoalSchema,
  updateGoalSchema,
  contributeSchema,
} from "../services/goalService.js";
import { ZodError } from "zod";
import { enqueueDashboardRecompute } from "../jobs/jobQueue.js";

const router = Router();

// GET /api/goals — list active goals with progress
router.get("/", async (req, res) => {
  try {
    const goals = await getGoalsWithProgress(req.user.id, pool);
    res.json(goals);
  } catch (err) {
    console.error("GET /goals error:", err);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// GET /api/goals/:id — single goal detail with linked budgets
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM goals WHERE id = $1 AND user_id = $2 AND archived_at IS NULL`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Goal not found" });

    const goal = enrichGoalWithProgress(rows[0]);
    goal.linkedBudgets = await getLinkedBudgetsForGoal(req.params.id, pool);

    res.json(goal);
  } catch (err) {
    console.error("GET /goals/:id error:", err);
    res.status(500).json({ error: "Failed to fetch goal" });
  }
});

// POST /api/goals — create
router.post("/", async (req, res) => {
  let data;
  try {
    data = createGoalSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }
    throw err;
  }

  const errMsg = validateCurrentSavedAmount(data.current_saved_amount, data.target_amount);
  if (errMsg) {
    return res.status(400).json({ error: "Validation failed", details: [{ message: errMsg, path: ["current_saved_amount"] }] });
  }

  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `INSERT INTO goals (user_id, name, target_amount, current_saved_amount, target_date, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, data.name, data.target_amount, data.current_saved_amount, data.target_date || null, data.priority, data.status]
    );

    res.status(201).json(enrichGoalWithProgress(rows[0]));
    enqueueDashboardRecompute(userId, "goal_created").catch(() => {});
  } catch (err) {
    console.error("POST /goals error:", err);
    if (err.code === "23503") {
      return res.status(400).json({ error: "Referenced user does not exist" });
    }
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// PUT /api/goals/:id — update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rows: existing } = await pool.query(
      `SELECT * FROM goals WHERE id = $1 AND user_id = $2 AND archived_at IS NULL`,
      [id, req.user.id]
    );
    if (!existing.length) return res.status(404).json({ error: "Goal not found" });

    const data = updateGoalSchema.parse(req.body);

    // Validate current_saved_amount vs target_amount
    const currentSaved = data.current_saved_amount ?? Number(existing[0].current_saved_amount);
    const targetAmount = data.target_amount ?? Number(existing[0].target_amount);
    const errMsg = validateCurrentSavedAmount(currentSaved, targetAmount);
    if (errMsg) {
      return res.status(400).json({ error: "Validation failed", details: [{ message: errMsg, path: ["current_saved_amount"] }] });
    }

    const fields = [];
    const params = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${idx++}`);
      params.push(value === undefined ? null : value);
    }

    if (fields.length) {
      // Auto-set status to completed if target is reached
      fields.push(`status = CASE WHEN current_saved_amount >= target_amount THEN 'completed' ELSE status END`);
      params.push(id);
      await pool.query(
        `UPDATE goals SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        params
      );
    }

    // Fetch updated
    const { rows: updated } = await pool.query(
      `SELECT * FROM goals WHERE id = $1`,
      [id]
    );

    res.json(enrichGoalWithProgress(updated[0]));
    enqueueDashboardRecompute(existing[0].user_id, "goal_updated").catch(() => {});
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }
    console.error("PUT /goals/:id error:", err);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// DELETE /api/goals/:id — soft delete
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE goals SET archived_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
       RETURNING *`,
      [id, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: "Goal not found" });

    res.json({ message: "Goal archived", goal: rows[0] });
    enqueueDashboardRecompute(rows[0].user_id, "goal_deleted").catch(() => {});
  } catch (err) {
    console.error("DELETE /goals/:id error:", err);
    res.status(500).json({ error: "Failed to archive goal" });
  }
});

// POST /api/goals/:id/contribute — add to current_saved_amount
router.post("/:id/contribute", async (req, res) => {
  let data;
  try {
    data = contributeSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }
    throw err;
  }

  try {
    const goal = await contributeToGoal(req.params.id, data.amount, pool);

    if (!goal) return res.status(404).json({ error: "Goal not found or archived" });

    res.json(enrichGoalWithProgress(goal));
    enqueueDashboardRecompute(goal.user_id, "goal_contributed").catch(() => {});
  } catch (err) {
    console.error("POST /goals/:id/contribute error:", err);
    res.status(500).json({ error: "Failed to contribute to goal" });
  }
});

export default router;
