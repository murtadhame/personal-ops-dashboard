// Executes parsed actions against the database. Resolves fuzzy *_match
// references to real IDs, writes rows, logs a notification per action, and
// returns a human summary + a short spoken confirmation for voice clients.
import { one, query } from "../db.js";
import type { ParsedAction } from "./parse.js";

async function inboxDomainId(): Promise<string> {
  const row = await one<{ id: string }>(
    "select id from stewardship_domains where name = 'Inbox' limit 1"
  );
  if (!row) throw new Error("Inbox domain missing — run the seed migration.");
  return row.id;
}

async function resolveDomain(match?: string): Promise<string | null> {
  if (!match) return null;
  const row = await one<{ id: string }>(
    `select id from stewardship_domains
     where active = true and (name ilike $1 or name ilike $2)
     order by (name ilike $1) desc limit 1`,
    [match, `%${match}%`]
  );
  return row?.id ?? null;
}

async function resolveProject(
  match?: string
): Promise<{ id: string; domain_id: string } | null> {
  if (!match) return null;
  const row = await one<{ id: string; domain_id: string }>(
    `select id, domain_id from projects
     where status = 'active' and (name ilike $1 or name ilike $2)
     order by (name ilike $1) desc, updated_at desc limit 1`,
    [match, `%${match}%`]
  );
  return row ?? null;
}

async function resolveTask(match?: string): Promise<{ id: string; title: string } | null> {
  if (!match) return null;
  const row = await one<{ id: string; title: string }>(
    `select id, title from tasks
     where status <> 'done' and (title ilike $1 or title ilike $2)
     order by (title ilike $1) desc, created_at desc limit 1`,
    [match, `%${match}%`]
  );
  return row ?? null;
}

async function notify(type: string, title: string, body: string, sourceRef?: string) {
  await query(
    "insert into notifications(type, title, body, source_ref) values ($1,$2,$3,$4)",
    [type, title, body, sourceRef ?? null]
  );
}

export type ExecutionResult = {
  ok: boolean;
  summary: string[];
  spoken_confirmation: string;
  results: any[];
  needs_disambiguation?: { action: ParsedAction; candidates: any }[];
};

export async function executeActions(
  actions: ParsedAction[],
  source: string
): Promise<ExecutionResult> {
  const summary: string[] = [];
  const results: any[] = [];
  const pendings: { action: ParsedAction; candidates: any }[] = [];

  for (const action of actions) {
    if (action.error) {
      summary.push(`Couldn't parse: ${action.error}`);
      continue;
    }
    if (action.needs_disambiguation) {
      pendings.push({ action, candidates: action.candidates ?? [] });
      continue;
    }

    const type = action.type ?? inferType(action);
    try {
      switch (type) {
        case "create_task": {
          const project = await resolveProject(action.project_match);
          const domainId =
            project?.domain_id ??
            (await resolveDomain(action.domain_match)) ??
            (await inboxDomainId());
          const parent = await resolveTask(action.parent_task_match);
          const row = await one<{ id: string; title: string }>(
            `insert into tasks(title, notes, domain_id, project_id, parent_task_id,
                               due_date, due_time, priority, reminder_offsets, source)
             values ($1,$2,$3,$4,$5,$6,$7,coalesce($8,'normal'),coalesce($9,'[]'::jsonb),$10)
             returning id, title`,
            [
              action.title,
              action.notes ?? null,
              domainId,
              project?.id ?? null,
              parent?.id ?? null,
              action.due_date ?? null,
              action.due_time ?? null,
              action.priority ?? null,
              JSON.stringify(action.reminder_offsets ?? []),
              source === "voice" ? "voice" : source,
            ]
          );
          summary.push(`Task: "${row!.title}"`);
          results.push({ type, id: row!.id });
          await notify("task_created", "Task created", row!.title, `task:${row!.id}`);
          break;
        }

        case "complete_task": {
          const task = await resolveTask(action.task_match);
          if (!task) {
            summary.push(`No open task matched "${action.task_match}"`);
            break;
          }
          await query(
            "update tasks set status='done', completed_at=now() where id=$1",
            [task.id]
          );
          summary.push(`Completed: "${task.title}"`);
          results.push({ type, id: task.id });
          await notify("task_completed", "Task completed", task.title, `task:${task.id}`);
          break;
        }

        case "create_project": {
          const domainId =
            (await resolveDomain(action.domain_match)) ?? (await inboxDomainId());
          const row = await one<{ id: string; name: string }>(
            `insert into projects(name, domain_id, target_date)
             values ($1,$2,$3) returning id, name`,
            [action.name, domainId, action.target_date ?? null]
          );
          summary.push(`Project: "${row!.name}"`);
          results.push({ type, id: row!.id });
          await notify("project_created", "Project created", row!.name, `project:${row!.id}`);
          break;
        }

        case "update_project_status": {
          const project = await resolveProject(action.project_match);
          if (!project) {
            summary.push(`No project matched "${action.project_match}"`);
            break;
          }
          await query("update projects set status=$1 where id=$2", [
            action.status,
            project.id,
          ]);
          summary.push(`Project status → ${action.status}`);
          results.push({ type, id: project.id });
          break;
        }

        case "log_activity": {
          const project = await resolveProject(action.project_match);
          const domainId = project?.domain_id ?? (await resolveDomain(action.domain_match));
          const row = await one<{ id: string }>(
            `insert into activity_log(project_id, domain_id, entry, hours_logged, source)
             values ($1,$2,$3,$4,$5) returning id`,
            [
              project?.id ?? null,
              domainId,
              action.entry,
              action.hours_logged ?? null,
              source,
            ]
          );
          summary.push(
            `Logged${action.hours_logged ? ` ${action.hours_logged}h` : ""}: ${action.entry}`
          );
          results.push({ type, id: row!.id });
          break;
        }

        case "create_note": {
          const row = await one<{ id: string }>(
            `insert into notes(body, source_type, tags)
             values ($1, coalesce($2,'own_thought'), coalesce($3,'{}'))
             returning id`,
            [action.body, action.source_type ?? null, action.tags ?? null]
          ).catch(() => null); // notes table arrives in Phase 3; ignore if absent
          if (row) {
            summary.push(`Note saved`);
            results.push({ type, id: row.id });
          } else {
            summary.push(`Note captured (notes module not enabled yet)`);
          }
          break;
        }

        case "create_calendar_event": {
          summary.push(
            `Calendar event "${action.title}" — creating events is a Phase 1.5 item; captured as a task instead.`
          );
          const domainId = await inboxDomainId();
          const row = await one<{ id: string }>(
            `insert into tasks(title, domain_id, due_date, priority, source)
             values ($1,$2,$3,'normal',$4) returning id`,
            [`[event] ${action.title}`, domainId, action.start?.slice?.(0, 10) ?? null, source]
          );
          results.push({ type: "create_task", id: row!.id });
          break;
        }

        default:
          summary.push(`Unknown action type: ${type}`);
      }
    } catch (e: any) {
      summary.push(`Error on ${type}: ${e.message}`);
    }
  }

  const spoken =
    pendings.length > 0
      ? "I need a quick clarification on one item."
      : summary.length === 1
        ? summary[0]
        : `Done. ${summary.length} item${summary.length === 1 ? "" : "s"} captured.`;

  return {
    ok: true,
    summary,
    spoken_confirmation: spoken,
    results,
    needs_disambiguation: pendings.length ? pendings : undefined,
  };
}

/** When the model omits "type", infer it from the action's shape. */
function inferType(a: ParsedAction): string {
  if (a.type) return a.type;
  if (a.task_match && Object.keys(a).length <= 2) return "complete_task";
  if (a.name && a.domain_match) return "create_project";
  if (a.entry) return "log_activity";
  if (a.body) return "create_note";
  if (a.title) return "create_task";
  return "create_task";
}
