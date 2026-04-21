/**
 * useStartupCreationPrompt
 *
 * Gère la logique d'affichage périodique du popup "Créez votre startup".
 *
 * Règles :
 * - Ne jamais afficher si le joueur a déjà au moins 1 startup
 * - Afficher à la première session (jamais vu)
 * - Ensuite : toutes les SESSION_INTERVAL sessions (ex: toutes les 3 sessions)
 * - Une seule fois par session (évite les doubles affichages)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStore, useUserStore } from '@/stores';

const STORAGE_KEY_SESSION_COUNT = '@startup_prompt_session_count';
const STORAGE_KEY_LAST_SHOWN_SESSION = '@startup_prompt_last_shown_session';

/** Afficher le popup toutes les N sessions */
const SESSION_INTERVAL = 3;

export function useStartupCreationPrompt() {
  const profile = useUserStore((state) => state.profile);
  const isGuest = useAuthStore((state) => state.user?.isGuest ?? true);
  const [visible, setVisible] = useState(false);
  const checkedRef = useRef(false); // ne vérifier qu'une fois par montage

  const hasStartup = (profile?.startups?.length ?? 0) > 0;

  useEffect(() => {
    // Jamais afficher pour les invités
    if (isGuest) return;
    // Si déjà une startup → jamais afficher
    if (hasStartup) return;
    // Ne vérifier qu'une fois par montage du composant (= une fois par session)
    if (checkedRef.current) return;
    checkedRef.current = true;

    checkAndShow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStartup, isGuest]);

  const checkAndShow = async () => {
    try {
      const [countStr, lastShownStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_SESSION_COUNT),
        AsyncStorage.getItem(STORAGE_KEY_LAST_SHOWN_SESSION),
      ]);

      const sessionCount = countStr ? parseInt(countStr, 10) : 0;
      const lastShownSession = lastShownStr ? parseInt(lastShownStr, 10) : -1;

      // Incrémenter le compteur de sessions
      const newSessionCount = sessionCount + 1;
      await AsyncStorage.setItem(STORAGE_KEY_SESSION_COUNT, String(newSessionCount));

      // Afficher si :
      // - Jamais montré (lastShownSession === -1)
      // - OU assez de sessions écoulées depuis le dernier affichage
      const sessionsSinceLast = newSessionCount - lastShownSession;
      const shouldShow = lastShownSession === -1 || sessionsSinceLast >= SESSION_INTERVAL;

      if (shouldShow) {
        // Petit délai pour laisser l'écran se charger d'abord
        setTimeout(() => setVisible(true), 1200);
      }
    } catch (e) {
      // En cas d'erreur AsyncStorage, on affiche quand même
      setTimeout(() => setVisible(true), 1200);
    }
  };

  const dismiss = useCallback(async () => {
    setVisible(false);
    try {
      const countStr = await AsyncStorage.getItem(STORAGE_KEY_SESSION_COUNT);
      const sessionCount = countStr ? parseInt(countStr, 10) : 1;
      await AsyncStorage.setItem(STORAGE_KEY_LAST_SHOWN_SESSION, String(sessionCount));
    } catch (e) {
      // silencieux
    }
  }, []);

  return { visible, dismiss };
}
