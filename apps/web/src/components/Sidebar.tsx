"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/LocaleProvider";
import { LangToggle } from "./LangToggle";

export const NAV = [
  { href: "/", key: "nav_today", icon: "home" },
  { href: "/tasks", key: "nav_tasks", icon: "checkCircle" },
  { href: "/routines", key: "nav_routines", icon: "flame" },
  { href: "/projects", key: "nav_projects", icon: "layers" },
  { href: "/content", key: "nav_content", icon: "activity" },
  { href: "/people", key: "nav_people", icon: "target" },
  { href: "/library", key: "nav_library", icon: "sparkles" },
  { href: "/journal", key: "nav_journal", icon: "calendar" },
  { href: "/domains", key: "nav_domains", icon: "grid" },
];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();

  function capture() {
    window.dispatchEvent(new CustomEvent("pod:open-capture"));
  }

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <div className="brand-name">{t("app_name")}</div>
        <div className="brand-sub">MURTADHA.ME</div>
      </Link>

      {NAV.map((it) => (
        <Link key={it.href} href={it.href} className={`side-link ${isActive(it.href, pathname) ? "active" : ""}`}>
          {t(it.key)}
        </Link>
      ))}

      <div className="side-spacer" />
      <div className="side-divider" />
      <button className="side-foot" onClick={capture} style={{ inlineSize: "100%" }}>
        <span className="lbl">{t("capture")}</span>
        <span className="kbd">⌘J</span>
      </button>
      <Link href="/tasks" className="side-foot">
        <span className="lbl">{t("search")}</span>
        <span className="kbd">⌘K</span>
      </Link>
      <Link href="/settings/calendars" className="side-foot">
        <span className="lbl">{t("settings_title")}</span>
      </Link>
      <div style={{ marginBlockStart: 14 }}>
        <LangToggle />
      </div>
    </aside>
  );
}
