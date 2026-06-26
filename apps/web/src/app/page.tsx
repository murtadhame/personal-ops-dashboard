"use client";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LangToggle } from "@/components/LangToggle";

type Today = {
  date: string;
  profile: { name_en: string; name_ar: string };
  tasks: any[];
  events: any[];
  domains: any[];
  pending_captures: number;
};

function Ring({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0.06, Math.min(1, pct)));
  return (
    <div className="ring">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <span className="ring-ico" style={{ color, fontWeight: 800, fontSize: "0.9rem" }}>{label}</span>
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

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const time = d.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", { hour: "numeric", minute: "2-digit", hour12: locale !== "ar" });
    const [hm, ampm] = time.split(" ");
    return { hm, ampm: ampm ?? "" };
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? t("greet_morning") : h < 18 ? t("greet_afternoon") : t("greet_evening");
  };
  const longDate = new Date().toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { weekday: "long", day: "numeric", month: "long" });

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

  const name = locale === "ar" ? data.profile?.name_ar || data.profile?.name_en : data.profile?.name_en || data.profile?.name_ar;
  const initial = (name || "M").trim().slice(0, 1);
  const openTotal = data.domains.reduce((s, d) => s + Number(d.open_tasks || 0), 0);
  const slipping = data.domains.filter((d) => d.slipping).length;

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div>
          <h1 className="greeting">{greeting()}{name ? <>, <span className="accent">{name}</span></> : null}</h1>
          <div className="greet-date">{longDate}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="desktop-hide"><LangToggle /></span>
          <div className="avatar">{initial}</div>
        </div>
      </header>

      {/* Stat row — h-scroll on mobile, grid on desktop */}
      <div className="hscroll animate-in" style={{ marginBlockEnd: 4 }}>
        <div className="stat"><div className="chip c-purple"><Icon name="checkCircle" size={18} /></div><div className="num">{openTotal}</div><div className="lbl">{t("stat_open")}</div></div>
        <div className="stat"><div className="chip c-coral"><Icon name="activity" size={18} /></div><div className="num">{data.tasks.length}</div><div className="lbl">{t("today_focus")}</div></div>
        <div className="stat"><div className={`chip ${slipping ? "c-danger" : "c-good"}`}><Icon name="alert" size={18} /></div><div className="num">{slipping}</div><div className="lbl">{t("stat_slipping")}</div></div>
        <div className="stat"><div className={`chip ${data.pending_captures ? "c-warn" : "c-info"}`}><Icon name="inbox" size={18} /></div><div className="num">{data.pending_captures}</div><div className="lbl">{t("stat_triage")}</div></div>
      </div>

      <div className="today-grid">
        {/* MAIN column */}
        <div className="today-main">
          <div className="section-label"><span className="ico"><Icon name="checkCircle" size={16} /></span> {t("today_focus")} <span className="count">{data.tasks.length}</span></div>
          {data.tasks.length === 0 && (
            <div className="card animate-in"><div className="center-empty"><div className="ico"><Icon name="sparkles" size={26} /></div>{t("today_no_tasks")}</div></div>
          )}
          {data.tasks.map((task) => (
            <div className="item animate-in" key={task.id} style={{ "--rail": task.domain_color || "var(--accent)" } as CSSProperties}>
              <button className="check" onClick={() => complete(task.id)} aria-label="complete"><Icon name="check" size={14} /></button>
              <div className="grow">
                <div className="title">{task.title}</div>
                <div className="sub">
                  {task.project_name ? <span>{task.project_name}</span> : null}
                  {task.due_date ? <span><Icon name="clock" size={12} style={{ verticalAlign: "-2px" }} /> {String(task.due_date).slice(0, 10)}</span> : null}
                </div>
              </div>
              <span className="badge" style={{ background: `${task.domain_color}1f`, color: task.domain_color || "var(--text-dim)" }}>{task.domain_name}</span>
            </div>
          ))}

          <div className="section-label"><span className="ico"><Icon name="calendar" size={16} /></span> {t("today_schedule")}</div>
          {data.events.length === 0 && (
            <div className="card animate-in"><div className="center-empty"><div className="ico"><Icon name="calendar" size={26} /></div>{t("today_no_events")}</div></div>
          )}
          {data.events.map((ev) => {
            const time = ev.all_day ? null : fmtTime(ev.starts_at);
            const railColor = ev.provider === "microsoft" ? "var(--info)" : "var(--accent)";
            return (
              <div className="item animate-in" key={ev.id} style={{ "--rail": railColor } as CSSProperties}>
                <div className="item-time">{time ? <>{time.hm}<span className="ampm">{time.ampm}</span></> : "—"}</div>
                <div className="grow">
                  <div className="title">{ev.title}</div>
                  {ev.location && <div className="sub">{ev.location}</div>}
                </div>
                <span className={`badge ${ev.provider === "microsoft" ? "work" : "google"}`}>{ev.provider === "microsoft" ? "Outlook" : "Google"}</span>
              </div>
            );
          })}
        </div>

        {/* RIGHT rail */}
        <aside className="today-rail">
          <div className="section-label"><span className="ico"><Icon name="grid" size={16} /></span> {t("today_domains")}</div>
          <div className="hscroll">
            {data.domains.map((d) => (
              <div className="domain-card" key={d.id}>
                <Ring pct={d.slipping ? 0.28 : 1} color={d.slipping ? "var(--danger)" : "var(--good)"} label={String(d.name).slice(0, 1)} />
                <div className="grow">
                  <div className="nm">{d.name}</div>
                  <div className="meta">{d.open_tasks} {t("open_tasks")}</div>
                </div>
                {d.slipping && <Icon name="alert" size={16} style={{ color: "var(--danger)" }} />}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
