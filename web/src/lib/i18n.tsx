'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import languagesData from '../locales/languages.json';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import ja from '../locales/ja.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import ru from '../locales/ru.json';
import zh from '../locales/zh.json';

export interface LanguageMeta {
  code: string;
  english_name: string;
  native_name: string;
  translation: string;
}

export const AVAILABLE_LANGUAGES: LanguageMeta[] = languagesData;

export type Language = string;

const translations: Record<string, Record<string, string>> = {
  en,
  hi,
  ja,
  es,
  fr,
  de,
  ru,
  zh,
};

export type TranslationParams = Record<string, string | number>;

export function formatRichText(
  rawText: string,
  params?: TranslationParams,
  highlightClass: string = 'text-[#CA6784] font-black'
): ReactNode {
  let text = rawText;

  // Replace variable tags: {{variable}}
  if (params) {
    text = text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
    });
  }

  // Parse highlighted tags: [[highlighted text]]
  const parts = text.split(/(\[\[.*?\]\])/g);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const content = part.slice(2, -2);
      return (
        <span key={index} className={highlightClass}>
          {content}
        </span>
      );
    }
    return part;
  });
}

export function matchSupportedLanguage(code?: string | null): Language {
  if (!code) return 'en';
  const clean = code.toLowerCase().trim();

  // 1. Direct exact match (e.g. 'en', 'hi', 'ja', 'es', 'fr', 'de', 'ru', 'zh')
  if (AVAILABLE_LANGUAGES.some((l) => l.code === clean)) {
    return clean;
  }

  // 2. Prefix match (e.g. 'en-US' -> 'en', 'es-419' -> 'es', 'ru-RU' -> 'ru', 'de-DE' -> 'de')
  const prefix = clean.split(/[-_]/)[0];
  if (AVAILABLE_LANGUAGES.some((l) => l.code === prefix)) {
    return prefix;
  }

  // 3. Chinese regional variants (zh-hans, zh-hant, zh-cn, zh-tw, etc.)
  if (clean.startsWith('zh')) {
    return 'zh';
  }

  // 4. Unsupported languages (e.g. 'id' for Indonesian Bahasa, 'pt', 'tr', etc.) -> fallback to 'en'
  return 'en';
}

export function detectTelegramLanguage(customInitData?: string): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check passed customInitData string
  if (customInitData) {
    try {
      const params = new URLSearchParams(customInitData);
      const userStr = params.get('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj?.language_code) {
          return userObj.language_code;
        }
      }
    } catch {}
  }

  // 2. Check window.Telegram.WebApp.initDataUnsafe.user.language_code
  try {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser?.language_code) {
      return tgUser.language_code;
    }
  } catch {}

  // 3. Check window.Telegram.WebApp.initData
  try {
    const initData = (window as any).Telegram?.WebApp?.initData;
    if (initData) {
      const params = new URLSearchParams(initData);
      const userStr = params.get('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj?.language_code) {
          return userObj.language_code;
        }
      }
    }
  } catch {}

  // 4. Check URL hash or search (e.g. #tgWebAppData=...)
  try {
    const raw = window.location.hash || window.location.search;
    if (raw) {
      const hashParams = new URLSearchParams(raw.replace(/^[#?]/, ''));
      const tgWebAppData = hashParams.get('tgWebAppData') || raw;
      const params = new URLSearchParams(tgWebAppData.replace(/^[#?]/, ''));
      const userStr = params.get('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj?.language_code) {
          return userObj.language_code;
        }
      }
    }
  } catch {}

  return null;
}

interface I18nContextType {
  language: Language;
  languages: LanguageMeta[];
  setLanguage: (lang: Language) => void;
  initLanguageFromTelegram: (initData?: string) => void;
  t: (key: string, params?: TranslationParams) => string;
  tRich: (
    key: string,
    params?: TranslationParams,
    highlightClass?: string
  ) => ReactNode;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  languages: AVAILABLE_LANGUAGES,
  setLanguage: () => {},
  initLanguageFromTelegram: () => {},
  t: (key: string) => key,
  tRich: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('meowdoku_lang');
    if (saved && AVAILABLE_LANGUAGES.some((l) => l.code === saved)) {
      setLanguageState(saved);
      return;
    }

    // First visit: auto-detect from Telegram user.language_code or fallback to 'en'
    const tgLang = detectTelegramLanguage();
    const matched = matchSupportedLanguage(tgLang);
    setLanguageState(matched);
    localStorage.setItem('meowdoku_lang', matched);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('meowdoku_lang', lang);
  };

  const initLanguageFromTelegram = (initData?: string) => {
    const saved = localStorage.getItem('meowdoku_lang');
    if (!saved) {
      const tgLang = detectTelegramLanguage(initData);
      const matched = matchSupportedLanguage(tgLang);
      setLanguageState(matched);
      localStorage.setItem('meowdoku_lang', matched);
    }
  };

  const t = (key: string, params?: TranslationParams): string => {
    const dict = translations[language] || translations['en'] || {};
    let raw = dict[key] || translations['en']?.[key] || key;
    if (params) {
      raw = raw.replace(/\{\{(\w+)\}\}/g, (_, k) => {
        return params[k] !== undefined ? String(params[k]) : `{{${k}}}`;
      });
    }
    // Strip [[ and ]] for plain string return
    return raw.replace(/\[\[(.*?)\]\]/g, '$1');
  };

  const tRich = (
    key: string,
    params?: TranslationParams,
    highlightClass?: string
  ): ReactNode => {
    const dict = translations[language] || translations['en'] || {};
    const raw = dict[key] || translations['en']?.[key] || key;
    return formatRichText(raw, params, highlightClass);
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        languages: AVAILABLE_LANGUAGES,
        setLanguage,
        initLanguageFromTelegram,
        t,
        tRich,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);

