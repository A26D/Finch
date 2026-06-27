import "dotenv/config";
import { startWorker as startRecomputeWorker } from "./jobs/recomputeDashboard.js";
import { createNotificationWorker } from "./jobs/sendNotification.js";

async function startAll() {
  await startRecomputeWorker();
  const notifWorker = createNotificationWorker();
  console.log("Notification worker started");

  process.on("SIGTERM", async () => {
    await notifWorker.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await notifWorker.close();
    process.exit(0);
  });
}

startAll().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
