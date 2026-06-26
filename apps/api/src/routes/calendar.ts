import type { FastifyInstance } from "fastify";
import { query, one } from "../db.js";
import { env } from "../env.js";
import { googleAuthUrl, googleHandleCallback, syncGoogleAccount } from "../calendar/google.js";
import { addIcsAccount, syncIcsAccount } from "../calendar/ics.js";

export async function calendarRoutes(app: FastifyInstance) {
  // List connected calendars
  app.get("/api/calendar/accounts", async () => {
    return query(
      `select a.id, a.provider, a.connection_kind, a.account_email, a.display_name,
              a.color, a.default_domain_id, a.active, a.last_synced_at,
              d.name as default_domain_name
       from calendar_accounts a
       left join stewardship_domains d on d.id = a.default_domain_id
       order by a.created_at`
    );
  });

  app.patch("/api/calendar/accounts/:id", async (req) => {
    const { id } = req.params as any;
    const b = req.body as any;
    return one(
      `update calendar_accounts set
         display_name = coalesce($2, display_name),
         default_domain_id = coalesce($3, default_domain_id),
         color = coalesce($4, color),
         active = coalesce($5, active)
       where id = $1 returning *`,
      [id, b.display_name, b.default_domain_id, b.color, b.active]
    );
  });

  app.delete("/api/calendar/accounts/:id", async (req, reply) => {
    const { id } = req.params as any;
    await query("delete from calendar_accounts where id=$1", [id]);
    return reply.send({ ok: true });
  });

  // ---- Google OAuth ----
  app.get("/api/calendar/google/connect", async (_req, reply) => {
    return reply.redirect(googleAuthUrl());
  });

  app.get("/api/calendar/google/callback", async (req, reply) => {
    const { code } = req.query as any;
    if (!code) return reply.code(400).send("Missing code");
    try {
      const account = await googleHandleCallback(code);
      await syncGoogleAccount(account).catch(() => {});
      // Back to the web app's calendar settings
      return reply.redirect(`${env.appBaseUrl}/settings/calendars?connected=google`);
    } catch (e: any) {
      return reply.code(500).send(`Google connect failed: ${e.message}`);
    }
  });

  // ---- Outlook ICS (view-only) ----
  app.post("/api/calendar/ics", async (req, reply) => {
    const b = req.body as any;
    if (!b.ics_url) return reply.code(400).send({ ok: false, error: "ics_url required" });
    const account = await addIcsAccount(b);
    const n = await syncIcsAccount(account).catch((e) => {
      req.log.error(e);
      return 0;
    });
    return { ok: true, account, synced: n };
  });

  // ---- Manual sync trigger (also runs on a 15-min cron) ----
  app.post("/api/calendar/sync", async () => {
    return syncAllCalendars(app);
  });
}

/** Sync every active calendar account. Called by the cron and the manual trigger. */
export async function syncAllCalendars(app: FastifyInstance) {
  const accounts = await query<any>("select * from calendar_accounts where active = true");
  const out: any[] = [];
  for (const a of accounts) {
    try {
      const n =
        a.connection_kind === "ics_feed"
          ? await syncIcsAccount(a)
          : await syncGoogleAccount(a);
      out.push({ account: a.display_name, provider: a.provider, synced: n });
    } catch (e: any) {
      app.log.error(`Calendar sync failed for ${a.display_name}: ${e.message}`);
      out.push({ account: a.display_name, error: e.message });
    }
  }
  return { ok: true, accounts: out };
}
