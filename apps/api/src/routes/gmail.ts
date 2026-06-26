import type { FastifyInstance } from "fastify";
import { google } from "googleapis";
import { oauthClient } from "../calendar/google.js";
import { query, one } from "../db.js";

// Latest Gmail inbox messages, using the already-connected Google account.
// Requires the gmail.readonly scope — if the stored token predates it, the
// response asks the user to reconnect Google (one re-consent).
export async function gmailRoutes(app: FastifyInstance) {
  app.get("/api/gmail/recent", async (req) => {
    const acct = await one<any>(
      `select * from calendar_accounts
       where provider='google' and connection_kind='oauth' and active=true
       order by created_at limit 1`
    );
    if (!acct) return { connected: false, messages: [] };

    const client = oauthClient();
    client.setCredentials({ access_token: acct.access_token, refresh_token: acct.refresh_token });
    client.on("tokens", async (t) => {
      if (t.access_token)
        await query("update calendar_accounts set access_token=$1 where id=$2", [t.access_token, acct.id]);
    });

    const gmail = google.gmail({ version: "v1", auth: client });
    try {
      const list = await gmail.users.messages.list({ userId: "me", maxResults: 8, q: "in:inbox" });
      const ids = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);
      const messages: any[] = [];
      for (const id of ids) {
        const m = await gmail.users.messages.get({
          userId: "me", id, format: "metadata", metadataHeaders: ["From", "Subject", "Date"],
        });
        const headers = m.data.payload?.headers ?? [];
        const h = (n: string) => headers.find((x) => x.name === n)?.value ?? "";
        messages.push({
          id,
          from: h("From").replace(/<.*>/, "").replace(/"/g, "").trim() || h("From"),
          subject: h("Subject"),
          date: h("Date"),
          snippet: m.data.snippet,
          unread: (m.data.labelIds ?? []).includes("UNREAD"),
        });
      }
      return { connected: true, email: acct.account_email, messages };
    } catch (e: any) {
      const needsReconsent = /insufficient|scope|permission|forbidden/i.test(e.message || "");
      req.log.warn(`Gmail fetch failed: ${e.message}`);
      return { connected: false, needs_reconsent: needsReconsent, error: e.message, messages: [] };
    }
  });
}
