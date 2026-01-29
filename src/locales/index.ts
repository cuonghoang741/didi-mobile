import { LANGUAGE, Language } from '@/constants';

import { en } from './en';
import { jp } from './jp';
import { vi } from './vi';

export type TranslationKeys = typeof vi;

export const translations = {
  vi,
  en,
  jp,
} as const;

export const defaultLocale: Language = LANGUAGE.VI;

export const supportedLocales: Language[] = [LANGUAGE.VI, LANGUAGE.EN, LANGUAGE.JP];
