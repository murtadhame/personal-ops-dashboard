"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

export default function ProjectsPage() {
  const { t } = useLocale();
  const [projects, setProjects] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [domainId, setDomainId] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function load() {
    api.get<any[]>("/api/projects?status=active").then(setProjects).catch(() => setProjects([]));
  }
  useEffect(() => {
    load();
    api.get<any[]>("/api/domains").then(setDomains).catch(() => {});
  }, []);

  async function add() {
    if (!name.trim() || !domainId) return;
    await api.post("/api/projects", {
      name: name.trim(),
      domain_id: domainId,
      target_date: targetDate || undefined,
    });
    setName("");
    setTargetDate("");
    setShowAdd(false);
    load();
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t("projects_title")}</h1>
        <button className="btn primary sm" onClick={() => setShowAdd(true)}>
          + {t("add_project")}
        </button>
      </div>

      <div className="card">
        {projects.length === 0 && <div className="center-empty">—</div>}
        {projects.map((p) => (
          <div className="row" key={p.id}>
            <span className="dot" style={{ background: p.domain_color || "var(--border)" }} />
            <div className="grow">
              <div className="title">{p.name}</div>
              <div className="sub">
                {p.domain_name}
                {p.target_date ? ` · ${p.target_date}` : ""} · {p.open_tasks} {t("open_tasks")}
              </div>
            </div>
            {Number(p.milestone_count) > 0 && (
              <span className="badge">
                {p.milestones_done}/{p.milestone_count} {t("milestones")}
              </span>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="sheet-backdrop" onClick={() => setShowAdd(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>{t("add_project")}</h3>
            <input
              placeholder={t("project_name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              style={{ marginBlockStart: 8 }}
            >
              <option value="">—</option>
              {domains
                .filter((d) => d.name !== "Inbox")
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{ marginBlockStart: 8 }}
            />
            <div className="actions">
              <button className="btn" onClick={() => setShowAdd(false)}>
                {t("cancel")}
              </button>
              <button className="btn primary" onClick={add}>
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
