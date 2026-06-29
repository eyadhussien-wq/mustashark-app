import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { I18nManager, Platform } from "react-native";
import { translations, type Lang } from "@/constants/translations";

const STORAGE_KEY = "mustasharek_language";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRTL: boolean;
  dir: "rtl" | "ltr";
  align: "right" | "left";
  alignOpposite: "left" | "right";
  rowDir: "row-reverse" | "row";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw === "en" || raw === "ar") {
        setLangState(raw);
        if (raw === "ar" && !I18nManager.isRTL) {
          I18nManager.forceRTL(true);
          if (Platform.OS !== "web") {
            // On native, RTL change needs reload — we let Expo handle it on next launch
          }
        } else if (raw === "en" && I18nManager.isRTL) {
          I18nManager.forceRTL(false);
        }
      }
      setLoaded(true);
    });
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
    if (l === "ar" && !I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    } else if (l === "en" && I18nManager.isRTL) {
      I18nManager.forceRTL(false);
    }
  };

  const isRTL = lang === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const align = isRTL ? "right" : "left";
  const alignOpposite = isRTL ? "left" : "right";
  const rowDir = isRTL ? "row-reverse" : "row";

  const t = (key: string): string => {
    const val = translations[lang][key];
    if (val === undefined && lang === "en") {
      // Fallback to Arabic if English key missing (development safety)
      return translations.ar[key] ?? key;
    }
    return val ?? key;
  };

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL, dir, align, alignOpposite, rowDir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
