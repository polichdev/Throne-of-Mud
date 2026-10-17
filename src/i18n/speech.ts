import type { SupportedLanguage } from './types';

export function localizeSpeech(text: string, _language: SupportedLanguage, _type?: 'mood' | 'alert' | 'work'): string {
  return text;
}
