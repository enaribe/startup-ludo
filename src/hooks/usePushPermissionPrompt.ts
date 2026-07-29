/**
 * usePushPermissionPrompt
 *
 * Gère l'affichage du pré-prompt maison « Active les notifications » :
 * on explique la valeur AVANT de déclencher le prompt système (un refus
 * système est quasi irréversible côté OS).
 *
 * Règles :
 * - Jamais pour les invités (pas de campagnes pour eux)
 * - Seulement après la 1ʳᵉ partie jouée (le joueur a vu la valeur de l'app)
 * - Seulement si la permission système est encore indéterminée
 * - Re-proposer au plus tôt 30 jours après un « Plus tard »
 * - Une seule vérification par montage, timer nettoyé au démontage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getPushPermissionStatus,
  requestPushPermission,
  trackEvent,
} from '@/services/analytics';
import { registerPushToken } from '@/services/firebase/pushTokenService';
import { useAuthStore, useUserStore } from '@/stores';

const STORAGE_KEY_LAST_PROMPTED = '@push_preprompt_last_shown';

/** Délai minimum avant de re-proposer après un « Plus tard » (30 jours). */
const RE_PROMPT_DELAY_MS = 30 * 24 * 60 * 60 * 1000;

export function usePushPermissionPrompt() {
  const profile = useUserStore((state) => state.profile);
  const isGuest = useAuthStore((state) => state.user?.isGuest ?? true);

  const [visible, setVisible] = useState(false);
  const checkedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPlayed = (profile?.gamesPlayed ?? 0) >= 1;

  useEffect(() => {
    if (isGuest) return;
    if (!hasPlayed) return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    checkAndShow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, hasPlayed]);

  // Annule un éventuel setVisible(true) différé si l'écran est démonté
  // (évite un popup fantôme qui bloquerait les taps au retour).
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const checkAndShow = async () => {
    try {
      const status = await getPushPermissionStatus();
      // Déjà accordée ou refusée au niveau système → on ne redemande jamais.
      if (status !== 'NOTDETERMINED') return;

      const lastPromptedStr = await AsyncStorage.getItem(STORAGE_KEY_LAST_PROMPTED);
      const lastPrompted = lastPromptedStr ? parseInt(lastPromptedStr, 10) : 0;
      if (Date.now() - lastPrompted < RE_PROMPT_DELAY_MS) return;

      // Petit délai pour laisser l'écran s'afficher
      timerRef.current = setTimeout(() => setVisible(true), 1000);
    } catch {
      // En cas de doute, on ne montre rien (jamais bloquer pour des notifs)
    }
  };

  const persistPrompted = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LAST_PROMPTED, String(Date.now()));
    } catch {
      // silencieux
    }
  };

  /** L'utilisateur accepte le pré-prompt → prompt système. */
  const accept = useCallback(async () => {
    setVisible(false);
    await persistPrompted();
    const status = await requestPushPermission();
    trackEvent('push_permission_result', { status });
    // Notifications directes (FCM pur) : enregistrer le token de ce device
    if (status === 'GRANTED') {
      const userId = useAuthStore.getState().user?.id;
      if (userId) registerPushToken(userId);
    }
  }, []);

  /** « Plus tard » — on re-proposera dans 30 jours. */
  const dismiss = useCallback(async () => {
    setVisible(false);
    await persistPrompted();
    trackEvent('push_preprompt_dismissed');
  }, []);

  return { visible, accept, dismiss };
}
