"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/LocaleProvider";
import { Icon } from "./Icon";
import { LangToggle } from "./LangToggle";

export const NAV = [
  { href: "/", key: "nav_today", icon: "home" },
  { href: "/tasks", key: "nav_tasks", icon: "checkCircle" },
  { href: "/projects", key: "nav_projects", icon: "layers" },
  { href: "/domains", key: "nav_domains", icon: "grid" },
  { href: "/settings/calendars", key: "nav_settings", icon: "settings" },
];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">
          <Icon name="activity" size={20} />
        </div>
        <div>
          <div className="name">{t("app_name")}</div>
          <div className="sub">Murtadha</div>
        </div>
      </div>

      {NAV.map((it) => (
        <Link key={it.href} href={it.href} className={`side-link ${isActive(it.href, pathname) ? "active" : ""}`}>
          <span className="ico" style={{ display: "inline-flex" }}>
            <Icon name={it.icon} size={19} />
          </span>
          <span>{t(it.key)}</span>
        </Link>
      ))}

      <div className="side-spacer" />
      <LangToggle />
    </aside>
  );
}
