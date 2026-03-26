/**
 * useShakeDetector - Détecte un mouvement de secousse via l'accéléromètre
 *
 * Active l'accéléromètre uniquement quand `enabled` est true (tour du joueur, dé disponible).
 * Appelle `onShake` quand une secousse suffisante est détectée.
 */

import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

// Seuil d'accélération totale pour déclencher la secousse (en G-force)
const SHAKE_THRESHOLD = 2.2;
// Délai minimum entre deux secousses consécutives (ms)
const SHAKE_COOLDOWN_MS = 1000;

interface UseShakeDetectorOptions {
  enabled: boolean;
  onShake: () => void;
}

export function useShakeDetector({ enabled, onShake }: UseShakeDetectorOptions): void {
  const lastShakeAt = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    Accelerometer.setUpdateInterval(100); // 10 fois par seconde

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const totalForce = Math.sqrt(x * x + y * y + z * z);

      if (totalForce > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShakeAt.current > SHAKE_COOLDOWN_MS) {
          lastShakeAt.current = now;
          onShake();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, onShake]);
}
