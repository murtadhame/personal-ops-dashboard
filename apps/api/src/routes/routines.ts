import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";

// Compute current streak (consecutive days ending today or yesterday) from
// a descending list of completed dates (YYYY-MM-DD strings).
function streakFrom(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  // allow today not-yet-done: start from today, but if today missing, start yesterday
  const todayStr = d.toISOString().slice(0, 10);
  if (!set.has(todayStr)) d.setDate(d.getDate() - 1);
  for (;;) {
    const s = d.toISOString().slice(0, 10);
    if (set.has(s)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}

export type RoutineToday = {
  groups: { part: string; items: any[] }[];
  done: number;
  total: number;
};

/** Today's routines grouped by part-of-day, with completion + streak. */
export async function getRoutinesToday(): Promise<RoutineToday> {
  const routines = await query<any>(
    `select r.*,
       exists(select 1 from routine_completions c
              where c.routine_id = r.id and c.completed_on = current_date) as done_today
     from routines r where r.active = true order by r.sort_order, r.created_at`
  );
  // streaks: pull recent completions per routine
  const comps = await query<{ routine_id: string; completed_on: string }>(
    `select routine_id, to_char(completed_on,'YYYY-MM-DD') as completed_on
     from routine_completions
     where completed_on > current_date - interval '120 days'
     order by completed_on desc`
  );
  const byRoutine: Record<string, string[]> = {};
  for (const c of comps) (byRoutine[c.routine_id] ??= []).push(c.completed_on);

  const order = ["morning", "afternoon", "evening", "anytime"];
  const enriched = routines.map((r) => ({
    ...r,
    streak: streakFrom(byRoutine[r.id] ?? []),
  }));
  const groups = order
    .map((part) => ({ part, items: enriched.filter((r) => r.part_of_day === part) }))
    .filter((g) => g.items.length > 0);

  const done = enriched.filter((r) => r.done_today).length;
  return { groups, done, total: enriched.length };
}

export async function routineRoutes(app: FastifyInstance) {
  app.get("/api/routines", async () => getRoutinesToday());

  app.post("/api/routines/:id/toggle", async (req) => {
    const { id } = req.params as any;
    const existing = await one(
      "select id from routine_completions where routine_id=$1 and completed_on=current_date",
      [id]
    );
    if (existing) {
      await query("delete from routine_completions where routine_id=$1 and completed_on=current_date", [id]);
    } else {
      await query("insert into routine_completions(routine_id) values ($1)", [id]);
    }
    return getRoutinesToday();
  });

  app.post("/api/routines", async (req) => {
    const b = req.body as any;
    return one(
      `insert into routines(name, emoji, part_of_day, sort_order)
       values ($1,$2,coalesce($3,'morning'),coalesce($4,50)) returning *`,
      [b.name, b.emoji ?? null, b.part_of_day, b.sort_order]
    );
  });

  app.patch("/api/routines/:id", async (req) => {
    const { id } = req.params as any;
    const b = req.body as any;
    return one(
      `update routines set name=coalesce($2,name), emoji=coalesce($3,emoji),
        part_of_day=coalesce($4,part_of_day), active=coalesce($5,active)
       where id=$1 returning *`,
      [id, b.name, b.emoji, b.part_of_day, b.active]
    );
  });

  app.delete("/api/routines/:id", async (req, reply) => {
    const { id } = req.params as any;
    await query("delete from routines where id=$1", [(req.params as any).id]);
    return reply.send({ ok: true });
  });
}
