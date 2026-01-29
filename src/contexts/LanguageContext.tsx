import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { defaultLocale, translations } from '@/locales';
import { Language, STORAGE_KEYS } from '@/constants';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(defaultLocale);

  useEffect(() => {
    const loadLocale = async () => {
      try {
        const savedLocale = await SecureStore.getItemAsync(STORAGE_KEYS.LANGUAGE_KEY);
        if (savedLocale && (savedLocale === 'vi' || savedLocale === 'en')) {
          setLanguageState(savedLocale as Language);
        }
      } catch (error) {
        console.warn('Failed to load language from storage:', error);
      }
    };

    loadLocale();
  }, []);

  const setLanguage = async (newLocale: Language) => {
    try {
      setLanguageState(newLocale);
      await SecureStore.setItemAsync(STORAGE_KEYS.LANGUAGE_KEY, newLocale);
    } catch (error) {
      console.warn('Failed to save language to storage:', error);
    }
  };

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (isRecord(value) && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        console.warn(`Translation key "${key}" not found for locale "${language}"`);
        return key; // Return key as fallback
      }
    }

    return typeof value === 'string' ? value : key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
