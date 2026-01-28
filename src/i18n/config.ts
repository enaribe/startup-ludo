/**
 * Configuration i18n pour Startup Ludo
 *
 * Utilise un système simple de traduction basé sur des clés.
 * Support du français (défaut) et de l'anglais.
 */

import { useCallback } from 'react';
import { useSettingsStore } from '@/stores';
import fr from './locales/fr';
import en from './locales/en';

export type Language = 'fr' | 'en';

export type TranslationKey = keyof typeof fr;

const translations: Record<Language, Record<string, string>> = {
  fr,
  en,
};

/**
 * Récupère une traduction par sa clé
 * Supporte l'interpolation de variables avec {{variable}}
 */
export function translate(
  key: string,
  language: Language = 'fr',
  params?: Record<string, string | number>
): string {
  const langTranslations = translations[language] || translations.fr;
  let text = langTranslations[key] || translations.fr[key] || key;

  // Interpolation des paramètres
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
    });
  }

  return text;
}

/**
 * Hook pour utiliser les traductions dans les composants
 */
export function useTranslation() {
  const language = useSettingsStore((state) => state.language);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return translate(key, language, params);
    },
    [language]
  );

  return { t, language };
}

/**
 * Liste des langues disponibles
 */
export const AVAILABLE_LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'en', name: 'English', flag: 'GB' },
];

/**
 * Obtenir le nom de la langue
 */
export function getLanguageName(code: Language): string {
  return AVAILABLE_LANGUAGES.find((lang) => lang.code === code)?.name || code;
}
