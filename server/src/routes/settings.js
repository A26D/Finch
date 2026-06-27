import { Router } from "express";
import { ZodError } from "zod";
import * as settingsService from "../services/settingsService.js";
import { enqueueDashboardRecompute } from "../jobs/jobQueue.js";

const router = Router();

// GET /api/settings
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await settingsService.getSettings(userId);
    res.json(settings);
  } catch (err) {
    console.error("GET /settings error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/settings
router.put("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const parsed = settingsService.updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues,
      });
    }
    const settings = await settingsService.updateSettings(userId, parsed.data);
    await enqueueDashboardRecompute(userId, "settings_updated");
    res.json(settings);
  } catch (err) {
    console.error("PUT /settings error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// POST /api/settings/reset
router.post("/reset", async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await settingsService.resetSettings(userId);
    await enqueueDashboardRecompute(userId, "settings_reset");
    res.json(settings);
  } catch (err) {
    console.error("POST /settings/reset error:", err);
    res.status(500).json({ error: "Failed to reset settings" });
  }
});

export default router;
