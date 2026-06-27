import express from "express";
import cors from "cors";
import "dotenv/config";
import pool from "./db.js";
import transactionsRouter from "./routes/transactions.js";
import accountsRouter from "./routes/accounts.js";
import categoriesRouter from "./routes/categories.js";
import budgetsRouter from "./routes/budgets.js";
import goalsRouter from "./routes/goals.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/transactions", transactionsRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/goals", goalsRouter);

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

export default app;
