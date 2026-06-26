"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/LocaleProvider";

const MOBILE = [
  { href: "/", key: "nav_today" },
  { href: "/tasks", key: "nav_tasks" },
  { href: "/routines", key: "nav_routines" },
  { href: "/people", key: "nav_people" },
  { href: "/library", key: "nav_library" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <nav className="bottom-nav">
      {MOBILE.map((it) => {
        const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : ""}>
            {t(it.key)}
          </Link>
        );
      })}
    </nav>
  );
}
