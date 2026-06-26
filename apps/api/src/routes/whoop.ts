import type { FastifyInstance } from "fastify";
import { env } from "../env.js";
import { one, query } from "../db.js";

const AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const API = "https://api.prod.whoop.com/developer/v2";
const SCOPES = "offline read:recovery read:sleep read:cycles read:workout read:profile";
const STATE = "pod_whoop_state_001"; // single-user; CSRF state placeholder

async function getTokens(): Promise<any | null> {
  const row = await one<{ value: any }>("select value from app_settings where key='whoop_tokens'");
  return row?.value ?? null;
}
async function saveTokens(tok: any) {
  await query(
    `insert into app_settings(key, value) values ('whoop_tokens',$1::jsonb)
     on conflict (key) do update set value=excluded.value, updated_at=now()`,
    [JSON.stringify(tok)]
  );
}

async function exchange(params: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  if (!res.ok) throw new Error(`Whoop token ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  data.expires_at = Date.now() + (data.expires_in ?? 3600) * 1000 - 60000;
  await saveTokens(data);
  return data;
}

async function validAccessToken(): Promise<string | null> {
  let tok = await getTokens();
  if (!tok) return null;
  if (Date.now() < (tok.expires_at ?? 0)) return tok.access_token;
  // refresh
  tok = await exchange({
    grant_type: "refresh_token",
    refresh_token: tok.refresh_token,
    client_id: env.whoop.clientId,
    client_secret: env.whoop.clientSecret,
    scope: SCOPES,
  });
  return tok.access_token;
}

async function whoopGet(path: string): Promise<any> {
  const token = await validAccessToken();
  if (!token) throw new Error("not_connected");
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Whoop ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function whoopRoutes(app: FastifyInstance) {
  app.get("/api/whoop/connect", async (_req, reply) => {
    if (!env.whoop.clientId) return reply.code(400).send("WHOOP_CLIENT_ID not set");
    const url = `${AUTH_URL}?${new URLSearchParams({
      response_type: "code",
      client_id: env.whoop.clientId,
      redirect_uri: env.whoop.redirectUri,
      scope: SCOPES,
      state: STATE,
    })}`;
    return reply.redirect(url);
  });

  app.get("/api/whoop/callback", async (req, reply) => {
    const { code } = req.query as any;
    if (!code) return reply.code(400).send("Missing code");
    try {
      await exchange({
        grant_type: "authorization_code",
        code,
        client_id: env.whoop.clientId,
        client_secret: env.whoop.clientSecret,
        redirect_uri: env.whoop.redirectUri,
      });
      return reply.redirect(`${env.appBaseUrl}/health?whoop=connected`);
    } catch (e: any) {
      return reply.code(500).send(`Whoop connect failed: ${e.message}`);
    }
  });

  // Latest recovery / sleep / strain
  app.get("/api/whoop/today", async () => {
    const tok = await getTokens();
    if (!tok) return { connected: false };
    try {
      const [recovery, sleep, cycle] = await Promise.all([
        whoopGet("/recovery?limit=1").catch(() => null),
        whoopGet("/activity/sleep?limit=1").catch(() => null),
        whoopGet("/cycle?limit=1").catch(() => null),
      ]);
      const rec = recovery?.records?.[0]?.score ?? {};
      const slp = sleep?.records?.[0]?.score ?? {};
      const cyc = cycle?.records?.[0]?.score ?? {};
      return {
        connected: true,
        recovery_score: rec.recovery_score ?? null,
        hrv: rec.hrv_rmssd_milli != null ? Math.round(rec.hrv_rmssd_milli) : null,
        resting_hr: rec.resting_heart_rate ?? null,
        sleep_performance: slp.sleep_performance_percentage ?? null,
        strain: cyc.strain != null ? Math.round(cyc.strain * 10) / 10 : null,
      };
    } catch (e: any) {
      return { connected: false, error: e.message };
    }
  });

  app.post("/api/whoop/disconnect", async () => {
    await query("delete from app_settings where key='whoop_tokens'");
    return { ok: true };
  });
}
