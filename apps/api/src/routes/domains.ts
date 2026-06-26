import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";

export async function domainRoutes(app: FastifyInstance) {
  app.get("/api/domains", async () => {
    return query(
      `select d.*,
         (select count(*) from tasks t where t.domain_id = d.id and t.status <> 'done') as open_tasks,
         (select count(*) from projects p where p.domain_id = d.id and p.status = 'active') as active_projects
       from stewardship_domains d
       where d.active = true
       order by d.sort_order`
    );
  });

  // Domain status with slippage flag (powers the Today domain-status card)
  app.get("/api/domains/status", async () => {
    return query(`
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
      order by d.sort_order
    `);
  });

  app.post("/api/domains", async (req) => {
    const b = req.body as any;
    return one(
      `insert into stewardship_domains(name, description, color, expected_cadence_days, sort_order)
       values ($1,$2,$3,$4,coalesce($5,50)) returning *`,
      [b.name, b.description ?? null, b.color ?? null, b.expected_cadence_days ?? null, b.sort_order]
    );
  });

  app.patch("/api/domains/:id", async (req) => {
    const { id } = req.params as any;
    const b = req.body as any;
    return one(
      `update stewardship_domains set
         name = coalesce($2,name),
         description = coalesce($3,description),
         color = coalesce($4,color),
         expected_cadence_days = coalesce($5,expected_cadence_days),
         active = coalesce($6,active)
       where id = $1 returning *`,
      [id, b.name, b.description, b.color, b.expected_cadence_days, b.active]
    );
  });
}
