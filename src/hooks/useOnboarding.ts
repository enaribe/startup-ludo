/**
 * useOnboarding
 *
 * Affiche le flow d'onboarding une seule fois lors de la première connexion.
 *
 * Règles :
 * - Ne jamais afficher si le joueur n'est pas authentifié (profil null)
 * - Afficher uniquement si le flag "@onboarding_completed" n'existe pas encore
 * - Une seule fois par montage (checkedRef)
 * - complete() marque l'onboarding comme terminé (ne se réaffichera plus jamais)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStore, useUserStore } from '@/stores';

const STORAGE_KEY = '@onboarding_completed';

export function useOnboarding() {
  const profile = useUserStore((state) => state.profile);
  const isGuest = useAuthStore((state) => state.user?.isGuest ?? true);
  const [visible, setVisible] = useState(false);
  const checkedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (isGuest) return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    checkAndShow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isGuest]);

  // Annule un éventuel setVisible(true) différé si l'écran est démonté
  // (évite un popup fantôme qui bloquerait les taps au retour).
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const checkAndShow = async () => {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEY);
      if (!completed) {
        // Petit délai pour laisser le home s'afficher d'abord
        timerRef.current = setTimeout(() => setVisible(true), 600);
      }
    } catch {
      // En cas d'erreur, on affiche quand même l'onboarding
      timerRef.current = setTimeout(() => setVisible(true), 600);
    }
  };

  const complete = useCallback(async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // silencieux
    }
  }, []);

  return { visible, complete };
}
