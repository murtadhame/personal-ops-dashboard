import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";

export async function projectRoutes(app: FastifyInstance) {
  app.get("/api/projects", async (req) => {
    const { domain_id, status } = req.query as any;
    const clauses: string[] = [];
    const params: any[] = [];
    if (domain_id) {
      params.push(domain_id);
      clauses.push(`p.domain_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      clauses.push(`p.status = $${params.length}`);
    }
    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    return query(
      `select p.*, d.name as domain_name, d.color as domain_color,
         (select count(*) from milestones m where m.project_id = p.id) as milestone_count,
         (select count(*) from milestones m where m.project_id = p.id and m.status = 'done') as milestones_done,
         (select count(*) from tasks t where t.project_id = p.id and t.status <> 'done') as open_tasks
       from projects p
       join stewardship_domains d on d.id = p.domain_id
       ${where}
       order by p.updated_at desc`,
      params
    );
  });

  app.get("/api/projects/:id", async (req) => {
    const { id } = req.params as any;
    const project = await one(`select * from projects where id = $1`, [id]);
    const milestones = await query(
      `select * from milestones where project_id = $1 order by sort_order, created_at`,
      [id]
    );
    const tasks = await query(
      `select * from tasks where project_id = $1 order by status, due_date nulls last`,
      [id]
    );
    const activity = await query(
      `select * from activity_log where project_id = $1 order by logged_at desc limit 50`,
      [id]
    );
    return { project, milestones, tasks, activity };
  });

  app.post("/api/projects", async (req) => {
    const b = req.body as any;
    return one(
      `insert into projects(name, description, domain_id, type, target_date)
       values ($1,$2,$3,coalesce($4,'target_date'),$5) returning *`,
      [b.name, b.description ?? null, b.domain_id, b.type, b.target_date ?? null]
    );
  });

  app.patch("/api/projects/:id", async (req) => {
    const { id } = req.params as any;
    const b = req.body as any;
    return one(
      `update projects set
         name = coalesce($2,name),
         description = coalesce($3,description),
         domain_id = coalesce($4,domain_id),
         status = coalesce($5,status),
         target_date = coalesce($6,target_date),
         completed_at = case when $5 = 'completed' then now() else completed_at end
       where id = $1 returning *`,
      [id, b.name, b.description, b.domain_id, b.status, b.target_date]
    );
  });

  // Milestones
  app.post("/api/projects/:id/milestones", async (req) => {
    const { id } = req.params as any;
    const b = req.body as any;
    return one(
      `insert into milestones(project_id, title, weight, sort_order)
       values ($1,$2,coalesce($3,1),coalesce($4,0)) returning *`,
      [id, b.title, b.weight, b.sort_order]
    );
  });

  app.patch("/api/milestones/:id", async (req) => {
    const { id } = req.params as any;
    const b = req.body as any;
    return one(
      `update milestones set
         title = coalesce($2,title),
         status = coalesce($3,status),
         completed_at = case when $3 = 'done' then now() else null end
       where id = $1 returning *`,
      [id, b.title, b.status]
    );
  });
}
