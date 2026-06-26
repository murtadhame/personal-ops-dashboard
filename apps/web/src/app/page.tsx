"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LangToggle } from "@/components/LangToggle";

type Today = {
  date: string;
  tasks: any[];
  events: any[];
  domains: any[];
  pending_captures: number;
};

function Ring({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0.06, Math.min(1, pct)));
  return (
    <div className="ring">
      <svg width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
        <circle
          cx="21" cy="21" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        />
      </svg>
      <span className="ring-ico" style={{ color, fontWeight: 700, fontSize: "0.85rem" }}>{label}</span>
    </div>
  );
}

export default function TodayPage() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<Today | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<Today>("/api/today").then(setData).catch((e) => setErr(e.message));
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
    new Date(iso).toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? t("greet_morning") : h < 18 ? t("greet_afternoon") : t("greet_evening");
  };
  const longDate = new Date().toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    weekday: "long", day: "numeric", month: "long",
  });

  if (err)
    return (
      <div className="page">
        <div className="card pad" style={{ borderColor: "var(--danger)" }}>
          <strong>API not reachable.</strong>
          <p className="muted">{err}</p>
          <p className="muted">Make sure the backend is running on :4000 and your .env is set.</p>
        </div>
      </div>
    );

  if (!data) return <div className="page center-empty">{t("loading")}</div>;

  const openTotal = data.domains.reduce((s, d) => s + Number(d.open_tasks || 0), 0);
  const slipping = data.domains.filter((d) => d.slipping).length;

  return (
    <div className="page">
      {/* Greeting */}
      <header className="page-head animate-in">
        <div>
          <h1 className="greeting">
            {greeting()}, <span className="accent">Murtadha</span>
          </h1>
          <div className="greet-date">{longDate}</div>
        </div>
        <span className="desktop-hide"><LangToggle /></span>
      </header>

      {/* Stat row */}
      <div className="stats animate-in">
        <div className="stat"><div className="num">{openTotal}</div><div className="lbl">{t("stat_open")}</div></div>
        <div className="stat"><div className="num">{data.tasks.length}</div><div className="lbl">{t("today_focus")}</div></div>
        <div className={`stat ${slipping ? "alert" : "good"}`}><div className="num">{slipping}</div><div className="lbl">{t("stat_slipping")}</div></div>
        <div className={`stat ${data.pending_captures ? "alert" : ""}`}><div className="num">{data.pending_captures}</div><div className="lbl">{t("stat_triage")}</div></div>
      </div>

      {/* Top tasks */}
      <div className="section-label">
        <Icon name="checkCircle" size={15} /> {t("today_focus")}
      </div>
      <div className="card animate-in">
        {data.tasks.length === 0 && (
          <div className="center-empty">
            <div className="ico"><Icon name="sparkles" size={26} /></div>
            {t("today_no_tasks")}
          </div>
        )}
        {data.tasks.map((task) => (
          <div className="row" key={task.id}>
            <span className={`rail ${task.priority === "urgent" ? "urgent" : task.priority === "high" ? "high" : ""}`} />
            <button className="check" onClick={() => complete(task.id)} aria-label="complete">
              <Icon name="check" size={14} />
            </button>
            <div className="grow">
              <div className="title">{task.title}</div>
              <div className="sub">
                {task.project_name ? <span>{task.project_name}</span> : null}
                {task.due_date ? <span><Icon name="clock" size={12} style={{ verticalAlign: "-2px" }} /> {String(task.due_date).slice(0, 10)}</span> : null}
              </div>
            </div>
            <span className="badge" style={{ background: `${task.domain_color}22`, color: task.domain_color || "var(--text-dim)" }}>
              {task.domain_name}
            </span>
          </div>
        ))}
      </div>

      {/* Schedule — both calendars */}
      <div className="section-label">
        <Icon name="calendar" size={15} /> {t("today_schedule")}
      </div>
      <div className="card animate-in">
        {data.events.length === 0 && (
          <div className="center-empty">
            <div className="ico"><Icon name="calendar" size={26} /></div>
            {t("today_no_events")}
          </div>
        )}
        {data.events.map((ev) => (
          <div className="tl-row" key={ev.id}>
            <div className="tl-time">{ev.all_day ? "—" : fmtTime(ev.starts_at)}</div>
            <div className="tl-body">
              <span className="tl-rail" style={{ background: ev.provider === "microsoft" ? "var(--info)" : "var(--accent)" }} />
              <div className="grow">
                <div className="title">{ev.title}</div>
                {ev.location && <div className="sub">{ev.location}</div>}
              </div>
              <span className={`badge ${ev.provider === "microsoft" ? "work" : "google"}`}>
                {ev.provider === "microsoft" ? "Outlook" : "Google"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Domain health */}
      <div className="section-label">
        <Icon name="grid" size={15} /> {t("today_domains")}
      </div>
      <div className="domains-grid animate-in">
        {data.domains.map((d) => (
          <div className="domain-card" key={d.id}>
            <Ring
              pct={d.slipping ? 0.28 : 1}
              color={d.slipping ? "var(--danger)" : "var(--good)"}
              label={String(d.name).slice(0, 1)}
            />
            <div className="grow">
              <div className="nm">{d.name}</div>
              <div className="meta">{d.open_tasks} {t("open_tasks")}</div>
            </div>
            {d.slipping && <Icon name="alert" size={16} style={{ color: "var(--danger)" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
