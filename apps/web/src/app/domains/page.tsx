"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

export default function DomainsPage() {
  const { t, locale } = useLocale();
  const [domains, setDomains] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>("/api/domains/status").then(setDomains).catch(() => setDomains([]));
  }, []);

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
          month: "short",
          day: "numeric",
        })
      : t("never");

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t("domains_title")}</h1>
      </div>

      {domains.map((d) => (
        <div className="card" key={d.id}>
          <div className="row" style={{ borderBlockEnd: "none", paddingBlock: 0 }}>
            <span className="dot" style={{ background: d.color || "var(--border)" }} />
            <div className="grow">
              <div className="title" style={{ fontSize: "1.05rem" }}>
                {d.name}
              </div>
              <div className="sub">
                {d.open_tasks} {t("open_tasks")} · {t("last_activity")}: {fmtDate(d.last_activity_at)}
              </div>
            </div>
            <span className={`badge ${d.slipping ? "slip" : "ok"}`}>
              {d.slipping ? t("slipping") : t("on_track")}
            </span>
          </div>
        </div>
      ))}
      {domains.length === 0 && <div className="center-empty">{t("loading")}</div>}
    </div>
  );
}
