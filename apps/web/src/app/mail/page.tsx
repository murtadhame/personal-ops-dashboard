"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

type MailResp = { connected: boolean; email?: string; needs_reconsent?: boolean; messages: any[] };

export default function MailPage() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<MailResp | null>(null);

  useEffect(() => { api.get<MailResp>("/api/gmail/recent").then(setData).catch(() => setData({ connected: false, messages: [] })); }, []);

  const fmt = (d: string) => { const x = new Date(d); return isNaN(+x) ? "" : x.toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { month: "short", day: "numeric" }); };

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top"><span className="eyebrow">{t("nav_mail")}</span>{data?.email && <span className="tz">{data.email}</span>}</div>
        <h1 className="display">{t("nav_mail")}</h1>
      </header>

      {!data && <div className="center-empty">{t("loading")}</div>}

      {data && !data.connected && (
        <div className="brief animate-in">
          <div className="brief-body" style={{ fontSize: "1rem" }}>{data.needs_reconsent ? t("mail_reconnect") : t("mail_connect")}</div>
          <a className="btn solid" href={`${api.base}/api/calendar/google/connect`} style={{ marginBlockStart: 14, display: "inline-flex" }}>{t("connect_google")}</a>
        </div>
      )}

      {data?.connected && data.messages.length === 0 && <div className="center-empty">{t("mail_empty")}</div>}

      {data?.connected && data.messages.map((m) => (
        <div className="trow animate-in" key={m.id}>
          {m.unread && <span className="pdot" style={{ background: "var(--accent)", marginBlockStart: 8 }} />}
          <div className="grow">
            <div className="metaline" style={{ marginBlockStart: 0, marginBlockEnd: 3 }}>
              <span className="meta" style={{ color: m.unread ? "var(--text)" : "var(--text-dim)" }}>{m.from}</span>
              <span className="meta">{fmt(m.date)}</span>
            </div>
            <div className="t-title" style={{ fontWeight: m.unread ? 600 : 400 }}>{m.subject || "(no subject)"}</div>
            {m.snippet && <div className="sub" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.snippet}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
