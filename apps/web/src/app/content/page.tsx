"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

const STAGES = ["idea", "outline", "filming", "editing", "published", "derivatives_pending", "done"];

export default function ContentPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");

  const load = useCallback(() => { api.get<any[]>("/api/content").then(setItems).catch(() => setItems([])); }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => { if (!title.trim()) return; await api.post("/api/content", { title: title.trim() }); setTitle(""); load(); };

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top"><span className="eyebrow">{t("nav_content")}</span><span className="tz">{items.length}</span></div>
        <h1 className="display">{t("nav_content")}</h1>
      </header>

      <div className="input-row animate-in" style={{ marginBlockEnd: 12 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={t("add_content")} />
        <button className="btn solid" onClick={add}>{t("add")}</button>
      </div>

      {items.length === 0 && <div className="center-empty">{t("module_empty")}</div>}
      {items.map((c) => (
        <div className="trow animate-in" key={c.id}>
          <div className="grow">
            <div className="t-title">{c.title}</div>
            <div className="metaline">
              <span className="meta" style={{ color: c.status === "published" || c.status === "done" ? "var(--accent)" : undefined }}>{String(c.status).replace("_", " ")}</span>
              {c.channel && <span className="meta">{c.channel}</span>}
              <span className="meta">{c.type}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
