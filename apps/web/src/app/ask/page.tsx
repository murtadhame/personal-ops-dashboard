"use client";
import { useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

export default function AskPage() {
  const { t, locale } = useLocale();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    if (!q.trim() || busy) return;
    setBusy(true); setAnswer(null);
    try {
      const r = await api.post<{ answer: string }>("/api/ask", { question: q.trim(), lang: locale });
      setAnswer(r.answer);
    } catch (e: any) { setAnswer(`Error: ${e.message}`); }
    finally { setBusy(false); }
  };

  const samples = ["Is Nashati up to date?", "What's slipping right now?", "What should I focus on today?"];

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top"><span className="eyebrow">{t("ask_title")}</span></div>
        <h1 className="display">{t("ask_title")}</h1>
        <p className="muted" style={{ marginBlockStart: 8 }}>{t("ask_subtitle")}</p>
      </header>

      <div className="animate-in">
        <textarea rows={2} value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ask(); }}
          placeholder={t("ask_placeholder")} style={{ marginBlockEnd: 10 }} />
        <div className="chip-row">
          <button className="btn solid" onClick={ask} disabled={busy}>{busy ? t("thinking") : t("ask")}</button>
          {samples.map((s) => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}
        </div>
      </div>

      {busy && <div className="ask-answer muted">{t("thinking")}</div>}
      {answer && <div className="ask-answer">{answer}</div>}
    </div>
  );
}
