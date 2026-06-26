"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

export default function PeoplePage() {
  const { t } = useLocale();
  const [people, setPeople] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");

  const load = useCallback(() => { api.get<any[]>("/api/people").then(setPeople).catch(() => setPeople([])); }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => { if (!name.trim()) return; await api.post("/api/people", { name: name.trim(), company: company.trim() || undefined }); setName(""); setCompany(""); load(); };

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top"><span className="eyebrow">{t("nav_people")}</span><span className="tz">{people.length}</span></div>
        <h1 className="display">{t("nav_people")}</h1>
      </header>

      <div className="input-row animate-in" style={{ marginBlockEnd: 12 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={t("add_person")} />
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
        <button className="btn solid" onClick={add}>{t("add")}</button>
      </div>

      {people.length === 0 && <div className="center-empty">{t("module_empty")}</div>}
      {people.map((p) => (
        <div className="trow animate-in" key={p.id}>
          <div className="grow">
            <div className="t-title">{p.name}</div>
            <div className="metaline">
              {p.company && <span className="meta">{p.company}</span>}
              {p.relationship_type && <span className="meta">{p.relationship_type}</span>}
              {Number(p.fact_count) > 0 && <span className="meta" style={{ color: "var(--accent)" }}>{p.fact_count} facts</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
