import { Queue } from "bullmq";
import Redis from "ioredis";

// TODO(ai-forecast):
// Create an ai.forecast queue.
// Trigger after dashboard recompute to update ML forecasts.

// TODO(ai-anomaly):
// Create an ai.anomaly queue.
// Run anomaly detection on new transaction batches.

// TODO(ai-categorize):
// Create an ai.categorize queue.
// Async categorization of uncategorized transactions.

// TODO(reports-generate):
// Create a reports.generate queue for heavy report generation
// off the request path.

let connection = null;

function getConnection() {
  if (!connection) {
    const host = process.env.REDIS_HOST || "localhost";
    const port = Number(process.env.REDIS_PORT) || 6379;
    connection = new Redis({ host, port, maxRetriesPerRequest: null });
  }
  return connection;
}

let dashboardQueue = null;
let notificationQueue = null;

function getQueue(name) {
  if (name === "dashboard.recompute") {
    if (!dashboardQueue) {
      dashboardQueue = new Queue("dashboard.recompute", {
        connection: getConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        },
      });
    }
    return dashboardQueue;
  }

  if (name === "notifications.send") {
    if (!notificationQueue) {
      notificationQueue = new Queue("notifications.send", {
        connection: getConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        },
      });
    }
    return notificationQueue;
  }

  throw new Error(`Unknown queue: ${name}`);
}

export async function enqueueDashboardRecompute(userId, reason) {
  const queue = getQueue("dashboard.recompute");
  await queue.add(
    "recompute",
    { userId, reason, triggeredAt: new Date().toISOString() },
    { removeOnComplete: 100, removeOnFail: 50 }
  );
}

export async function enqueueNotification(userId, notification) {
  const queue = getQueue("notifications.send");
  await queue.add(
    "send",
    { userId, notification, triggeredAt: new Date().toISOString() },
    { removeOnComplete: 100, removeOnFail: 50 }
  );
}
