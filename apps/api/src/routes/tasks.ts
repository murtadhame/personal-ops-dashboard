import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";

export async function taskRoutes(app: FastifyInstance) {
  // GET /api/tasks?domain_id=&project_id=&status=&due=today|overdue|upcoming
  app.get("/api/tasks", async (req) => {
    const { domain_id, project_id, status, due, parent_task_id } = req.query as any;
    const clauses: string[] = [];
    const params: any[] = [];
    const add = (sql: string, val: any) => {
      params.push(val);
      clauses.push(sql.replace("$?", `$${params.length}`));
    };
    if (domain_id) add("t.domain_id = $?", domain_id);
    if (project_id) add("t.project_id = $?", project_id);
    if (status) add("t.status = $?", status);
    if (parent_task_id) add("t.parent_task_id = $?", parent_task_id);
    if (due === "today") clauses.push("t.due_date = current_date and t.status <> 'done'");
    if (due === "overdue") clauses.push("t.due_date < current_date and t.status <> 'done'");
    if (due === "upcoming") clauses.push("t.due_date > current_date and t.status <> 'done'");

    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    return query(
      `select t.*, d.name as domain_name, d.color as domain_color, p.name as project_name
       from tasks t
       join stewardship_domains d on d.id = t.domain_id
       left join projects p on p.id = t.project_id
       ${where}
       order by
         case t.status when 'done' then 1 else 0 end,
         t.due_date nulls last,
         case t.priority when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end,
         t.created_at desc`,
      params
    );
  });

  app.post("/api/tasks", async (req) => {
    const b = req.body as any;
    // Default to Inbox when no domain provided
    const domainId =
      b.domain_id ??
      (await one<{ id: string }>("select id from stewardship_domains where name='Inbox'"))?.id;
    return one(
      `insert into tasks(title, notes, domain_id, project_id, parent_task_id,
                         due_date, due_time, priority, recurrence_rule, reminder_offsets, source)
       values ($1,$2,$3,$4,$5,$6,$7,coalesce($8,'normal'),$9,coalesce($10,'[]'::jsonb),'manual')
       returning *`,
      [
        b.title,
        b.notes ?? null,
        domainId,
        b.project_id ?? null,
        b.parent_task_id ?? null,
        b.due_date ?? null,
        b.due_time ?? null,
        b.priority ?? null,
        b.recurrence_rule ?? null,
        JSON.stringify(b.reminder_offsets ?? []),
      ]
    );
  });

  app.patch("/api/tasks/:id", async (req) => {
    const { id } = req.params as any;
    const b = req.body as any;
    return one(
      `update tasks set
         title = coalesce($2,title),
         notes = coalesce($3,notes),
         status = coalesce($4,status),
         domain_id = coalesce($5,domain_id),
         project_id = coalesce($6,project_id),
         due_date = coalesce($7,due_date),
         due_time = coalesce($8,due_time),
         priority = coalesce($9,priority),
         completed_at = case when $4 = 'done' then now()
                             when $4 is not null then null
                             else completed_at end
       where id = $1 returning *`,
      [id, b.title, b.notes, b.status, b.domain_id, b.project_id, b.due_date, b.due_time, b.priority]
    );
  });

  // Convenience toggle
  app.post("/api/tasks/:id/complete", async (req) => {
    const { id } = req.params as any;
    return one(
      `update tasks set status='done', completed_at=now() where id=$1 returning *`,
      [id]
    );
  });

  app.delete("/api/tasks/:id", async (req, reply) => {
    const { id } = req.params as any;
    await query("delete from tasks where id=$1", [id]);
    return reply.send({ ok: true });
  });
}
