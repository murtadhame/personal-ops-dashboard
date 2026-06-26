import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";
import { anthropic } from "../lib/anthropic.js";
import { env } from "../env.js";
import { getRoutinesToday } from "./routines.js";

// Gather a compact snapshot of "today" for the briefing / ask context.
export async function gatherLifeContext() {
  const domains = await query<any>(`
    select d.name, d.expected_cadence_days,
      (select count(*) from tasks t where t.domain_id=d.id and t.status<>'done') as open_tasks,
      case when d.expected_cadence_days is null then false
           when last_activity.at is null then true
           when last_activity.at < now() - (d.expected_cadence_days||' days')::interval then true
           else false end as slipping
    from stewardship_domains d
    left join lateral (select max(x.at) at from (
      select completed_at at from tasks where domain_id=d.id and completed_at is not null
      union all select logged_at from activity_log where domain_id=d.id) x) last_activity on true
    where d.active and not d.is_system order by d.sort_order`);

  const tasks = await query<any>(`
    select t.title, to_char(t.due_date,'YYYY-MM-DD') as due_date, t.priority, t.is_starred,
           d.name as domain, p.name as project
    from tasks t join stewardship_domains d on d.id=t.domain_id
    left join projects p on p.id=t.project_id
    where t.status<>'done' order by t.is_starred desc, t.due_date nulls last limit 40`);

  const events = await query<any>(`
    select title, to_char(starts_at,'Dy HH24:MI') as when, location, provider
    from calendar_events where starts_at between now()-interval '1 hour' and now()+interval '36 hours'
    order by starts_at limit 12`).catch(() => []);

  const routines = await getRoutinesToday().catch(() => ({ groups: [], done: 0, total: 0 }));
  const health = await query<any>(`
    select kind, sum(value) as total, max(unit) as unit
    from health_logs where logged_on=current_date group by kind`).catch(() => []);
  const recentNotes = await query<any>(
    `select coalesce(title,left(body,80)) as t, source_type from notes order by created_at desc limit 5`
  ).catch(() => []);

  return { domains, tasks, events, routines, health, recentNotes };
}

function contextToText(c: any): string {
  const slipping = c.domains.filter((d: any) => d.slipping).map((d: any) => d.name);
  const today = new Date().toLocaleDateString("en-CA");
  const lines: string[] = [];
  lines.push(`Date: ${today}`);
  lines.push(`Domains: ${c.domains.map((d: any) => `${d.name}(${d.open_tasks} open${d.slipping ? ", SLIPPING" : ""})`).join("; ")}`);
  if (slipping.length) lines.push(`Slipping: ${slipping.join(", ")}`);
  lines.push(`Starred (Top 3): ${c.tasks.filter((t: any) => t.is_starred).map((t: any) => t.title).join("; ") || "none"}`);
  lines.push(`Open tasks (${c.tasks.length}): ${c.tasks.slice(0, 20).map((t: any) => `${t.title}${t.due_date ? ` [due ${t.due_date}]` : ""}${t.domain ? ` <${t.domain}>` : ""}`).join("; ")}`);
  lines.push(`Calendar next 36h: ${c.events.map((e: any) => `${e.when} ${e.title}`).join("; ") || "nothing"}`);
  lines.push(`Routines: ${c.routines.done}/${c.routines.total} done today`);
  if (c.health?.length) lines.push(`Health today: ${c.health.map((h: any) => `${h.kind} ${h.total}${h.unit || ""}`).join(", ")}`);
  return lines.join("\n");
}

async function generateBriefing(language: string): Promise<string> {
  const ctx = await gatherLifeContext();
  const lang = language === "ar" ? "Arabic" : "English";
  const sys = `You are the daily briefing writer for Murtadha's personal operations dashboard.
Write a warm, concise morning briefing in ${lang}. Be specific and grounded ONLY in the data provided.
Structure: a one-line greeting, then short sections — what matters today, calendar, anything slipping,
routines nudge. Use a few short bullet points. No invented facts. Keep it under 180 words.
IMPORTANT: write ALL numbers in Western Arabic numerals (0,1,2,3,4,5,6,7,8,9) — never Eastern Arabic-Indic (٠١٢٣٤٥٦٧٨٩), even in Arabic.`;
  const msg = await anthropic.messages.create({
    model: env.parserModel,
    max_tokens: 700,
    system: sys,
    messages: [{ role: "user", content: contextToText(ctx) }],
  });
  return msg.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
}

export async function briefingRoutes(app: FastifyInstance) {
  // GET /api/briefing/today?lang=en  — returns today's briefing, generating if missing
  app.get("/api/briefing/today", async (req) => {
    const lang = ((req.query as any)?.lang as string) === "ar" ? "ar" : "en";
    const today = new Date().toLocaleDateString("en-CA");
    let row = await one<any>(
      "select * from briefings where briefing_date=$1 and language=$2",
      [today, lang]
    );
    if (!row) {
      const body = await generateBriefing(lang);
      row = await one<any>(
        `insert into briefings(briefing_date, language, body_md, model)
         values ($1,$2,$3,$4)
         on conflict (briefing_date, language) do update set body_md=excluded.body_md, generated_at=now()
         returning *`,
        [today, lang, body, env.parserModel]
      );
    }
    return row;
  });

  // POST /api/briefing/regenerate?lang=en
  app.post("/api/briefing/regenerate", async (req) => {
    const lang = ((req.query as any)?.lang as string) === "ar" ? "ar" : "en";
    const today = new Date().toLocaleDateString("en-CA");
    const body = await generateBriefing(lang);
    return one<any>(
      `insert into briefings(briefing_date, language, body_md, model)
       values ($1,$2,$3,$4)
       on conflict (briefing_date, language) do update set body_md=excluded.body_md, generated_at=now()
       returning *`,
      [today, lang, body, env.parserModel]
    );
  });
}
