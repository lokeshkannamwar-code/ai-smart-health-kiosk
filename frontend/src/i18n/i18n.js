import en from "./en.js";
import te from "./te.js";
import hi from "./hi.js";
import kn from "./kn.js";
import ta from "./ta.js";

export const languages = { en, te, hi, kn, ta };

export const languageNames = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  ta: "தமிழ்",
};

export const localeCodes = { en: "en-IN", te: "te-IN", hi: "hi-IN", kn: "kn-IN", ta: "ta-IN" };
export const defaultLanguage = "en";

export function translate(language, message, values = {}) {
  const template = languages[language]?.[message] || languages.en[message] || message;
  return template.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match);
}
