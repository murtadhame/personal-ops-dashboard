// Google Calendar: OAuth connect + event sync into calendar_events.
import { google } from "googleapis";
import { env } from "../env.js";
import { query, one } from "../db.js";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "openid",
  "email",
  "profile",
];

export function oauthClient() {
  return new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret,
    env.google.redirectUri
  );
}

export function googleAuthUrl(): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

/** Exchange the OAuth code, store an account row. */
export async function googleHandleCallback(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const me = await oauth2.userinfo.get();
  const email = me.data.email ?? "google-account";

  return one(
    `insert into calendar_accounts(provider, connection_kind, account_email, display_name,
        access_token, refresh_token, token_expires_at, color)
     values ('google','oauth',$1,$2,$3,$4,$5,'#4285F4')
     on conflict (provider, account_email) do update set
        access_token = excluded.access_token,
        refresh_token = coalesce(excluded.refresh_token, calendar_accounts.refresh_token),
        token_expires_at = excluded.token_expires_at,
        active = true
     returning *`,
    [
      email,
      me.data.name ?? email,
      tokens.access_token ?? null,
      tokens.refresh_token ?? null,
      tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    ]
  );
}

/** Pull the next ~30 days of events for one Google account. */
export async function syncGoogleAccount(account: any) {
  const client = oauthClient();
  client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });
  // Refresh token if needed (googleapis handles this on call, but persist new tokens)
  client.on("tokens", async (t) => {
    if (t.access_token) {
      await query(
        "update calendar_accounts set access_token=$1, token_expires_at=$2 where id=$3",
        [t.access_token, t.expiry_date ? new Date(t.expiry_date) : null, account.id]
      );
    }
  });

  const cal = google.calendar({ version: "v3", auth: client });
  const timeMin = new Date();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const items = res.data.items ?? [];
  for (const ev of items) {
    const allDay = !!ev.start?.date;
    await query(
      `insert into calendar_events(account_id, provider, provider_event_id, calendar_id,
          title, description, starts_at, ends_at, all_day, location, organizer, status,
          html_link, domain_id, raw)
       values ($1,'google',$2,'primary',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       on conflict (account_id, provider_event_id) do update set
          title=excluded.title, description=excluded.description,
          starts_at=excluded.starts_at, ends_at=excluded.ends_at, all_day=excluded.all_day,
          location=excluded.location, status=excluded.status, html_link=excluded.html_link,
          synced_at=now(), raw=excluded.raw`,
      [
        account.id,
        ev.id,
        ev.summary ?? "(no title)",
        ev.description ?? null,
        allDay ? ev.start?.date : ev.start?.dateTime,
        allDay ? ev.end?.date : ev.end?.dateTime,
        allDay,
        ev.location ?? null,
        ev.organizer?.email ?? null,
        ev.status ?? null,
        ev.htmlLink ?? null,
        account.default_domain_id ?? null,
        JSON.stringify(ev),
      ]
    );
  }

  await query("update calendar_accounts set last_synced_at=now() where id=$1", [account.id]);
  return items.length;
}
