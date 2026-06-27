import { Router } from "express";
import {
  listNotifications,
  markRead,
  markAllRead,
  archive,
  getUnreadCount,
} from "../services/notificationService.js";

const router = Router();

// GET /api/notifications
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, offset, type, severity } = req.query;
    const result = await listNotifications(userId, { limit, offset, type, severity });
    res.json(result);
  } catch (err) {
    console.error("GET /notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadCount(userId);
    res.json({ unread: count });
  } catch (err) {
    console.error("GET /notifications/unread-count error:", err);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

// POST /api/notifications/:id/read
router.post("/:id/read", async (req, res) => {
  try {
    const userId = req.user.id;
    const notification = await markRead(req.params.id, userId);
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (err) {
    console.error("POST /notifications/:id/read error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// POST /api/notifications/read-all
router.post("/read-all", async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await markAllRead(userId);
    res.json({ markedRead: count });
  } catch (err) {
    console.error("POST /notifications/read-all error:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const notification = await archive(req.params.id, userId);
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Notification archived", notification });
  } catch (err) {
    console.error("DELETE /notifications/:id error:", err);
    res.status(500).json({ error: "Failed to archive notification" });
  }
});

export default router;
