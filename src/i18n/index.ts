import { useGameStore } from '../store/useGameStore';
import { translations, translate } from './translations';

export * from './types';
export * from './translations';
export { DEFAULT_LANGUAGE, STORAGE_KEY, getStoredLanguage, saveStoredLanguage } from './storage';

export function useTranslation() {
  const language = useGameStore((s) => s.language);
  const setLanguage = useGameStore((s) => s.setLanguage);

  const t = (path: string, params?: Record<string, string | number>): string => {
    return translate(language, path, params);
  };

  const dict = translations[language] || translations.uk;

  return {
    t,
    dict,
    language,
    setLanguage,
  };
}
