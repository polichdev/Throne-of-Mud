import { uk } from './translations/uk';
import { en } from './translations/en';
import type { SupportedLanguage, TranslationDictionary } from './types';

export type { SupportedLanguage, TranslationDictionary } from './types';

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  uk,
  en,
};

export function translate(
  lang: SupportedLanguage,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] || translations.uk;
  const parts = path.split('.');
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      let fallback: any = translations.uk;
      for (const fbPart of parts) {
        if (fallback && typeof fallback === 'object' && fbPart in fallback) {
          fallback = fallback[fbPart];
        } else {
          fallback = undefined;
          break;
        }
      }
      current = fallback ?? path;
      break;
    }
  }

  let result = typeof current === 'string' ? current : path;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return result;
}
