import { Router } from "express";
import pool from "../db.js";
import { ZodError } from "zod";
import { validate } from "../middleware/validation.js";
import {
  getAllActive,
  getById,
  create,
  update,
  archive,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  runAllDue,
  createRecurringSchema,
  updateRecurringSchema,
  runDueSchema,
  validateStartBeforeEnd,
} from "../services/recurringTransactionService.js";
import { enqueueDashboardRecompute } from "../jobs/jobQueue.js";

const router = Router();

// GET /api/recurring-transactions — list active
router.get("/", async (req, res) => {
  try {
    const items = await getAllActive(req.user.id, pool);
    res.json(items);
  } catch (err) {
    console.error("GET /recurring-transactions error:", err);
    res.status(500).json({ error: "Failed to fetch recurring transactions" });
  }
});

// GET /api/recurring-transactions/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await getById(req.params.id, req.user.id, pool);
    if (!item) return res.status(404).json({ error: "Recurring transaction not found" });
    res.json(item);
  } catch (err) {
    console.error("GET /recurring-transactions/:id error:", err);
    res.status(500).json({ error: "Failed to fetch recurring transaction" });
  }
});

// POST /api/recurring-transactions — create
router.post("/", validate(createRecurringSchema), async (req, res) => {
  try {
    const data = { ...req.validatedBody, user_id: req.user.id };

    const dateErr = validateStartBeforeEnd(data.start_date, data.end_date);
    if (dateErr) {
      return res.status(400).json({ error: "Validation failed", details: [{ message: dateErr, path: ["end_date"] }] });
    }

    const item = await create(data, pool);
    res.status(201).json(item);
    enqueueDashboardRecompute(req.user.id, "recurring_created").catch(() => {});
  } catch (err) {
    console.error("POST /recurring-transactions error:", err);
    res.status(500).json({ error: "Failed to create recurring transaction" });
  }
});

// PUT /api/recurring-transactions/:id — update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getById(id, req.user.id, pool);
    if (!existing) return res.status(404).json({ error: "Recurring transaction not found" });

    const data = updateRecurringSchema.parse(req.body);

    const dateErr = validateStartBeforeEnd(
      data.start_date || existing.start_date,
      data.end_date !== undefined ? data.end_date : existing.end_date
    );
    if (dateErr) {
      return res.status(400).json({ error: "Validation failed", details: [{ message: dateErr, path: ["end_date"] }] });
    }

    const updated = await update(id, data, pool);
    if (!updated) return res.status(404).json({ error: "Recurring transaction not found" });
    res.json(updated);
    enqueueDashboardRecompute(existing.user_id, "recurring_updated").catch(() => {});
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }
    console.error("PUT /recurring-transactions/:id error:", err);
    res.status(500).json({ error: "Failed to update recurring transaction" });
  }
});

// DELETE /api/recurring-transactions/:id — soft delete
router.delete("/:id", async (req, res) => {
  try {
    const existing = await getById(req.params.id, req.user.id, pool);
    if (!existing) return res.status(404).json({ error: "Recurring transaction not found" });

    const item = await archive(req.params.id, pool);
    if (!item) return res.status(404).json({ error: "Recurring transaction not found" });
    res.json({ message: "Recurring transaction archived" });
    enqueueDashboardRecompute(existing.user_id, "recurring_deleted").catch(() => {});
  } catch (err) {
    console.error("DELETE /recurring-transactions/:id error:", err);
    res.status(500).json({ error: "Failed to archive recurring transaction" });
  }
});

// POST /api/recurring-transactions/:id/pause
router.post("/:id/pause", async (req, res) => {
  try {
    const existing = await getById(req.params.id, req.user.id, pool);
    if (!existing) return res.status(404).json({ error: "Recurring transaction not found" });

    const item = await pauseRecurringTransaction(req.params.id, pool);
    if (!item) return res.status(404).json({ error: "Recurring transaction not found or already paused" });
    res.json(item);
    enqueueDashboardRecompute(existing.user_id, "recurring_paused").catch(() => {});
  } catch (err) {
    console.error("POST /recurring-transactions/:id/pause error:", err);
    res.status(500).json({ error: "Failed to pause recurring transaction" });
  }
});

// POST /api/recurring-transactions/:id/resume
router.post("/:id/resume", async (req, res) => {
  try {
    const existing = await getById(req.params.id, req.user.id, pool);
    if (!existing) return res.status(404).json({ error: "Recurring transaction not found" });

    const item = await resumeRecurringTransaction(req.params.id, pool);
    if (!item) return res.status(404).json({ error: "Recurring transaction not found or already active" });
    res.json(item);
    enqueueDashboardRecompute(existing.user_id, "recurring_resumed").catch(() => {});
  } catch (err) {
    console.error("POST /recurring-transactions/:id/resume error:", err);
    res.status(500).json({ error: "Failed to resume recurring transaction" });
  }
});

// POST /api/recurring-transactions/run-due — process all due
router.post("/run-due", async (req, res) => {
  try {
    const data = runDueSchema.safeParse(req.body);
    const referenceDate = data.success ? data.data.reference_date : undefined;

    const created = await runAllDue(referenceDate, pool);
    res.json({ processed: created.length, transactions: created });
  } catch (err) {
    console.error("POST /recurring-transactions/run-due error:", err);
    res.status(500).json({ error: "Failed to process due transactions" });
  }
});

export default router;
