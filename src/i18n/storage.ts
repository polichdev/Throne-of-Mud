import type { SupportedLanguage } from './types';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'uk';
export const STORAGE_KEY = 'throne_of_mud_language';

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'uk' || saved === 'en') {
      return saved;
    }
  } catch (e) {
    console.warn('Could not read language from localStorage:', e);
  }
  return DEFAULT_LANGUAGE;
}

export function saveStoredLanguage(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    console.warn('Could not save language to localStorage:', e);
  }
}
