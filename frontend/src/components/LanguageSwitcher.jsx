import { languageNames } from "../i18n/i18n.js";
import { useLanguage } from "../i18n/useLanguage.js";

function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="app-language-picker">
      <span>{t("Language")}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t("Language")}>
        {Object.entries(languageNames).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
    </label>
  );
}

export default LanguageSwitcher;
