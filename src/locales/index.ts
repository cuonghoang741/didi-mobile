import { LANGUAGE, Language } from '@/constants';

import { en } from './en';
import { vi } from './vi';

export type TranslationKeys = typeof vi;

export const translations = {
  vi,
  en,
} as const;

export const defaultLocale: Language = LANGUAGE.VI;

export const supportedLocales: Language[] = [LANGUAGE.VI, LANGUAGE.EN];
