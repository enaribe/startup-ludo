/**
 * useReturnBonus
 *
 * Détecte si le joueur revient après ≥ 24h d'absence et affiche un popup
 * "Bonus reconnexion" qui lui accorde RETURN_BONUS_XP points d'XP.
 *
 * Règles :
 * - Ne jamais afficher si le joueur n'est pas connecté (profil null)
 * - Ne vérifier qu'une seule fois par montage (checkedRef)
 * - Afficher uniquement si la dernière réclamation date de plus de 24h
 * - Le claim appelle addXP() du userStore, puis persiste le timestamp
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { trackReturnBonusClaimed } from '@/services/analytics';
import { useAuthStore, useUserStore } from '@/stores';

const STORAGE_KEY = '@return_bonus_last_claimed';

/** XP accordés au retour */
export const RETURN_BONUS_XP = 75;

/** Délai minimum entre deux bonus (24h en ms) */
const MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function useReturnBonus() {
  const profile = useUserStore((state) => state.profile);
  const isGuest = useAuthStore((state) => state.user?.isGuest ?? true);
  const addXP = useUserStore((state) => state.addXP);

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
      const lastClaimedStr = await AsyncStorage.getItem(STORAGE_KEY);
      const lastClaimed = lastClaimedStr ? parseInt(lastClaimedStr, 10) : 0;
      const elapsed = Date.now() - lastClaimed;

      if (elapsed >= MIN_INTERVAL_MS) {
        // Petit délai pour laisser l'écran s'afficher
        timerRef.current = setTimeout(() => setVisible(true), 800);
      }
    } catch {
      // En cas d'erreur AsyncStorage, on affiche quand même
      timerRef.current = setTimeout(() => setVisible(true), 800);
    }
  };

  const claim = useCallback(async () => {
    setVisible(false);
    // Créditer l'XP immédiatement
    addXP(RETURN_BONUS_XP);
    // Customer.io : coupe la campagne « ton bonus t'attend »
    trackReturnBonusClaimed({ xp: RETURN_BONUS_XP });
    // Persister le timestamp de réclamation
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // silencieux
    }
  }, [addXP]);

  const dismiss = useCallback(async () => {
    setVisible(false);
    // Même si l'utilisateur ferme sans cliquer, on reset le timer
    // pour éviter de le revoir immédiatement à la prochaine session
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // silencieux
    }
  }, []);

  return { visible, claim, dismiss };
}
