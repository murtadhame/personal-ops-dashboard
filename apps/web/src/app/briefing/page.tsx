"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { Markdown } from "@/components/Markdown";
import { Icon } from "@/components/Icon";

export default function BriefingPage() {
  const { t, locale } = useLocale();
  const [brief, setBrief] = useState<{ body_md: string } | null>(null);
  const [today, setToday] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<{ body_md: string }>(`/api/briefing/today?lang=${locale}`).then(setBrief).catch(() => {});
    api.get<any>("/api/today").then(setToday).catch(() => {});
  }, [locale]);

  const regen = async () => {
    setBusy(true);
    try { setBrief(await api.post<{ body_md: string }>(`/api/briefing/regenerate?lang=${locale}`)); }
    finally { setBusy(false); }
  };

  const longDate = new Date().toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="page" style={{ maxInlineSize: 820 }}>
      <header className="page-head animate-in">
        <div className="top">
          <Link href="/" className="eyebrow">← {t("nav_today")}</Link>
          <button className="viewall" onClick={regen}>{busy ? t("briefing_loading") : `${t("regenerate")} ↻`}</button>
        </div>
        <h1 className="display">{t("briefing_title")}</h1>
        <div className="greet-date">{longDate}</div>
      </header>

      {brief ? <Markdown>{brief.body_md}</Markdown> : <div className="center-empty">{t("briefing_loading")}</div>}

      {/* Clickable related items */}
      {today && (
        <div style={{ marginBlockStart: 36 }}>
          <div className="section-label">{t("referenced")}</div>
          {(today.top3 ?? []).map((task: any) => (
            <Link className="trow" href="/tasks" key={task.id} style={{ display: "flex" }}>
              <span className="box" />
              <div className="grow"><div className="t-title">{task.title}</div>
                <div className="metaline"><span className="meta proj"><span className="pdot" style={{ background: task.domain_color }} /> {task.domain_name}</span></div>
              </div>
              <span className="star"><Icon name="chevron" size={16} /></span>
            </Link>
          ))}
          {(today.domains ?? []).filter((d: any) => d.slipping).map((d: any) => (
            <Link className="trow" href="/domains" key={d.id} style={{ display: "flex" }}>
              <span className="pdot" style={{ background: d.color, marginBlockStart: 7 }} />
              <div className="grow"><div className="t-title">{d.name}</div>
                <div className="metaline"><span className="meta overdue">{t("slipping")}</span></div>
              </div>
              <span className="star"><Icon name="chevron" size={16} /></span>
            </Link>
          ))}
          <div className="chip-row" style={{ marginBlockStart: 16 }}>
            <Link className="chip" href="/tasks">{t("nav_tasks")}</Link>
            <Link className="chip" href="/routines">{t("nav_routines")}</Link>
            <Link className="chip" href="/nashati">{t("nav_nashati")}</Link>
            <Link className="chip" href="/health">{t("nav_health")}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
