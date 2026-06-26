"use client";
import { useLocale } from "@/lib/LocaleProvider";
import { LOCALES } from "@/lib/i18n";

export function LangToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="lang-toggle">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          className={locale === l.code ? "active" : ""}
          onClick={() => setLocale(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
