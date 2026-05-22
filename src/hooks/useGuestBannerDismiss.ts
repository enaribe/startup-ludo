import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@guest_banner_dismissed_session';

/**
 * Gère le dismiss de la bannière "Tu es invité" sur l'accueil.
 * Le dismiss persiste pour la session courante : il est réinitialisé
 * au prochain lancement complet de l'application.
 */
export function useGuestBannerDismiss() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (cancelled) return;
        setIsDismissed(value === '1');
        setIsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(async () => {
    setIsDismissed(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Si AsyncStorage échoue, le dismiss reste en mémoire pour la session
    }
  }, []);

  return { isDismissed, isLoaded, dismiss };
}

/**
 * Réinitialise le dismiss au lancement de l'app (appelé depuis _layout racine).
 */
export async function resetGuestBannerDismissOnAppStart() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
