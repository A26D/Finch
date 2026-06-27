import { Worker } from "bullmq";
import Redis from "ioredis";
import { createNotification } from "../services/notificationService.js";

// TODO(ai-push): Add push notification delivery (FCM/APNs) here.
// TODO(ai-email): Add email delivery here (SendGrid, SES).
// TODO(ai-sms): Add SMS delivery here (Twilio).
// TODO(ai-websocket): Add real-time WebSocket push here.

let connection = null;

function getConnection() {
  if (!connection) {
    const host = process.env.REDIS_HOST || "localhost";
    const port = Number(process.env.REDIS_PORT) || 6379;
    connection = new Redis({ host, port, maxRetriesPerRequest: null });
  }
  return connection;
}

export function createNotificationWorker() {
  const worker = new Worker(
    "notifications.send",
    async (job) => {
      const { userId, notification } = job.data;

      if (!userId || !notification || !notification.type || !notification.title) {
        throw new Error("Invalid notification payload: userId, type, and title are required");
      }

      console.log(`Notification worker: creating ${notification.type} for user ${userId}`);
      const result = await createNotification({
        user_id: userId,
        ...notification,
      });
      console.log(`Notification worker: ${notification.type} created (id=${result.id})`);
    },
    { connection: getConnection() }
  );

  worker.on("completed", (job) => {
    console.log(`Notification worker: job completed for user ${job.data.userId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Notification worker: job failed for user ${job.data.userId} - ${err.message}`);
  });

  return worker;
}
