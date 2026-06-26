import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";

export async function todayRoutes(app: FastifyInstance) {
  // One aggregate call powering the Today screen.
  app.get("/api/today", async () => {
    const maxRow = await one<{ value: number }>(
      "select value from app_settings where key='today_max_tasks'"
    );
    const maxTasks = Number(maxRow?.value ?? 7);

    // Top tasks: overdue + due today, capped (display conservative).
    const tasks = await query(
      `select t.*, d.name as domain_name, d.color as domain_color, p.name as project_name
       from tasks t
       join stewardship_domains d on d.id = t.domain_id
       left join projects p on p.id = t.project_id
       where t.status <> 'done'
         and (t.due_date is null and t.priority in ('high','urgent')
              or t.due_date <= current_date)
       order by
         (t.due_date < current_date) desc,
         t.due_date nulls last,
         case t.priority when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end
       limit $1`,
      [maxTasks]
    );

    // Today's calendar events from BOTH sources (Google + Outlook ICS),
    // with the source badge + domain tag.
    const events = await query(
      `select e.id, e.title, e.starts_at, e.ends_at, e.all_day, e.location,
              e.provider, e.html_link, a.display_name as account_name, a.color as account_color,
              d.name as domain_name, d.color as domain_color
       from calendar_events e
       join calendar_accounts a on a.id = e.account_id
       left join stewardship_domains d on d.id = e.domain_id
       where e.starts_at::date = current_date
          or (e.starts_at <= now() and e.ends_at >= now())
       order by e.all_day desc, e.starts_at`
    ).catch(() => []);

    // Domain status (slippage) card.
    const domains = await query(`
      select d.id, d.name, d.color, d.expected_cadence_days,
        (select count(*) from tasks t where t.domain_id = d.id and t.status <> 'done') as open_tasks,
        last_activity.at as last_activity_at,
        case
          when d.expected_cadence_days is null then false
          when last_activity.at is null then true
          when last_activity.at < now() - (d.expected_cadence_days || ' days')::interval then true
          else false
        end as slipping
      from stewardship_domains d
      left join lateral (
        select max(x.at) as at from (
          select completed_at as at from tasks where domain_id = d.id and completed_at is not null
          union all
          select logged_at as at from activity_log where domain_id = d.id
        ) x
      ) last_activity on true
      where d.active = true and d.is_system = false
      order by slipping desc, d.sort_order
    `);

    const pendingCount = await one<{ c: number }>(
      "select count(*)::int as c from pending_captures where status='pending'"
    ).catch(() => ({ c: 0 }));

    const nameRows = await query<{ key: string; value: any }>(
      "select key, value from app_settings where key in ('display_name_en','display_name_ar')"
    );
    const names: Record<string, any> = {};
    for (const r of nameRows) names[r.key] = r.value;

    return {
      date: new Date().toISOString().slice(0, 10),
      profile: {
        name_en: names.display_name_en ?? "",
        name_ar: names.display_name_ar ?? "",
      },
      tasks,
      events,
      domains,
      pending_captures: pendingCount?.c ?? 0,
    };
  });
}
