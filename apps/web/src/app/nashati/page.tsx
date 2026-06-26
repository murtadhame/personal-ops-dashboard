"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icon";

export default function NashatiPage() {
  const { t } = useLocale();
  const [d, setD] = useState<any>(null);

  useEffect(() => { api.get<any>("/api/nashati/action-needed").then(setD).catch(() => setD({ connected: false })); }, []);

  const c = d?.counts ?? {};
  const tiles = [
    { label: t("providers"), v: c.providersTotal, sub: `${c.providersPending ?? 0} ${t("pending_approvals")}`, alert: c.providersPending > 0 },
    { label: t("activities"), v: c.activitiesTotal, sub: `${c.activitiesPublished ?? 0} ${t("published")}` },
    { label: t("open_tickets"), v: c.ticketsOpen, sub: `${c.ticketsPending ?? 0} ${t("pending_approvals")}`, alert: c.ticketsOpen > 0 },
    { label: t("parents"), v: c.parents, sub: "" },
  ];

  return (
    <div className="page">
      <header className="page-head animate-in">
        <div className="top"><span className="eyebrow">{t("nav_nashati")}</span>{d?.total_actions != null && <span className="tz">{d.total_actions} {t("action_needed")}</span>}</div>
        <h1 className="display">نشاطي · Nashati</h1>
      </header>

      {d && d.connected === false && (
        <div className="brief animate-in"><div className="brief-body" style={{ fontSize: "1rem" }}>{d.needs_key ? t("nashati_needs_key") : `Error: ${d.error}`}</div></div>
      )}

      {d?.connected && (
        <>
          <div className="htiles animate-in" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            {tiles.map((tile) => (
              <div className={`htile ${tile.alert ? "" : ""}`} key={tile.label} style={tile.alert ? { borderColor: "var(--accent)" } : undefined}>
                <div className="v" style={tile.alert ? { color: "var(--accent)" } : undefined}>{tile.v ?? "—"}</div>
                <div className="u">{tile.label}</div>
                {tile.sub && <div className="cmp">{tile.sub}</div>}
              </div>
            ))}
          </div>

          <div className="section-label">{t("action_needed")}</div>
          {(!d.items || d.items.length === 0) ? (
            <div className="trow"><span className="muted">✓ {t("all_clear")}</span></div>
          ) : (
            d.items.map((it: any, i: number) => (
              <div className="trow animate-in" key={i}>
                <span className="pdot" style={{ background: "var(--accent)", marginBlockStart: 7 }} />
                <div className="grow"><div className="t-title">{it.label}</div></div>
                <Icon name="chevron" size={16} style={{ color: "var(--text-faint)" }} />
              </div>
            ))
          )}

          {d.pendingApprovals?.length > 0 && (
            <>
              <div className="section-label">{t("pending_approvals")}</div>
              {d.pendingApprovals.map((p: any) => (
                <div className="trow" key={p.id}>
                  <div className="grow">
                    <div className="t-title">{p.name || p.nameEn || p.email || p.id}</div>
                    <div className="metaline">{p.city && <span className="meta">{p.city}</span>}{p.phone && <span className="meta">{p.phone}</span>}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {d.openTickets?.length > 0 && (
            <>
              <div className="section-label">{t("open_tickets")}</div>
              {d.openTickets.map((tk: any) => (
                <div className="trow" key={tk.id}>
                  <div className="grow">
                    <div className="t-title">{tk.subject || tk.id}</div>
                    <div className="metaline">{tk.userName && <span className="meta">{tk.userName}</span>}{tk.lastMessagePreview && <span className="meta" style={{ textTransform: "none" }}>{tk.lastMessagePreview}</span>}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {!d && <div className="center-empty">{t("loading")}</div>}
    </div>
  );
}
