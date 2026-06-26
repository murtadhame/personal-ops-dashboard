import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";

// Compact CRUD for the library / journal / people / content modules.
// Kept simple (list + create) — richer editing comes as each module grows.
export async function moduleRoutes(app: FastifyInstance) {
  // ---- Notes (incl. meeting minutes / brainstorms) ----
  app.get("/api/notes", async (req) => {
    const { source_type } = req.query as any;
    if (source_type)
      return query("select * from notes where source_type=$1 order by created_at desc limit 200", [source_type]);
    return query("select * from notes order by created_at desc limit 200");
  });
  app.post("/api/notes", async (req) => {
    const b = req.body as any;
    return one(
      `insert into notes(title, body, source_type, tags, needs_review)
       values ($1,$2,coalesce($3,'own_thought'),coalesce($4,'{}')::text[],coalesce($5,false)) returning *`,
      [b.title ?? null, b.body, b.source_type, b.tags, b.needs_review]
    );
  });
  app.patch("/api/notes/:id", async (req) => {
    const { id } = req.params as any; const b = req.body as any;
    return one(`update notes set title=coalesce($2,title), body=coalesce($3,body),
      source_type=coalesce($4,source_type), needs_review=coalesce($5,needs_review), updated_at=now()
      where id=$1 returning *`, [id, b.title, b.body, b.source_type, b.needs_review]);
  });

  // ---- Quotes (+ annotations) — Library ----
  app.get("/api/quotes", async () =>
    query(`select q.*, b.title as book_title,
      (select count(*) from quote_annotations a where a.quote_id=q.id) as annotation_count
      from quotes q left join books b on b.id=q.book_id order by q.created_at desc limit 200`));
  app.post("/api/quotes", async (req) => {
    const b = req.body as any;
    return one(
      `insert into quotes(text, source_author, source_reference, source_type, page_number, tags, added_via)
       values ($1,$2,$3,coalesce($4,'book'),$5,coalesce($6,'{}')::text[],coalesce($7,'manual')) returning *`,
      [b.text, b.source_author ?? null, b.source_reference ?? null, b.source_type, b.page_number ?? null, b.tags, b.added_via]
    );
  });
  app.get("/api/quotes/:id/annotations", async (req) =>
    query("select * from quote_annotations where quote_id=$1 order by annotated_at", [(req.params as any).id]));
  app.post("/api/quotes/:id/annotations", async (req) => {
    const { id } = req.params as any; const b = req.body as any;
    return one("insert into quote_annotations(quote_id, body, context) values ($1,$2,coalesce($3,'on_revisit')) returning *", [id, b.body, b.context]);
  });

  // ---- Journal ----
  app.get("/api/journal", async () =>
    query("select * from journal_entries order by entry_date desc, created_at desc limit 200"));
  app.post("/api/journal", async (req) => {
    const b = req.body as any;
    return one(
      `insert into journal_entries(entry_date, title, transcription_text, source, tags)
       values (coalesce($1, current_date), $2, $3, coalesce($4,'typed'), coalesce($5,'{}')::text[]) returning *`,
      [b.entry_date ?? null, b.title ?? null, b.text ?? b.transcription_text, b.source, b.tags]
    );
  });

  // ---- People ----
  app.get("/api/people", async () =>
    query(`select pe.*,
      (select count(*) from person_facts f where f.person_id=pe.id) as fact_count
      from people pe order by pe.name`));
  app.post("/api/people", async (req) => {
    const b = req.body as any;
    return one(`insert into people(name, relationship_type, email, company, notes)
      values ($1,$2,$3,$4,$5) returning *`, [b.name, b.relationship_type ?? null, b.email ?? null, b.company ?? null, b.notes ?? null]);
  });
  app.post("/api/people/:id/facts", async (req) => {
    const { id } = req.params as any; const b = req.body as any;
    return one(`insert into person_facts(person_id, fact_type, fact_value, date_relevant, recurring)
      values ($1,$2,$3,$4,coalesce($5,false)) returning *`, [id, b.fact_type, b.fact_value, b.date_relevant ?? null, b.recurring]);
  });

  // ---- Content pipeline ----
  app.get("/api/content", async () =>
    query("select * from content_items order by created_at desc limit 200"));
  app.post("/api/content", async (req) => {
    const b = req.body as any;
    return one(`insert into content_items(title, channel, type, status)
      values ($1,$2,coalesce($3,'video'),coalesce($4,'idea')) returning *`, [b.title, b.channel ?? null, b.type, b.status]);
  });
}
