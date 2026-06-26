"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { Markdown } from "@/components/Markdown";

export default function SummaryPage() {
  const { t } = useLocale();
  const [data, setData] = useState<any>(null);

  useEffect(() => { api.get<any>("/api/summaries/latest").then(setData).catch(() => setData({ connected: false })); }, []);

  return (
    <div className="page" style={{ maxInlineSize: 820 }}>
      <header className="page-head animate-in">
        <div className="top">
          <Link href="/" className="eyebrow">← {t("nav_today")}</Link>
          {data?.file?.html_url && <a className="viewall" href={data.file.html_url} target="_blank" rel="noreferrer">GitHub →</a>}
        </div>
        <h1 className="display">{t("latest_summary")}</h1>
        {data?.file?.name && <div className="greet-date">{data.file.name}</div>}
      </header>

      {!data && <div className="center-empty">{t("loading")}</div>}
      {data && data.connected === false && data.needs_token && <p className="muted">{t("summary_needs_token")}</p>}
      {data?.file?.content && <Markdown>{data.file.content}</Markdown>}
    </div>
  );
}
