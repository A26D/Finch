import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { processMessage } from "../services/chatService.js";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  message: { error: "Too many requests. Please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", chatLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: "Message must be 1000 characters or less" });
    }

    const reply = await processMessage(message.trim(), req.user.id);
    res.json({ reply });
  } catch (err) {
    if (err.message === "ANTHROPIC_API_KEY is not configured") {
      return res.status(503).json({ error: "AI chat is not configured. Please set ANTHROPIC_API_KEY." });
    }
    console.error("POST /chat error:", err);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

export default router;
