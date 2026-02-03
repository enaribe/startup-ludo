/**
 * useHaptics - Hook pour la gestion des retours haptiques
 *
 * Utilise expo-haptics pour des vibrations performantes.
 * Respecte le setting hapticsEnabled du store.
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useSettingsStore } from '@/stores';

// Types de feedback haptique disponibles
export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

// Mapping des types vers les impacts/notifications expo-haptics
const HAPTIC_MAP: Record<HapticType, () => Promise<void>> = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};

interface UseHapticsReturn {
  trigger: (type: HapticType) => Promise<void>;
  isEnabled: boolean;
  isSupported: boolean;
}

export function useHaptics(): UseHapticsReturn {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  // Haptics only supported on iOS and Android (not web)
  const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

  const trigger = useCallback(
    async (type: HapticType) => {
      if (!hapticsEnabled || !isSupported) return;

      try {
        const hapticFn = HAPTIC_MAP[type];
        if (hapticFn) {
          await hapticFn();
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(`[useHaptics] Failed to trigger haptic: ${type}`, error);
        }
      }
    },
    [hapticsEnabled, isSupported]
  );

  return {
    trigger,
    isEnabled: hapticsEnabled,
    isSupported,
  };
}

/**
 * Helpers pour des cas d'usage courants
 */

// Hook simplifié pour les boutons
export function useButtonHaptic() {
  const { trigger, isEnabled, isSupported } = useHaptics();

  const onPress = useCallback(() => {
    trigger('light');
  }, [trigger]);

  return { onPress, isEnabled, isSupported };
}

// Hook pour les actions de jeu
export function useGameHaptics() {
  const { trigger, isEnabled, isSupported } = useHaptics();

  const diceRoll = useCallback(() => trigger('medium'), [trigger]);
  const pawnMove = useCallback(() => trigger('light'), [trigger]);
  const quizCorrect = useCallback(() => trigger('success'), [trigger]);
  const quizWrong = useCallback(() => trigger('error'), [trigger]);
  const tokenGain = useCallback(() => trigger('success'), [trigger]);
  const tokenLoss = useCallback(() => trigger('warning'), [trigger]);
  const victory = useCallback(() => trigger('heavy'), [trigger]);
  const capture = useCallback(() => trigger('heavy'), [trigger]);
  const selection = useCallback(() => trigger('selection'), [trigger]);

  return {
    diceRoll,
    pawnMove,
    quizCorrect,
    quizWrong,
    tokenGain,
    tokenLoss,
    victory,
    capture,
    selection,
    isEnabled,
    isSupported,
  };
}
