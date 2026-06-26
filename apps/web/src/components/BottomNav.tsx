"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/LocaleProvider";
import { Icon } from "./Icon";
import { NAV } from "./Sidebar";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <nav className="bottom-nav">
      {NAV.map((it) => {
        const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : ""}>
            <Icon name={it.icon} size={21} />
            <span>{t(it.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
