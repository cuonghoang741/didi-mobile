import { MultiLanguageData } from '@/types/database.types';

/**
 * Get localized content from a multi-language field (Json type in DB).
 * @param languageData The generic Json object from the DB (e.g. product.language)
 * @param field The field to retrieve (e.g. 'name', 'description')
 * @param currentLang The current language code (e.g. 'vi', 'en', 'jp')
 * @param fallbackValue The default value if translation is missing (e.g. product.name)
 */
export const getLocalizedContent = (
  languageData: any,
  field: keyof MultiLanguageData,
  currentLang: string,
  fallbackValue: string,
): string => {
  if (!languageData) return fallbackValue;

  const data = languageData as MultiLanguageData;
  const fieldData = data[field];

  if (fieldData && fieldData[currentLang]) {
    return fieldData[currentLang] || fallbackValue;
  }

  return fallbackValue;
};
