"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { LangToggle } from "@/components/LangToggle";

type Today = {
  date: string;
  tasks: any[];
  events: any[];
  domains: any[];
  pending_captures: number;
};

export default function TodayPage() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<Today | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<Today>("/api/today")
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("pod:captured", h);
    return () => window.removeEventListener("pod:captured", h);
  }, [load]);

  async function complete(id: string) {
    await api.post(`/api/tasks/${id}/complete`);
    load();
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (err)
    return (
      <div className="page">
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <strong>API not reachable.</strong>
          <p className="muted">{err}</p>
          <p className="muted">Make sure the backend is running on :4000 and your .env is set.</p>
        </div>
      </div>
    );

  if (!data) return <div className="page center-empty">{t("loading")}</div>;

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t("today_title")}</h1>
        <LangToggle />
      </div>

      {data.pending_captures > 0 && (
        <div className="badge slip" style={{ marginBlockEnd: 10 }}>
          {data.pending_captures} {t("pending_triage")}
        </div>
      )}

      {/* Top tasks */}
      <div className="section-label">{t("today_focus")}</div>
      <div className="card">
        {data.tasks.length === 0 && <div className="center-empty">{t("today_no_tasks")}</div>}
        {data.tasks.map((task) => (
          <div className="row" key={task.id}>
            <button className="check" onClick={() => complete(task.id)} aria-label="complete">
              ✓
            </button>
            <div className="grow">
              <div className="title">{task.title}</div>
              <div className="sub">
                {task.project_name ? `${task.project_name} · ` : ""}
                {task.due_date ?? ""}
              </div>
            </div>
            <span className="badge" style={{ borderInlineStart: `3px solid ${task.domain_color || "var(--border)"}` }}>
              {task.domain_name}
            </span>
          </div>
        ))}
      </div>

      {/* Schedule — both calendars */}
      <div className="section-label">{t("today_schedule")}</div>
      <div className="card">
        {data.events.length === 0 && <div className="center-empty">{t("today_no_events")}</div>}
        {data.events.map((ev) => (
          <div className="row" key={ev.id}>
            <div style={{ width: 54, color: "var(--text-dim)", fontSize: "0.82rem", flex: "none" }}>
              {ev.all_day ? "—" : fmtTime(ev.starts_at)}
            </div>
            <div className="grow">
              <div className="title">{ev.title}</div>
              {ev.location && <div className="sub">{ev.location}</div>}
            </div>
            <span className={`badge ${ev.provider === "microsoft" ? "work" : ""}`}>
              {ev.provider === "microsoft" ? "Outlook" : "Google"}
            </span>
          </div>
        ))}
      </div>

      {/* Domain status / slippage */}
      <div className="section-label">{t("today_domains")}</div>
      <div className="card">
        {data.domains.map((d) => (
          <div className="row" key={d.id}>
            <span className="dot" style={{ background: d.color || "var(--border)" }} />
            <div className="grow">
              <div className="title">{d.name}</div>
              <div className="sub">
                {d.open_tasks} {t("open_tasks")}
              </div>
            </div>
            <span className={`badge ${d.slipping ? "slip" : "ok"}`}>
              {d.slipping ? t("slipping") : t("on_track")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
