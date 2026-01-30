import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { defaultLocale, translations } from '@/locales';
import { Language, STORAGE_KEYS } from '@/constants';
import { useAuth } from '@/services/auth';
import { supabase } from '@/services/supabase';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(defaultLocale);
  const { user } = useAuth();

  useEffect(() => {
    const loadLocale = async () => {
      try {
        const savedLocale = await SecureStore.getItemAsync(STORAGE_KEYS.LANGUAGE_KEY);
        if (savedLocale && (savedLocale === 'vi' || savedLocale === 'en' || savedLocale === 'jp')) {
          setLanguageState(savedLocale as Language);
        }
      } catch (error) {
        console.warn('Failed to load language from storage:', error);
      }
    };

    loadLocale();
  }, []);

  // Sync with user metadata when user logs in or changes
  useEffect(() => {
    if (user?.user_metadata?.language) {
      const userLang = user.user_metadata.language;
      if (userLang === 'vi' || userLang === 'en' || userLang === 'jp') {
        if (userLang !== language) {
          setLanguageState(userLang as Language);
          // Update local storage to match user profile
          SecureStore.setItemAsync(STORAGE_KEYS.LANGUAGE_KEY, userLang as Language).catch(console.warn);
        }
      }
    }
  }, [user]);

  const setLanguage = async (newLocale: Language) => {
    try {
      setLanguageState(newLocale);
      await SecureStore.setItemAsync(STORAGE_KEYS.LANGUAGE_KEY, newLocale);

      if (user) {
        await supabase.auth.updateUser({
          data: { language: newLocale }
        });
      }
    } catch (error) {
      console.warn('Failed to save language to storage or database:', error);
    }
  };

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (isRecord(value) && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // console.warn(`Translation key "${key}" not found for locale "${language}"`);
        return key; // Return key as fallback
      }
    }

    if (typeof value === 'string') {
      if (params) {
        return Object.entries(params).reduce((acc, [k, v]) => {
          return acc.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }, value);
      }
      return value;
    }

    return key;
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
