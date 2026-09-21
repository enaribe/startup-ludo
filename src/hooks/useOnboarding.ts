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

import { trackAmplitudeEvent } from '@/services/analytics';
import { useAuthStore, useUserStore } from '@/stores';

/**
 * Ancienne clé, GLOBALE à l'appareil — la cause du bug corrigé ici.
 *
 * `AsyncStorage` ne connaît pas les comptes : le premier utilisateur d'un
 * téléphone posait ce flag, et TOUS les comptes suivants héritaient d'un
 * onboarding « déjà vu » qu'ils n'avaient jamais fait. Sur un appareil
 * partagé — ou pendant les tests, où l'on enchaîne les comptes — seul le
 * tout premier voyait le parcours d'accueil.
 *
 * Conservée en lecture seule pour la migration : un joueur qui a réellement
 * terminé l'onboarding avant ce correctif ne doit pas le revoir.
 */
const ANCIENNE_CLE_GLOBALE = '@onboarding_completed';

/** Clé par COMPTE : « @onboarding_completed:<userId> ». */
function cleOnboarding(userId: string): string {
  return `${ANCIENNE_CLE_GLOBALE}:${userId}`;
}

/**
 * Efface le flag « onboarding vu » pour le revoir au prochain lancement.
 *
 * Le flag est posé DÉFINITIVEMENT à la première complétion, et rien dans
 * l'app ne permettait de revenir dessus : la seule façon de retester le
 * parcours était de désinstaller. Exportée pour un bouton de réglages ou un
 * appel depuis la console de debug.
 */
export async function reinitialiserOnboarding(userId?: string): Promise<void> {
  // Sans `userId`, on efface aussi l'ancienne clé globale : c'est le geste
  // attendu quand on veut « repartir de zéro » sur l'appareil.
  await AsyncStorage.multiRemove(
    userId ? [cleOnboarding(userId)] : [ANCIENNE_CLE_GLOBALE]
  );
  if (__DEV__) console.log('[Onboarding] flag effacé — réapparaîtra au prochain lancement');
}

export function useOnboarding() {
  const profile = useUserStore((state) => state.profile);
  const isGuest = useAuthStore((state) => state.user?.isGuest ?? true);
  const [visible, setVisible] = useState(false);
  /**
   * Compte DÉJÀ vérifié, et non un simple booléen : si le hook reste monté
   * pendant un changement de compte, un `true` figé empêcherait de vérifier
   * le nouveau — il n'aurait jamais son onboarding.
   */
  const checkedRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Diagnostic : les trois conditions se ressemblent depuis l'extérieur —
    // dans les trois cas, le popup ne s'affiche simplement pas.
    if (!profile) {
      if (__DEV__) console.log('[Onboarding] en attente du profil');
      return;
    }
    if (isGuest) {
      if (__DEV__) console.log('[Onboarding] compte INVITÉ — jamais affiché');
      return;
    }
    if (checkedRef.current === profile.userId) return;
    checkedRef.current = profile.userId;

    checkAndShow(profile.userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isGuest]);

  // Annule un éventuel setVisible(true) différé si l'écran est démonté
  // (évite un popup fantôme qui bloquerait les taps au retour).
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const checkAndShow = async (userId: string) => {
    try {
      const cle = cleOnboarding(userId);
      let completed = await AsyncStorage.getItem(cle);

      // MIGRATION : avant ce correctif, le flag était global. On l'attribue au
      // compte COURANT (le seul dont on puisse dire qu'il a vu l'onboarding
      // sur cet appareil), puis on efface l'ancienne clé pour que les comptes
      // suivants repartent proprement.
      if (!completed) {
        const ancien = await AsyncStorage.getItem(ANCIENNE_CLE_GLOBALE);
        if (ancien) {
          await AsyncStorage.multiSet([[cle, ancien]]);
          await AsyncStorage.removeItem(ANCIENNE_CLE_GLOBALE);
          completed = ancien;
          if (__DEV__) console.log('[Onboarding] ancien flag global migré vers ce compte');
        }
      }

      if (__DEV__) {
        console.log(
          completed
            ? `[Onboarding] DÉJÀ VU pour ${userId} — ne se réaffichera pas`
            : `[Onboarding] jamais vu pour ${userId} → affichage dans 600 ms`
        );
      }
      if (!completed) {
        // Petit délai pour laisser le home s'afficher d'abord
        timerRef.current = setTimeout(() => {
          setVisible(true);
          trackAmplitudeEvent('onboarding_started');
        }, 600);
      }
    } catch {
      // En cas d'erreur, on affiche quand même l'onboarding
      timerRef.current = setTimeout(() => {
        setVisible(true);
        trackAmplitudeEvent('onboarding_started');
      }, 600);
    }
  };

  const complete = useCallback(async () => {
    setVisible(false);
    trackAmplitudeEvent('onboarding_completed');
    const userId = useUserStore.getState().profile?.userId;
    if (!userId) return; // sans compte, rien à marquer
    try {
      await AsyncStorage.setItem(cleOnboarding(userId), '1');
    } catch {
      // silencieux
    }
  }, []);

  /**
   * Fermeture AVANT la fin (PASSER, back Android) : même flag « déjà vu »
   * (on ne re-harcèle pas le joueur), mais l'événement Amplitude distingue
   * l'abandon — avec l'étape où il a décroché — du parcours complété.
   */
  const abandon = useCallback(async (stepName: string) => {
    setVisible(false);
    trackAmplitudeEvent('onboarding_abandoned', { step_name: stepName });
    const userId = useUserStore.getState().profile?.userId;
    if (!userId) return;
    try {
      await AsyncStorage.setItem(cleOnboarding(userId), '1');
    } catch {
      // silencieux
    }
  }, []);

  return { visible, complete, abandon };
}
