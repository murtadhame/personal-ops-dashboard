"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/LocaleProvider";

const ITEMS = [
  { href: "/", key: "nav_today", ico: "📅" },
  { href: "/tasks", key: "nav_tasks", ico: "✓" },
  { href: "/projects", key: "nav_projects", ico: "📦" },
  { href: "/domains", key: "nav_domains", ico: "🗂️" },
  { href: "/settings/calendars", key: "nav_settings", ico: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => {
        const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : ""}>
            <span className="ico">{it.ico}</span>
            <span>{t(it.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
