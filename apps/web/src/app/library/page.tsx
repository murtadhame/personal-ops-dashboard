"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

export default function LibraryPage() {
  const { t } = useLocale();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");

  const load = useCallback(() => { api.get<any[]>("/api/quotes").then(setQuotes).catch(() => setQuotes([])); }, []);
  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("pod:captured", h);
    return () => window.removeEventListener("pod:captured", h);
  }, [load]);

  const add = async () => { if (!text.trim()) return; await api.post("/api/quotes", { text: text.trim(), source_author: author.trim() || undefined }); setText(""); setAuthor(""); load(); };

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top"><span className="eyebrow">{t("nav_library")}</span><span className="tz">{quotes.length}</span></div>
        <h1 className="display">{t("nav_library")}</h1>
      </header>

      <div className="animate-in" style={{ marginBlockEnd: 12 }}>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("add_quote")} style={{ marginBlockEnd: 8 }} />
        <div className="input-row">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author / source" />
          <button className="btn solid" onClick={add}>{t("add")}</button>
        </div>
      </div>

      {quotes.length === 0 && <div className="center-empty">{t("module_empty")}</div>}
      {quotes.map((q) => (
        <div className="trow animate-in" key={q.id}>
          <div className="grow">
            <div className="t-title" style={{ fontSize: "1.15rem", lineHeight: 1.4 }}>“{q.text}”</div>
            <div className="metaline">
              {q.source_author && <span className="meta">{q.source_author}</span>}
              {q.book_title && <span className="meta">{q.book_title}</span>}
              {Number(q.annotation_count) > 0 && <span className="meta" style={{ color: "var(--accent)" }}>{q.annotation_count} notes</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
