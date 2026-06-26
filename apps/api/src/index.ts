import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { pool } from "./db.js";
import { captureRoutes } from "./routes/capture.js";
import { domainRoutes } from "./routes/domains.js";
import { projectRoutes } from "./routes/projects.js";
import { taskRoutes } from "./routes/tasks.js";
import { todayRoutes } from "./routes/today.js";
import { notificationRoutes } from "./routes/notifications.js";
import { calendarRoutes, syncAllCalendars } from "./routes/calendar.js";
import { settingsRoutes } from "./routes/settings.js";
import { routineRoutes } from "./routes/routines.js";
import { moduleRoutes } from "./routes/modules.js";
import { briefingRoutes } from "./routes/briefing.js";
import { askRoutes } from "./routes/ask.js";
import { healthRoutes } from "./routes/health.js";
import { gmailRoutes } from "./routes/gmail.js";

const app = Fastify({
  logger: { transport: { target: "pino-pretty", options: { colorize: true } } },
});

await app.register(cors, {
  origin: [env.appBaseUrl, "http://localhost:3000"],
  credentials: true,
});

// Tolerate empty JSON bodies (no-body POSTs like star/complete/toggle).
app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
  const s = (body as string) ?? "";
  if (s.trim().length === 0) return done(null, {});
  try {
    done(null, JSON.parse(s));
  } catch (err) {
    done(err as Error);
  }
});

app.get("/health", async () => {
  try {
    await pool.query("select 1");
    return { ok: true, db: "up", timezone: env.timezone };
  } catch (e: any) {
    return { ok: false, db: "down", error: e.message };
  }
});

await app.register(captureRoutes);
await app.register(domainRoutes);
await app.register(projectRoutes);
await app.register(taskRoutes);
await app.register(todayRoutes);
await app.register(notificationRoutes);
await app.register(calendarRoutes);
await app.register(settingsRoutes);
await app.register(routineRoutes);
await app.register(moduleRoutes);
await app.register(briefingRoutes);
await app.register(askRoutes);
await app.register(healthRoutes);
await app.register(gmailRoutes);

// Calendar sync every 15 minutes (guide: don't sync on every page load).
const FIFTEEN_MIN = 15 * 60 * 1000;
setInterval(() => {
  syncAllCalendars(app).catch((e) => app.log.error(e));
}, FIFTEEN_MIN);

try {
  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(`API listening on ${env.apiBaseUrl}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
