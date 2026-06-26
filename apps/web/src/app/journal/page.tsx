"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

export default function JournalPage() {
  const { t, locale } = useLocale();
  const [entries, setEntries] = useState<any[]>([]);
  const [text, setText] = useState("");

  const load = useCallback(() => { api.get<any[]>("/api/journal").then(setEntries).catch(() => setEntries([])); }, []);
  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("pod:captured", h);
    return () => window.removeEventListener("pod:captured", h);
  }, [load]);

  const add = async () => { if (!text.trim()) return; await api.post("/api/journal", { text: text.trim() }); setText(""); load(); };
  const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top"><span className="eyebrow">{t("nav_journal")}</span><span className="tz">{entries.length}</span></div>
        <h1 className="display">{t("nav_journal")}</h1>
      </header>

      <div className="animate-in" style={{ marginBlockEnd: 14 }}>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("add_entry")} style={{ marginBlockEnd: 8 }} />
        <button className="btn solid" onClick={add}>{t("add_entry")}</button>
      </div>

      {entries.length === 0 && <div className="center-empty">{t("module_empty")}</div>}
      {entries.map((e) => (
        <div className="animate-in" key={e.id} style={{ paddingBlock: 18, borderBlockEnd: "1px solid var(--line-soft)" }}>
          <div className="meta">{fmt(String(e.entry_date).slice(0, 10))}{e.source === "voice" ? " · VOICE" : ""}</div>
          {e.title && <div className="t-title" style={{ fontSize: "1.2rem", marginBlock: "6px 4px" }}>{e.title}</div>}
          <p style={{ fontFamily: "var(--serif)", fontSize: "1.05rem", lineHeight: 1.55, margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{e.transcription_text}</p>
        </div>
      ))}
    </div>
  );
}
