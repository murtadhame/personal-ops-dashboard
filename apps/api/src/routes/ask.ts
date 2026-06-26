import type { FastifyInstance } from "fastify";
import { anthropic } from "../lib/anthropic.js";
import { env } from "../env.js";
import { gatherLifeContext } from "./briefing.js";

// Ask a natural-language question about your life data. Claude answers ONLY
// from the connected data, and is told to say when something isn't connected
// (e.g. live Nashati analytics / Whoop) rather than invent.
export async function askRoutes(app: FastifyInstance) {
  app.post("/api/ask", async (req, reply) => {
    const { question, lang } = (req.body ?? {}) as { question?: string; lang?: string };
    if (!question?.trim()) return reply.code(400).send({ error: "question required" });
    const language = lang === "ar" ? "Arabic" : "English";

    const ctx = await gatherLifeContext();
    const connected = `Connected data sources: tasks, projects, domains (with slippage), calendar (Google + Outlook), routines, notes, health logs.
NOT yet connected: live Nashati.ai dashboard data, Google Analytics, Whoop/steps auto-sync.`;

    const sys = `You are Murtadha's personal operations assistant. Answer his question in ${language},
using ONLY the JSON context below. Be concise and direct. If the question needs a data source that is
NOT connected (e.g. live Nashati.ai metrics, Google Analytics, Whoop), say clearly that it isn't connected
yet and what he'd need to connect it — do not guess numbers. ${connected}

CONTEXT:
${JSON.stringify(ctx)}`;

    const msg = await anthropic.messages.create({
      model: env.parserModel,
      max_tokens: 700,
      system: sys,
      messages: [{ role: "user", content: question }],
    });
    const answer = msg.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
    return { answer };
  });
}
