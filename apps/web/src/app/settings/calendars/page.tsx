"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { LangToggle } from "@/components/LangToggle";
import { Icon } from "@/components/Icon";

export default function CalendarSettingsPage() {
  const { t } = useLocale();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [icsUrl, setIcsUrl] = useState("");
  const [icsName, setIcsName] = useState("Outlook (Badael)");
  const [msg, setMsg] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");

  function load() {
    api.get<any[]>("/api/calendar/accounts").then(setAccounts).catch(() => setAccounts([]));
  }
  useEffect(() => {
    load();
    api.get<any[]>("/api/domains").then(setDomains).catch(() => {});
    api.get<Record<string, any>>("/api/settings").then((s) => {
      setNameEn(s.display_name_en ?? "");
      setNameAr(s.display_name_ar ?? "");
    }).catch(() => {});
  }, []);

  async function saveProfile() {
    setMsg(null);
    try {
      await api.patch("/api/settings", { display_name_en: nameEn, display_name_ar: nameAr });
      setMsg(t("saved"));
      // Tell Today to re-fetch the greeting
      window.dispatchEvent(new CustomEvent("pod:captured"));
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    }
    setTimeout(() => setMsg(null), 2500);
  }

  async function addIcs() {
    if (!icsUrl.trim()) return;
    setMsg(null);
    try {
      const badael = domains.find((d) => d.name === "Badael");
      const res = await api.post<any>("/api/calendar/ics", {
        ics_url: icsUrl.trim(),
        display_name: icsName,
        default_domain_id: badael?.id,
      });
      setMsg(`Added — synced ${res.synced} events.`);
      setIcsUrl("");
      load();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    }
  }

  async function setDefaultDomain(id: string, domainId: string) {
    await api.patch(`/api/calendar/accounts/${id}`, { default_domain_id: domainId });
    load();
  }

  async function syncNow() {
    setMsg(t("loading"));
    await api.post("/api/calendar/sync");
    setMsg(t("saved"));
    load();
  }

  async function remove(id: string) {
    await api.del(`/api/calendar/accounts/${id}`);
    load();
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t("settings_title")}</h1>
      </div>

      <div className="section-label"><span className="ico"><Icon name="settings" size={16} /></span> {t("profile")}</div>
      <div className="card pad">
        <p className="muted" style={{ marginBlockStart: 0, fontSize: "0.82rem" }}>{t("name_hint")}</p>
        <label className="field">
          <span className="lbl">{t("name_en_label")}</span>
          <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Murtadha" dir="ltr" />
        </label>
        <label className="field">
          <span className="lbl">{t("name_ar_label")}</span>
          <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مرتضى" dir="rtl" />
        </label>
        <button className="btn primary" onClick={saveProfile}><Icon name="check" size={16} /> {t("save")}</button>
      </div>

      <div className="section-label">{t("language")}</div>
      <div className="card pad">
        <LangToggle />
      </div>

      <div className="section-label">{t("calendars")}</div>

      <div className="card">
        <a className="btn primary" href={`${api.base}/api/calendar/google/connect`} style={{ display: "block", textAlign: "center" }}>
          {t("connect_google")}
        </a>
      </div>

      <div className="card">
        <div className="title" style={{ marginBlockEnd: 6 }}>
          {t("add_outlook")}
        </div>
        <p className="muted" style={{ marginBlockStart: 0, fontSize: "0.82rem" }}>
          {t("outlook_hint")}
        </p>
        <input
          placeholder={icsName}
          value={icsName}
          onChange={(e) => setIcsName(e.target.value)}
          style={{ marginBlockEnd: 8 }}
        />
        <div className="input-row">
          <input
            placeholder="https://outlook.office365.com/.../calendar.ics"
            value={icsUrl}
            onChange={(e) => setIcsUrl(e.target.value)}
          />
          <button className="btn primary" onClick={addIcs}>
            {t("add")}
          </button>
        </div>
      </div>

      <div className="section-label">{t("connected_calendars")}</div>
      <div className="card">
        {accounts.length === 0 && <div className="center-empty">—</div>}
        {accounts.map((a) => (
          <div className="row" key={a.id}>
            <span className="dot" style={{ background: a.color || "var(--border)" }} />
            <div className="grow">
              <div className="title">
                {a.display_name}{" "}
                <span className="badge">{a.provider === "microsoft" ? "Outlook · view" : "Google"}</span>
              </div>
              <div className="sub">{a.account_email}</div>
              <select
                value={a.default_domain_id || ""}
                onChange={(e) => setDefaultDomain(a.id, e.target.value)}
                style={{ marginBlockStart: 6 }}
              >
                <option value="">—</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn ghost sm" onClick={() => remove(a.id)} aria-label="remove">
              <Icon name="x" size={15} />
            </button>
          </div>
        ))}
        {accounts.length > 0 && (
          <button className="btn sm" onClick={syncNow} style={{ marginBlockStart: 10 }}>
            {t("sync_now")}
          </button>
        )}
      </div>

      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}
