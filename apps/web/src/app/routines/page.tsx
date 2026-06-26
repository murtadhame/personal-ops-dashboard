"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icon";

type RoutinesResp = { groups: { part: string; items: any[] }[]; done: number; total: number };

export default function RoutinesPage() {
  const { t } = useLocale();
  const [data, setData] = useState<RoutinesResp | null>(null);
  const [name, setName] = useState("");
  const [part, setPart] = useState("morning");

  const load = useCallback(() => { api.get<RoutinesResp>("/api/routines").then(setData).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string) => { await api.post(`/api/routines/${id}/toggle`); load(); };
  const add = async () => { if (!name.trim()) return; await api.post("/api/routines", { name: name.trim(), part_of_day: part }); setName(""); load(); };

  const partLabel: Record<string, string> = { morning: t("part_morning"), afternoon: t("part_afternoon"), evening: t("part_evening"), anytime: t("part_anytime") };

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top"><span className="eyebrow">{t("nav_routines")}</span><span className="tz">{data ? `${data.done}/${data.total}` : ""}</span></div>
        <h1 className="display">{t("routines_title")}</h1>
      </header>

      <div className="input-row animate-in" style={{ marginBlockEnd: 10 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={t("nav_routines")} />
        <select value={part} onChange={(e) => setPart(e.target.value)} style={{ inlineSize: 140 }}>
          <option value="morning">{t("part_morning")}</option>
          <option value="afternoon">{t("part_afternoon")}</option>
          <option value="evening">{t("part_evening")}</option>
          <option value="anytime">{t("part_anytime")}</option>
        </select>
        <button className="btn solid" onClick={add}>{t("add")}</button>
      </div>

      {data?.groups.map((g) => (
        <div key={g.part} className="animate-in">
          <div className="grp">{partLabel[g.part] ?? g.part}</div>
          <hr className="hr" />
          {g.items.map((r) => (
            <div className={`trow ${r.done_today ? "dim" : ""}`} key={r.id}>
              <button className={`box ${r.done_today ? "done" : ""}`} onClick={() => toggle(r.id)} aria-label="toggle"><Icon name="check" size={12} /></button>
              <div className="grow"><div className="t-title">{r.emoji ? `${r.emoji} ` : ""}{r.name}</div></div>
              {r.streak > 0 && <span className="meta" style={{ color: "var(--accent)" }}>🔥 {r.streak}</span>}
            </div>
          ))}
        </div>
      ))}
      {data && data.total === 0 && <div className="center-empty">{t("module_empty")}</div>}
    </div>
  );
}
