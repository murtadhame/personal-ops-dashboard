import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";

// Health journal: water, steps, weight, sleep, mood, free notes.
export async function healthRoutes(app: FastifyInstance) {
  app.post("/api/health", async (req) => {
    const b = req.body as any;
    return one(
      `insert into health_logs(kind, value, unit, note, source)
       values ($1,$2,$3,$4,coalesce($5,'manual')) returning *`,
      [b.kind, b.value ?? null, b.unit ?? null, b.note ?? null, b.source]
    );
  });

  app.get("/api/health", async () =>
    query("select * from health_logs order by logged_at desc limit 100"));

  // Today summary + yesterday steps for comparison
  app.get("/api/health/today", async () => {
    const today = await query<any>(
      `select kind, sum(value) as total, max(unit) as unit
       from health_logs where logged_on=current_date group by kind`
    );
    const m: Record<string, { total: number; unit: string }> = {};
    for (const r of today) m[r.kind] = { total: Number(r.total), unit: r.unit };

    const ySteps = await one<{ total: number }>(
      "select coalesce(sum(value),0)::int as total from health_logs where kind='steps' and logged_on=current_date-1"
    ).catch(() => ({ total: 0 }));

    const recent = await query<any>(
      "select * from health_logs order by logged_at desc limit 12"
    );

    return {
      water_ml: m.water?.total ?? 0,
      steps: m.steps?.total ?? 0,
      steps_yesterday: ySteps?.total ?? 0,
      weight: m.weight?.total ?? null,
      mood: null,
      recent,
    };
  });
}
