"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Locale, dirFor, translate } from "./i18n";

type Ctx = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Load saved locale once on mount
  useEffect(() => {
    const saved = (localStorage.getItem("locale") as Locale) || "en";
    applyLocale(saved);
    setLocaleState(saved);
  }, []);

  function applyLocale(l: Locale) {
    document.documentElement.lang = l;
    document.documentElement.dir = dirFor(l);
  }

  function setLocale(l: Locale) {
    localStorage.setItem("locale", l);
    applyLocale(l);
    setLocaleState(l);
  }

  const value: Ctx = {
    locale,
    dir: dirFor(locale),
    setLocale,
    t: (key: string) => translate(key, locale),
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
