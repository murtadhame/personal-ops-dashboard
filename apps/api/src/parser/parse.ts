// Calls Claude to turn a transcript into structured actions.
// The static system block is sent with cache_control so repeat calls are cheap.
import { anthropic } from "../lib/anthropic.js";
import { env } from "../env.js";
import { query } from "../db.js";
import { PARSER_STATIC, buildContextBlock } from "./systemPrompt.js";

export type ParsedAction = Record<string, any>;

export async function parseTranscript(
  transcript: string,
  source: string
): Promise<{ actions: ParsedAction[]; raw: string }> {
  const domains = await query<{ id: string; name: string }>(
    "select id, name from stewardship_domains where active = true order by sort_order"
  );
  const projects = await query<{ id: string; name: string; domain_id: string }>(
    "select id, name, domain_id from projects where status = 'active' order by updated_at desc limit 60"
  );

  const nowIso = new Date().toLocaleString("sv-SE", { timeZone: env.timezone }).replace(" ", "T");
  const context = buildContextBlock({
    nowIso,
    timezone: env.timezone,
    domains,
    projects,
    source,
  });

  // The stable block carries cache_control so repeat calls bill ~90% less for it.
  // Cast to any: cache_control is valid at the API but absent from this SDK's older types.
  const systemBlocks: any = [
    { type: "text", text: PARSER_STATIC, cache_control: { type: "ephemeral" } },
    { type: "text", text: context },
  ];

  const msg = await anthropic.messages.create({
    model: env.parserModel,
    max_tokens: 1024,
    system: systemBlocks,
    messages: [{ role: "user", content: transcript }],
  });

  const raw = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const actions = extractJsonArray(raw);
  return { actions, raw };
}

/** Tolerantly pull a JSON array out of the model's text. */
function extractJsonArray(text: string): ParsedAction[] {
  let t = text.trim();
  // Strip accidental code fences
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(t);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // last resort: find first [...] block
    const m = t.match(/\[[\s\S]*\]/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* fall through */
      }
    }
    return [{ error: "unparseable_model_output", transcript: text }];
  }
}

// Type import only (keeps runtime import out)
import type Anthropic from "@anthropic-ai/sdk";
