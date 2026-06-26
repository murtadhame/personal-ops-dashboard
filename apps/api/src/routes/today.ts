import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";
import { getRoutinesToday } from "./routines.js";

export async function todayRoutes(app: FastifyInstance) {
  // One aggregate call powering the Today screen.
  app.get("/api/today", async () => {
    const taskCols = `t.id, t.title, t.status, to_char(t.due_date,'YYYY-MM-DD') as due_date,
      t.due_time, t.priority, t.is_starred, t.recurrence_rule,
      d.name as domain_name, d.color as domain_color, p.name as project_name`;

    // Top 3 — starred open tasks
    const top3 = await query(
      `select ${taskCols} from tasks t
       join stewardship_domains d on d.id = t.domain_id
       left join projects p on p.id = t.project_id
       where t.status <> 'done' and t.is_starred = true
       order by t.due_date nulls last limit 3`
    );

    // All open tasks (client groups into Overdue / Today / Tomorrow / This Week / Later)
    const open = await query(
      `select ${taskCols} from tasks t
       join stewardship_domains d on d.id = t.domain_id
       left join projects p on p.id = t.project_id
       where t.status <> 'done'
       order by t.due_date nulls last,
         case t.priority when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end,
         t.created_at desc
       limit 80`
    );

    // Up Next — events for the next 7 days, both calendars
    const events = await query(
      `select e.id, e.title, e.starts_at, e.ends_at, e.all_day, e.location,
              e.provider, a.display_name as account_name
       from calendar_events e
       join calendar_accounts a on a.id = e.account_id
       where e.starts_at >= now() - interval '2 hours'
         and e.starts_at <= now() + interval '7 days'
       order by e.starts_at limit 12`
    ).catch(() => []);

    // Domain slippage
    const domains = await query(`
      select d.id, d.name, d.color, d.expected_cadence_days,
        (select count(*) from tasks t where t.domain_id = d.id and t.status <> 'done') as open_tasks,
        case when d.expected_cadence_days is null then false
             when last_activity.at is null then true
             when last_activity.at < now() - (d.expected_cadence_days || ' days')::interval then true
             else false end as slipping
      from stewardship_domains d
      left join lateral (
        select max(x.at) as at from (
          select completed_at as at from tasks where domain_id = d.id and completed_at is not null
          union all
          select logged_at as at from activity_log where domain_id = d.id
        ) x
      ) last_activity on true
      where d.active = true and d.is_system = false
      order by slipping desc, d.sort_order`);

    const routines = await getRoutinesToday().catch(() => ({ groups: [], done: 0, total: 0 }));

    // Resurfacing — a quote or journal entry, rotating
    const resurface =
      (await one<any>(
        `select 'quote' as kind, text as body, coalesce(source_author, source_reference) as meta
         from quotes order by coalesce(last_surfaced_at,'epoch') asc, random() limit 1`
      ).catch(() => null)) ??
      (await one<any>(
        `select 'journal' as kind, transcription_text as body, to_char(entry_date,'Mon DD') as meta
         from journal_entries order by coalesce(last_surfaced_at,'epoch') asc, random() limit 1`
      ).catch(() => null));

    // Needs review — pending captures + flagged notes
    const pending = await one<{ c: number }>(
      "select count(*)::int as c from pending_captures where status='pending'"
    ).catch(() => ({ c: 0 }));
    const reviewNotes = await query<any>(
      `select id, coalesce(title, left(body, 60)) as title, source_type, created_at
       from notes where needs_review = true order by created_at desc limit 3`
    ).catch(() => []);

    const nameRows = await query<{ key: string; value: any }>(
      "select key, value from app_settings where key in ('display_name_en','display_name_ar')"
    );
    const names: Record<string, any> = {};
    for (const r of nameRows) names[r.key] = r.value;

    return {
      date: new Date().toISOString().slice(0, 10),
      profile: { name_en: names.display_name_en ?? "", name_ar: names.display_name_ar ?? "" },
      top3,
      open,
      events,
      domains,
      routines,
      resurface,
      needs_review: { count: (pending?.c ?? 0) + reviewNotes.length, notes: reviewNotes },
    };
  });
}
