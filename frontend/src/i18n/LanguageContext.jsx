import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultLanguage, languages, localeCodes, translate } from "./i18n.js";
import { LanguageContext } from "./language-context.js";

const STORAGE_KEY = "healthKioskLanguage";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return Object.hasOwn(languages, saved) ? saved : defaultLanguage;
  });

  const setLanguage = useCallback((nextLanguage) => {
    if (!Object.hasOwn(languages, nextLanguage)) return;
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeCodes[language] || "en";
  }, [language]);

  const t = useCallback((message, values) => translate(language, message, values), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
