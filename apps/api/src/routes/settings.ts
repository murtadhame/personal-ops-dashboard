import type { FastifyInstance } from "fastify";
import { query } from "../db.js";

// Generic key/value settings (app_settings). Single user.
export async function settingsRoutes(app: FastifyInstance) {
  // GET /api/settings -> { key: value, ... }
  app.get("/api/settings", async () => {
    const rows = await query<{ key: string; value: any }>("select key, value from app_settings");
    const out: Record<string, any> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  });

  // PATCH /api/settings  { key: value, ... } -> upserts each
  app.patch("/api/settings", async (req) => {
    const body = (req.body ?? {}) as Record<string, any>;
    for (const [key, value] of Object.entries(body)) {
      await query(
        `insert into app_settings(key, value) values ($1, $2::jsonb)
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [key, JSON.stringify(value)]
      );
    }
    const rows = await query<{ key: string; value: any }>("select key, value from app_settings");
    const out: Record<string, any> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  });
}
