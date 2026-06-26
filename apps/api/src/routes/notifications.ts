import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/api/notifications", async (req) => {
    const { status } = req.query as any;
    if (status) {
      return query(
        "select * from notifications where status=$1 order by created_at desc limit 100",
        [status]
      );
    }
    return query("select * from notifications order by created_at desc limit 100");
  });

  app.post("/api/notifications/:id/read", async (req) => {
    const { id } = req.params as any;
    return one("update notifications set status='read' where id=$1 returning *", [id]);
  });

  app.post("/api/notifications/read-all", async () => {
    await query("update notifications set status='read' where status='unread'");
    return { ok: true };
  });
}
