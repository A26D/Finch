import { Router } from "express";
import * as aiInsightService from "../services/aiInsightService.js";

const router = Router();

// GET /api/ai/insights — Full insight pipeline result
router.get("/insights", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await aiInsightService.generateInsights(userId);
    // Strip raw transactions from the response for API efficiency
    const { context, ...payload } = result;
    res.json(payload);
  } catch (err) {
    console.error("GET /ai/insights error:", err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// GET /api/ai/dashboard — Short insight summary for dashboard embedding
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await aiInsightService.getDashboardInsights(userId);
    res.json(summary);
  } catch (err) {
    console.error("GET /ai/dashboard error:", err);
    res.status(500).json({ error: "Failed to generate dashboard insights" });
  }
});

export default router;
