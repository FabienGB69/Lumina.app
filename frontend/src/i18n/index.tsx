// Lumina i18n — React context + hook.
// Detects device locale on first launch, persists user choice, exposes a
// deep-key `t()` function with {placeholder} interpolation.
import * as Localization from "expo-localization";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../api";
import { storage } from "../utils/storage";
import { dict, Lang, LLM_LANG_NAME, SUPPORTED_LANGS, Translations } from "./translations";

const STORAGE_KEY = "lumina_lang";

// Type helper — dotted path like "auth.enter" → string keys of Translations
type DotPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${DotPath<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

export type TKey = DotPath<Translations>;

function getByPath(obj: any, path: string): string {
  return path.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj) as string;
}

function interpolate(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

function detectDeviceLang(): Lang {
  try {
    const locales = Localization.getLocales?.() || [];
    for (const loc of locales) {
      const code = (loc.languageCode || "").toLowerCase();
      if (SUPPORTED_LANGS.includes(code as Lang)) return code as Lang;
    }
  } catch {
    /* ignore */
  }
  return "en";
}

type Ctx = {
  lang: Lang;
  ready: boolean;
  setLang: (l: Lang) => Promise<void>;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  llmLang: () => string;
};

const I18nContext = createContext<Ctx>({} as Ctx);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = (await storage.getItem<string>(STORAGE_KEY, "")) as string;
        if (stored && SUPPORTED_LANGS.includes(stored as Lang)) {
          setLangState(stored as Lang);
        } else {
          setLangState(detectDeviceLang());
        }
      } catch {
        setLangState(detectDeviceLang());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    await storage.setItem(STORAGE_KEY, l);
    // Best-effort sync to backend so LLM outputs match. Ignore auth/network errors.
    try {
      await api.setLanguage(l);
    } catch {
      /* not signed in yet or offline — fine */
    }
  }, []);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => {
      const raw =
        getByPath(dict[lang], key) ?? getByPath(dict.en, key) ?? String(key);
      return interpolate(raw, vars);
    },
    [lang],
  );

  const llmLang = useCallback(() => LLM_LANG_NAME[lang], [lang]);

  const value = useMemo<Ctx>(
    () => ({ lang, ready, setLang, t, llmLang }),
    [lang, ready, setLang, t, llmLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

// Convenience — most components only need `t`.
export function useTranslation() {
  const { t, lang, setLang } = useI18n();
  return { t, lang, setLang };
}

export type { Lang } from "./translations";
export { LANG_NAMES, LANG_FLAGS, SUPPORTED_LANGS } from "./translations";
