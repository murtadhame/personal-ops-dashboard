"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icon";

export default function TasksPage() {
  const { t } = useLocale();
  const [tasks, setTasks] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");
  const [title, setTitle] = useState("");
  const [domainId, setDomainId] = useState("");

  const load = useCallback(() => {
    const q = filter === "all" ? "" : filter === "done" ? "?status=done" : "?status=todo";
    api.get<any[]>(`/api/tasks${q}`).then(setTasks).catch(() => setTasks([]));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get<any[]>("/api/domains").then(setDomains).catch(() => {});
    const h = () => load();
    window.addEventListener("pod:captured", h);
    return () => window.removeEventListener("pod:captured", h);
  }, [load]);

  async function add() {
    if (!title.trim()) return;
    await api.post("/api/tasks", { title: title.trim(), domain_id: domainId || undefined });
    setTitle("");
    load();
  }

  async function toggle(task: any) {
    if (task.status === "done") {
      await api.patch(`/api/tasks/${task.id}`, { status: "todo" });
    } else {
      await api.post(`/api/tasks/${task.id}/complete`);
    }
    load();
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t("tasks_title")}</h1>
      </div>

      <div className="card">
        <div className="input-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={t("task_placeholder")}
          />
          <button className="btn primary" onClick={add}>
            {t("add")}
          </button>
        </div>
        <select
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          style={{ marginBlockStart: 8 }}
        >
          <option value="">{t("inbox")}</option>
          {domains
            .filter((d) => d.name !== "Inbox")
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
      </div>

      <div className="lang-toggle" style={{ marginBlockEnd: 12 }}>
        {(["open", "all", "done"] as const).map((f) => (
          <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
            {t(f)}
          </button>
        ))}
      </div>

      <div className="card">
        {tasks.length === 0 && <div className="center-empty">—</div>}
        {tasks.map((task) => (
          <div className="row" key={task.id}>
            <button
              className={`check ${task.status === "done" ? "done" : ""}`}
              onClick={() => toggle(task)}
              aria-label="toggle"
            >
              <Icon name="check" size={14} />
            </button>
            <div className="grow">
              <div className={`title ${task.status === "done" ? "strike" : ""}`}>{task.title}</div>
              <div className="sub">
                {task.project_name ? `${task.project_name} · ` : ""}
                {task.due_date ?? ""}
              </div>
            </div>
            <span
              className="badge"
              style={{ borderInlineStart: `3px solid ${task.domain_color || "var(--border)"}` }}
            >
              {task.domain_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
