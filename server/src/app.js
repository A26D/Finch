import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import pool from "./db.js";
import auth from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import transactionsRouter from "./routes/transactions.js";
import accountsRouter from "./routes/accounts.js";
import categoriesRouter from "./routes/categories.js";
import budgetsRouter from "./routes/budgets.js";
import goalsRouter from "./routes/goals.js";
import recurringTransactionsRouter from "./routes/recurringTransactions.js";
import reportsRouter from "./routes/reports.js";
import dashboardRouter from "./routes/dashboard.js";
import notificationsRouter from "./routes/notifications.js";
import settingsRouter from "./routes/settings.js";
import aiRouter from "./routes/ai.js";
import chatRouter from "./routes/chat.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use("/api/auth", authRouter);

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

// Protected routes — auth middleware
app.use("/api", auth);

app.use("/api/transactions", transactionsRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/recurring-transactions", recurringTransactionsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/chat", chatRouter);

export default app;
