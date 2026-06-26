// Outlook 365 (view-only): poll a published .ics share URL and upsert events.
// No OAuth — just fetch the feed and parse it.
import ical from "node-ical";
import { query } from "../db.js";

/** Register an Outlook calendar by its published ICS URL. */
export async function addIcsAccount(input: {
  ics_url: string;
  display_name?: string;
  account_email?: string;
  default_domain_id?: string | null;
  color?: string;
}) {
  const rows = await query(
    `insert into calendar_accounts(provider, connection_kind, account_email, display_name,
        ics_url, default_domain_id, color)
     values ('microsoft','ics_feed',$1,$2,$3,$4,coalesce($5,'#0F6CBD'))
     on conflict (provider, account_email) do update set
        ics_url = excluded.ics_url,
        display_name = excluded.display_name,
        default_domain_id = excluded.default_domain_id,
        active = true
     returning *`,
    [
      input.account_email ?? input.display_name ?? "outlook-feed",
      input.display_name ?? "Outlook (Badael)",
      input.ics_url,
      input.default_domain_id ?? null,
      input.color,
    ]
  );
  return rows[0];
}

export async function syncIcsAccount(account: any): Promise<number> {
  if (!account.ics_url) return 0;
  const data = await ical.async.fromURL(account.ics_url);
  let count = 0;
  const horizon = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days
  const past = Date.now() - 1 * 24 * 60 * 60 * 1000;

  for (const key of Object.keys(data)) {
    const ev: any = (data as any)[key];
    if (ev.type !== "VEVENT") continue;
    const start = ev.start ? new Date(ev.start).getTime() : null;
    if (start && (start > horizon || start < past)) continue;

    const allDay = ev.datetype === "date";
    await query(
      `insert into calendar_events(account_id, provider, provider_event_id, calendar_id,
          title, description, starts_at, ends_at, all_day, location, organizer, status,
          domain_id, raw)
       values ($1,'microsoft',$2,'outlook',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       on conflict (account_id, provider_event_id) do update set
          title=excluded.title, description=excluded.description,
          starts_at=excluded.starts_at, ends_at=excluded.ends_at, all_day=excluded.all_day,
          location=excluded.location, status=excluded.status, synced_at=now(), raw=excluded.raw`,
      [
        account.id,
        ev.uid ?? key,
        ev.summary ?? "(no title)",
        ev.description ?? null,
        ev.start ?? null,
        ev.end ?? null,
        allDay,
        ev.location ?? null,
        ev.organizer?.val ?? null,
        ev.status ?? null,
        account.default_domain_id ?? null,
        JSON.stringify({ uid: ev.uid, summary: ev.summary }),
      ]
    );
    count++;
  }

  await query("update calendar_accounts set last_synced_at=now() where id=$1", [account.id]);
  return count;
}
