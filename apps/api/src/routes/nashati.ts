import type { FastifyInstance } from "fastify";
import { env } from "../env.js";

// Nashati admin data API proxy (https://nashati.ai/api/admin/v1).
// Machine auth via x-admin-api-key = full admin. Key stays server-side.
async function nashatiGet(path: string): Promise<any> {
  if (!env.nashati.apiKey) throw new Error("not_configured");
  const res = await fetch(`${env.nashati.baseUrl}/api/admin/v1${path}`, {
    headers: { "x-admin-api-key": env.nashati.apiKey, "Content-Type": "application/json" },
  });
  const body: any = await res.json().catch(() => ({}));
  if (!body.ok) throw new Error(body.error?.code || `http_${res.status}`);
  return body.data;
}

export async function nashatiRoutes(app: FastifyInstance) {
  // Headline overview (counts + badge lists)
  app.get("/api/nashati/overview", async () => {
    if (!env.nashati.apiKey) return { connected: false, needs_key: true };
    try {
      const data = await nashatiGet("/overview");
      return { connected: true, ...data };
    } catch (e: any) {
      return { connected: false, error: e.message };
    }
  });

  // "Action needed" — what requires Murtadha's attention right now.
  app.get("/api/nashati/action-needed", async () => {
    if (!env.nashati.apiKey) return { connected: false, needs_key: true };
    try {
      const ov = await nashatiGet("/overview");
      const c = ov.counts ?? {};
      const items: { type: string; label: string; href: string }[] = [];
      if (c.providersPending > 0) items.push({ type: "providers", label: `${c.providersPending} provider approval${c.providersPending === 1 ? "" : "s"} pending`, href: "/nashati" });
      if (c.ticketsOpen > 0) items.push({ type: "tickets", label: `${c.ticketsOpen} open ticket${c.ticketsOpen === 1 ? "" : "s"}`, href: "/nashati" });
      if (c.ticketsPending > 0) items.push({ type: "tickets", label: `${c.ticketsPending} ticket${c.ticketsPending === 1 ? "" : "s"} awaiting reply`, href: "/nashati" });
      if (c.reviewsFlagged > 0) items.push({ type: "reviews", label: `${c.reviewsFlagged} flagged review${c.reviewsFlagged === 1 ? "" : "s"}`, href: "/nashati" });
      // claims aren't in counts; pull the list head
      const claims = await nashatiGet("/claims?status=pending&limit=1").catch(() => null);
      if (claims?.total > 0) items.push({ type: "claims", label: `${claims.total} activity claim${claims.total === 1 ? "" : "s"} to review`, href: "/nashati" });
      return {
        connected: true,
        counts: c,
        total_actions: items.length,
        items,
        pendingApprovals: ov.pendingApprovals ?? [],
        openTickets: ov.openTickets ?? [],
      };
    } catch (e: any) {
      return { connected: false, error: e.message };
    }
  });

  // Pass-through list reader (providers/activities/tickets/claims/reviews)
  app.get("/api/nashati/:resource", async (req, reply) => {
    const { resource } = req.params as any;
    const allowed = ["providers", "activities", "tickets", "claims", "reviews"];
    if (!allowed.includes(resource)) return reply.code(404).send({ error: "unknown resource" });
    if (!env.nashati.apiKey) return { connected: false, needs_key: true };
    const qs = new URLSearchParams(req.query as any).toString();
    try {
      const data = await nashatiGet(`/${resource}${qs ? `?${qs}` : ""}`);
      return { connected: true, ...data };
    } catch (e: any) {
      return { connected: false, error: e.message };
    }
  });
}
