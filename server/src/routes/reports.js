import { Router } from "express";
import {
  getSummary,
  getMonthlyReport,
  getYearlyReport,
  getCategoryReport,
  getCashFlowReport,
  getBudgetReport,
  getGoalReport,
  getRecurringReport,
  exportCSV,
  exportPDF,
} from "../services/reportService.js";
import { getSettings } from "../services/settingsService.js";

const router = Router();

function extractFilters(req) {
  return {
    start_date: req.query.start_date,
    end_date: req.query.end_date,
    category_id: req.query.category_id,
    account_id: req.query.account_id,
    type: req.query.type,
  };
}

// GET /api/reports/summary
router.get("/summary", async (req, res) => {
  try {
    const data = await getSummary(req.user.id, extractFilters(req));
    res.json(data);
  } catch (err) {
    console.error("GET /reports/summary error:", err);
    res.status(500).json({ error: "Failed to generate summary report" });
  }
});

// GET /api/reports/monthly
router.get("/monthly", async (req, res) => {
  try {
    const data = await getMonthlyReport(req.user.id, extractFilters(req));
    res.json(data);
  } catch (err) {
    console.error("GET /reports/monthly error:", err);
    res.status(500).json({ error: "Failed to generate monthly report" });
  }
});

// GET /api/reports/yearly
router.get("/yearly", async (req, res) => {
  try {
    const data = await getYearlyReport(req.user.id, extractFilters(req));
    res.json(data);
  } catch (err) {
    console.error("GET /reports/yearly error:", err);
    res.status(500).json({ error: "Failed to generate yearly report" });
  }
});

// GET /api/reports/categories
router.get("/categories", async (req, res) => {
  try {
    const data = await getCategoryReport(req.user.id, extractFilters(req));
    res.json(data);
  } catch (err) {
    console.error("GET /reports/categories error:", err);
    res.status(500).json({ error: "Failed to generate category report" });
  }
});

// GET /api/reports/cashflow
router.get("/cashflow", async (req, res) => {
  try {
    const data = await getCashFlowReport(req.user.id, extractFilters(req));
    res.json(data);
  } catch (err) {
    console.error("GET /reports/cashflow error:", err);
    res.status(500).json({ error: "Failed to generate cash flow report" });
  }
});

// GET /api/reports/budgets
router.get("/budgets", async (req, res) => {
  try {
    const data = await getBudgetReport(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("GET /reports/budgets error:", err);
    res.status(500).json({ error: "Failed to generate budget report" });
  }
});

// GET /api/reports/goals
router.get("/goals", async (req, res) => {
  try {
    const data = await getGoalReport(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("GET /reports/goals error:", err);
    res.status(500).json({ error: "Failed to generate goal report" });
  }
});

// GET /api/reports/recurring
router.get("/recurring", async (req, res) => {
  try {
    const data = await getRecurringReport(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("GET /reports/recurring error:", err);
    res.status(500).json({ error: "Failed to generate recurring report" });
  }
});

// GET /api/reports/export?format=csv
// GET /api/reports/export?format=pdf
router.get("/export", async (req, res) => {
  try {
    const userId = req.user.id;
    const userSettings = await getSettings(userId);
    const format = req.query.format || "csv";

    if (format === "csv") {
      const csv = await exportCSV(userId, extractFilters(req), userSettings);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="expense-report.csv"');
      return res.send(csv);
    }

    if (format === "pdf") {
      const html = await exportPDF(userId, extractFilters(req), userSettings);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }

    res.status(400).json({ error: "Unsupported export format. Use 'csv' or 'pdf'." });
  } catch (err) {
    console.error("GET /reports/export error:", err);
    res.status(500).json({ error: "Failed to export report" });
  }
});

export default router;
