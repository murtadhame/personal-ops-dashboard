"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

type HToday = { water_ml: number; steps: number; steps_yesterday: number; weight: number | null; recent: any[] };

export default function HealthPage() {
  const { t, locale } = useLocale();
  const [d, setD] = useState<HToday | null>(null);
  const [steps, setSteps] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => { api.get<HToday>("/api/health/today").then(setD).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const log = async (body: any) => { await api.post("/api/health", body); load(); };
  const addSteps = async () => { if (!steps.trim()) return; await log({ kind: "steps", value: Number(steps), unit: "steps" }); setSteps(""); };
  const addNote = async () => { if (!note.trim()) return; await log({ kind: "note", note: note.trim() }); setNote(""); };

  const fmt = (n: number) => n.toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  const stepsDelta = d ? d.steps - d.steps_yesterday : 0;

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top"><span className="eyebrow">{t("nav_health")}</span></div>
        <h1 className="display">{t("health_title")}</h1>
      </header>

      <div className="htiles animate-in">
        <div className="htile"><div className="v">{d ? fmt(d.water_ml) : "—"}</div><div className="u">{t("water")} · ML</div></div>
        <div className="htile">
          <div className="v">{d ? fmt(d.steps) : "—"}</div><div className="u">{t("steps")}</div>
          {d && d.steps_yesterday > 0 && <div className="cmp">{stepsDelta >= 0 ? "▲" : "▼"} {fmt(Math.abs(stepsDelta))} {t("vs_yesterday")}</div>}
        </div>
        <div className="htile"><div className="v">{d?.weight ? fmt(d.weight) : "—"}</div><div className="u">{t("weight")} · KG</div></div>
      </div>

      {/* Water quick-log */}
      <div className="section-label">{t("water")}</div>
      <div className="water-btns animate-in" style={{ marginBlockEnd: 22 }}>
        {[250, 500, 750].map((ml) => (
          <button key={ml} className="btn" onClick={() => log({ kind: "water", value: ml, unit: "ml" })}>+{ml} ml</button>
        ))}
      </div>

      {/* Steps */}
      <div className="section-label">{t("steps")}</div>
      <div className="input-row animate-in" style={{ marginBlockEnd: 22 }}>
        <input type="number" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="8000" />
        <button className="btn solid" onClick={addSteps}>{t("log_steps")}</button>
      </div>

      {/* Health journal */}
      <div className="section-label">{t("health_note")}</div>
      <div className="animate-in" style={{ marginBlockEnd: 22 }}>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("health_note")} style={{ marginBlockEnd: 8 }} />
        <button className="btn solid" onClick={addNote}>{t("add_log")}</button>
      </div>

      {/* Recent log */}
      <div className="section-label">Log</div>
      {d?.recent?.length === 0 && <div className="center-empty">{t("module_empty")}</div>}
      {d?.recent?.map((r) => (
        <div className="trow" key={r.id}>
          <div className="grow">
            <div className="t-title">{r.kind}{r.value != null ? ` · ${fmt(Number(r.value))} ${r.unit ?? ""}` : ""}</div>
            {r.note && <div className="metaline"><span className="meta">{r.note}</span></div>}
          </div>
          <span className="meta">{new Date(r.logged_at).toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      ))}
    </div>
  );
}
