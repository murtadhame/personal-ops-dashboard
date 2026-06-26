import type { FastifyInstance } from "fastify";
import { parseTranscript } from "../parser/parse.js";
import { executeActions } from "../parser/execute.js";
import { query } from "../db.js";

export async function captureRoutes(app: FastifyInstance) {
  // POST /api/capture  { transcript, source?, device_context? }
  app.post("/api/capture", async (req, reply) => {
    const body = (req.body ?? {}) as {
      transcript?: string;
      source?: string;
      device_context?: Record<string, any>;
    };
    const transcript = (body.transcript ?? "").trim();
    const source = body.source ?? "voice";

    if (!transcript) {
      return reply.code(400).send({ ok: false, error: "transcript is required" });
    }

    try {
      const { actions, raw } = await parseTranscript(transcript, source);
      const result = await executeActions(actions, source);

      // If anything needs disambiguation, park it for later triage.
      if (result.needs_disambiguation?.length) {
        await query(
          `insert into pending_captures(raw_transcript, source, parsed_intent, candidates, status)
           values ($1,$2,$3,$4,'pending')`,
          [
            transcript,
            source,
            JSON.stringify(actions),
            JSON.stringify(result.needs_disambiguation),
          ]
        );
      }

      return reply.send({
        ok: true,
        transcript,
        actions,
        summary: result.summary,
        spoken_confirmation: result.spoken_confirmation,
        results: result.results,
        needs_disambiguation: result.needs_disambiguation ?? null,
        _debug_raw: process.env.NODE_ENV === "production" ? undefined : raw,
      });
    } catch (e: any) {
      req.log.error(e);
      return reply
        .code(500)
        .send({ ok: false, error: e.message, spoken_confirmation: "Something went wrong." });
    }
  });
}
