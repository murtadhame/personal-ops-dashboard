// Tiny fetch wrapper around the backend API.
const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:4000";

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  // Only send a JSON content-type when there's actually a body — empty-body
  // POSTs (star/complete/toggle) must not claim application/json.
  const headers: Record<string, string> = { ...(opts.headers as any) };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  // some endpoints (delete) may return empty
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const api = {
  base: BASE,
  get: <T>(p: string) => req<T>(p),
  post: <T>(p: string, body?: any) =>
    req<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(p: string, body: any) =>
    req<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(p: string) => req<T>(p, { method: "DELETE" }),
};
