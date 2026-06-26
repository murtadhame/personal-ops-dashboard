"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LangToggle } from "@/components/LangToggle";

type Today = {
  date: string;
  profile: { name_en: string; name_ar: string };
  top3: any[];
  open: any[];
  events: any[];
  domains: any[];
  routines: { groups: { part: string; items: any[] }[]; done: number; total: number };
  resurface: { kind: string; body: string; meta: string } | null;
  needs_review: { count: number; notes: any[] };
};

const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local

function bucketOf(due: string | null): string {
  if (!due) return "someday";
  const d = String(due).slice(0, 10);
  const diff = Math.round((Date.parse(d + "T00:00:00Z") - Date.parse(todayStr() + "T00:00:00Z")) / 86400000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 7) return "this_week";
  return "later";
}
const BUCKETS = ["overdue", "today", "tomorrow", "this_week", "later", "someday"];

export default function TodayPage() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<Today | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [brief, setBrief] = useState<{ body_md: string } | null>(null);
  const [briefBusy, setBriefBusy] = useState(false);

  const load = useCallback(() => {
    api.get<Today>("/api/today").then(setData).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("pod:captured", h);
    return () => window.removeEventListener("pod:captured", h);
  }, [load]);

  useEffect(() => {
    setBrief(null);
    api.get<{ body_md: string }>(`/api/briefing/today?lang=${locale}`).then(setBrief).catch(() => {});
  }, [locale]);

  const regenBrief = async () => {
    setBriefBusy(true);
    try { setBrief(await api.post<{ body_md: string }>(`/api/briefing/regenerate?lang=${locale}`)); }
    finally { setBriefBusy(false); }
  };

  const complete = async (id: string) => { await api.post(`/api/tasks/${id}/complete`); load(); };
  const star = async (id: string) => { await api.post(`/api/tasks/${id}/star`); load(); };
  const toggleRoutine = async (id: string) => { await api.post(`/api/routines/${id}/toggle`); load(); };

  const evWhen = (iso: string, allDay: boolean) => {
    const d = new Date(iso);
    const opts = locale === "ar" ? "ar-SA" : "en-US";
    const sameDay = d.toLocaleDateString("en-CA") === todayStr();
    const day = sameDay ? "" : d.toLocaleDateString(opts, { weekday: "short" });
    const h = allDay ? "—" : d.toLocaleTimeString(opts, { hour: "numeric", minute: "2-digit" });
    return { day, h };
  };

  if (err)
    return (
      <div className="page"><div className="trow"><div><div className="t-title">API not reachable.</div><div className="muted" style={{ marginBlockStart: 6 }}>{err}</div></div></div></div>
    );
  if (!data) return <div className="page center-empty">{t("loading")}</div>;

  const name = locale === "ar" ? data.profile?.name_ar || data.profile?.name_en : data.profile?.name_en || data.profile?.name_ar;
  const greet = () => { const h = new Date().getHours(); return h < 12 ? t("greet_morning") : h < 18 ? t("greet_afternoon") : t("greet_evening"); };
  const longDate = new Date().toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric" });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const grouped = BUCKETS.map((b) => ({ b, items: data.open.filter((task) => bucketOf(task.due_date) === b) })).filter((g) => g.items.length);
  const partLabel: Record<string, string> = { morning: t("part_morning"), afternoon: t("part_afternoon"), evening: t("part_evening"), anytime: t("part_anytime") };
  const grpLabel: Record<string, string> = { overdue: t("grp_overdue"), today: t("grp_today"), tomorrow: t("grp_tomorrow"), this_week: t("grp_this_week"), later: t("grp_later"), someday: t("grp_someday") };

  const TaskRow = ({ task, showStar = true }: { task: any; showStar?: boolean }) => (
    <div className="trow">
      <button className="box" onClick={() => complete(task.id)} aria-label="complete"><Icon name="check" size={12} /></button>
      <div className="grow">
        <div className="t-title">{task.title}</div>
        <div className="metaline">
          {task.project_name && <span className="meta proj"><span className="pdot" style={{ background: task.domain_color || "var(--text-faint)" }} /> {task.project_name}</span>}
          {(() => {
            const b = bucketOf(task.due_date);
            if (b === "overdue") {
              const days = Math.abs(Math.round((Date.parse(String(task.due_date).slice(0,10) + "T00:00:00Z") - Date.parse(todayStr() + "T00:00:00Z")) / 86400000));
              return <span className="meta overdue">{t("grp_overdue")} {days}D</span>;
            }
            if (b === "today") return <span className="meta due">{t("due_today")}</span>;
            if (task.due_date) return <span className="meta due">{String(task.due_date).slice(0, 10)}</span>;
            return null;
          })()}
          {task.recurrence_rule && <span className="meta repeat">↻</span>}
        </div>
      </div>
      {showStar && (
        <button className={`star ${task.is_starred ? "on" : ""}`} onClick={() => star(task.id)} aria-label="star">
          <Icon name={task.is_starred ? "star" : "starOutline"} size={17} />
        </button>
      )}
    </div>
  );

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top">
          <span className="eyebrow">{greet()}{name ? `, ${name}` : ""}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="tz">{tz}</span>
            <span className="desktop-hide"><LangToggle /></span>
          </span>
        </div>
        <h1 className="display">{longDate}</h1>
      </header>

      <div className="today-grid">
        {/* MAIN */}
        <div className="today-main animate-in">
          {/* Daily briefing */}
          <div className="brief">
            <div className="sec" style={{ margin: "0 0 12px" }}>
              <span className="eyebrow">{t("briefing_title")}</span>
              <button className="viewall" onClick={regenBrief}>{briefBusy ? t("briefing_loading") : `${t("regenerate")} ↻`}</button>
            </div>
            {brief ? <div className="brief-body">{brief.body_md}</div> : <div className="muted" style={{ fontSize: "0.9rem" }}>{t("briefing_loading")}</div>}
          </div>

          {/* Top 3 */}
          <div className="sec"><span className="eyebrow">{t("top3_title")}</span></div>
          <hr className="hr" />
          {data.top3.map((task) => <TaskRow key={task.id} task={task} />)}
          {Array.from({ length: Math.max(0, 3 - data.top3.length) }).map((_, i) => (
            <div className="trow" key={`spot-${i}`}><span className="box" /><div className="muted" style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>{t("open_spot")}</div></div>
          ))}
          {data.top3.length < 3 && <p className="muted" style={{ fontSize: "0.85rem", marginBlock: "10px 0" }}>{t("star_hint")}</p>}

          {/* Up Next */}
          <div className="sec"><span className="eyebrow">{t("up_next")}</span><span className="viewall">{t("view_all")} →</span></div>
          <hr className="hr" />
          {data.events.length === 0 && <div className="trow"><span className="muted">{t("today_no_events")}</span></div>}
          {data.events.map((ev) => {
            const w = evWhen(ev.starts_at, ev.all_day);
            return (
              <div className="ev" key={ev.id}>
                <div className="when"><div className="d">{w.day}</div><div className="h">{w.h}</div></div>
                <div className="grow"><div className="ev-title">{ev.title}</div>{ev.location && <div className="ev-loc">{ev.location}</div>}</div>
              </div>
            );
          })}

          {/* All Open */}
          <div className="sec"><span className="eyebrow">{t("all_open")} <span className="count">· {data.open.length}</span></span></div>
          <hr className="hr" />
          {grouped.map((g) => (
            <div key={g.b}>
              <div className="grp">{grpLabel[g.b]} <span className="n">· {g.items.length}</span></div>
              {g.items.map((task) => <TaskRow key={task.id} task={task} />)}
            </div>
          ))}
        </div>

        {/* RIGHT RAIL */}
        <aside className="today-rail animate-in">
          {/* Slipping */}
          <div className="rail-block">
            <div className="eyebrow">{t("slipping_title")}</div>
            {data.domains.filter((d) => d.slipping).length === 0 ? (
              <p className="body" style={{ marginBlockStart: 10 }}>{t("nothing_slipping")}</p>
            ) : (
              <div style={{ marginBlockStart: 8 }}>
                {data.domains.filter((d) => d.slipping).map((d) => (
                  <div className="routine" key={d.id}>
                    <span className="pdot" style={{ background: d.color }} />
                    <span className="grow">{d.name}</span>
                    <span className="missed">{d.open_tasks} {t("open_tasks")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Routines */}
          <div className="rail-block">
            <div className="sec" style={{ margin: 0 }}>
              <span className="eyebrow">{t("routines_title")} <span className="count">· {data.routines.done}/{data.routines.total}</span></span>
              <a href="/routines" className="viewall">{t("view_all")} →</a>
            </div>
            {data.routines.groups.map((g) => (
              <div key={g.part}>
                <div className="routine-grp">{partLabel[g.part] ?? g.part}</div>
                {g.items.map((r) => (
                  <div className={`routine ${r.done_today ? "done" : ""}`} key={r.id}>
                    <button className={`box ${r.done_today ? "done" : ""}`} onClick={() => toggleRoutine(r.id)} aria-label="toggle"><Icon name="check" size={11} /></button>
                    <span className="grow">{r.emoji ? `${r.emoji} ` : ""}{r.name}</span>
                    {r.streak > 0 ? <span className="streak">🔥 {r.streak}</span> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Resurfacing */}
          <div className="rail-block">
            <div className="eyebrow">{t("resurfacing_title")}</div>
            {data.resurface ? (
              <div style={{ marginBlockStart: 10 }}>
                <p className="q" style={{ fontFamily: "var(--serif)", fontSize: "1.02rem", lineHeight: 1.4, margin: 0 }}>{data.resurface.body}</p>
                {data.resurface.meta && <div className="meta" style={{ marginBlockStart: 8 }}>{data.resurface.meta}</div>}
              </div>
            ) : (
              <p className="body" style={{ marginBlockStart: 10 }}>{t("resurface_empty")}</p>
            )}
          </div>

          {/* Needs Review */}
          <div className="rail-block">
            <div className="sec" style={{ margin: 0 }}><span className="eyebrow">{t("needs_review_title")} <span className="count">· {data.needs_review.count}</span></span></div>
            {data.needs_review.notes.length === 0 ? (
              <p className="body" style={{ marginBlockStart: 10 }}>—</p>
            ) : (
              data.needs_review.notes.map((n) => (
                <div className="review-card" key={n.id}>
                  <div className="q">{n.title}</div>
                  <div className="meta" style={{ marginBlockStart: 8 }}>{n.source_type}</div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
