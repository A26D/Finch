import { Worker } from "bullmq";
import Redis from "ioredis";
import pool from "../db.js";
import { getDashboardData } from "../services/dashboardService.js";
import { getBudgetsWithProgress } from "../services/budgetService.js";
import { getGoalsWithProgress } from "../services/goalService.js";
import { getAllActive } from "../services/recurringTransactionService.js";
import * as cacheService from "../services/cacheService.js";
import * as jobQueue from "./jobQueue.js";
import { detectAll } from "../utils/notificationDetector.js";
import { getSettings } from "../services/settingsService.js";

const CACHE_TTL = 3600;
const SNAPSHOT_TTL = 3600;

let connection = null;

function getConnection() {
  if (!connection) {
    const host = process.env.REDIS_HOST || "localhost";
    const port = Number(process.env.REDIS_PORT) || 6379;
    connection = new Redis({ host, port, maxRetriesPerRequest: null });
  }
  return connection;
}

export async function buildSnapshot(userId) {
  const [budgets, goals, recurring] = await Promise.all([
    getBudgetsWithProgress(userId, pool),
    getGoalsWithProgress(userId, pool),
    getAllActive(userId, pool),
  ]);

  const recurringDue = recurring
    .filter((r) => r.type === "expense" && r.status === "active")
    .map((r) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
      nextRunDate: r.next_run_date,
    }));

  return {
    budgets: budgets.map((b) => ({
      id: b.id,
      name: b.name,
      amount: Number(b.amount),
      spent: Number(b.spent || 0),
      percentUsed: Number(b.percentUsed || 0),
      alert_threshold: Number(b.alert_threshold || 0.8),
    })),
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      target_amount: Number(g.target_amount),
      current_saved_amount: Number(g.current_saved_amount),
      progress: Number(g.progress || 0),
      status: g.status,
      target_date: g.target_date,
    })),
    recurringDue,
  };
}

// TODO(ai-forecast):
// After dashboard recompute, enqueue ai.forecast with userId
// to update time-series spending predictions.

export function createRecomputeWorker() {
  const worker = new Worker(
    "dashboard.recompute",
    async (job) => {
      const { userId } = job.data;
      console.log(`Job started: recompute dashboard for user ${userId}`);

      // Read user settings for configurable thresholds and formatting
      const userSettings = await getSettings(userId);

      // Read previous snapshot for diff comparison
      const oldSnapshot = await cacheService.get(`dashboard:snapshot:v1:${userId}`);

      // Compute new dashboard data with user settings applied
      const data = await getDashboardData(userId, userSettings);

      // Compute new snapshot with detailed budget/goal data
      const newSnapshot = await buildSnapshot(userId);

      // Detect threshold crossings
      const notifications = detectAll(oldSnapshot, newSnapshot, userSettings);

      // Enqueue detected notifications
      for (const notification of notifications) {
        await jobQueue.enqueueNotification(userId, notification);
      }

      // Query actual unread and critical counts from DB
      const { rows: unreadRows } = await pool.query(
        `SELECT COUNT(*) FROM notifications
         WHERE user_id = $1 AND read_at IS NULL AND archived_at IS NULL`,
        [userId]
      );
      const { rows: criticalRows } = await pool.query(
        `SELECT COUNT(*) FROM notifications
         WHERE user_id = $1 AND severity = 'critical' AND read_at IS NULL AND archived_at IS NULL`,
        [userId]
      );

      const notificationsSummary = {
        unread: parseInt(unreadRows[0].count, 10),
        critical: parseInt(criticalRows[0].count, 10),
      };

      // Update dashboard API cache
      const payload = { ...data, notificationsSummary };
      await cacheService.set(`dashboard:v2:${userId}`, payload, CACHE_TTL);

      // Update snapshot cache
      await cacheService.set(`dashboard:snapshot:v1:${userId}`, newSnapshot, SNAPSHOT_TTL);

      if (notifications.length > 0) {
        console.log(`Job completed: ${notifications.length} notifications generated for user ${userId}`);
      } else {
        console.log(`Job completed: dashboard recomputed for user ${userId}`);
      }
    },
    { connection: getConnection() }
  );

  worker.on("completed", (job) => {
    console.log(`Job finished: dashboard recomputed for user ${job.data.userId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job failed: dashboard recompute for user ${job.data.userId} - ${err.message}`);
  });

  return worker;
}

export async function startWorker() {
  const worker = createRecomputeWorker();
  console.log("Dashboard recompute worker started");

  process.on("SIGTERM", async () => {
    await worker.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await worker.close();
    process.exit(0);
  });
}
