import { Router } from "express";
import { getDashboardData } from "../services/dashboardService.js";
import { getUnreadCount } from "../services/notificationService.js";
import * as cacheService from "../services/cacheService.js";
import { getSettings } from "../services/settingsService.js";
import { getDashboardInsights } from "../services/aiInsightService.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `dashboard:v2:${userId}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [userSettings, unreadCount, aiInsights] = await Promise.all([
      getSettings(userId),
      getUnreadCount(userId),
      getDashboardInsights(userId),
    ]);
    const data = await getDashboardData(userId, userSettings);
    const payload = {
      ...data,
      notificationsSummary: { unread: unreadCount, critical: 0 },
      aiInsightSlot: aiInsights,
    };
    await cacheService.set(cacheKey, payload, 3600);
    res.json(payload);
  } catch (err) {
    console.error("GET /dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
