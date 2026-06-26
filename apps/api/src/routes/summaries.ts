import type { FastifyInstance } from "fastify";
import { env } from "../env.js";

// Reads the latest document from a GitHub repo folder (murtadhame/claude/summaries)
// and surfaces it on the dashboard. Private repo -> needs a GITHUB_TOKEN (PAT, Contents:read).
function ghHeaders() {
  const h: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "pod-dashboard" };
  if (env.github.token) h.Authorization = `Bearer ${env.github.token}`;
  return h;
}

export async function summariesRoutes(app: FastifyInstance) {
  app.get("/api/summaries/latest", async () => {
    const { summariesRepo: repo, summariesPath: path, token } = env.github;
    const listRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: ghHeaders() });
    if (listRes.status === 404 || listRes.status === 401) {
      return { connected: false, needs_token: !token, error: `GitHub ${listRes.status}` };
    }
    if (!listRes.ok) return { connected: false, error: `GitHub ${listRes.status}` };

    const items = (await listRes.json()) as any[];
    const files = items
      .filter((i) => i.type === "file" && /\.(md|markdown|txt)$/i.test(i.name))
      .sort((a, b) => (a.name < b.name ? 1 : -1)); // dated filenames -> newest first
    if (files.length === 0) return { connected: true, file: null };

    const latest = files[0];
    const fileRes = await fetch(latest.url, { headers: ghHeaders() });
    if (!fileRes.ok) return { connected: true, file: { name: latest.name, html_url: latest.html_url }, error: `fetch ${fileRes.status}` };
    const fileData: any = await fileRes.json();
    const content = fileData.content ? Buffer.from(fileData.content, "base64").toString("utf8") : "";

    return {
      connected: true,
      file: { name: latest.name, html_url: latest.html_url, content },
      count: files.length,
    };
  });
}
