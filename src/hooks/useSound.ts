/**
 * useSound - Hook pour la gestion des sons du jeu
 *
 * Utilise expo-audio pour une lecture performante.
 * Respecte le setting soundEnabled du store.
 */

import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { useSettingsStore } from '@/stores';

// Types de sons disponibles
export type SoundName =
  | 'dice-roll'
  | 'pawn-move'
  | 'quiz-correct'
  | 'quiz-wrong'
  | 'token-gain'
  | 'token-loss'
  | 'victory'
  | 'defeat'
  | 'turn-start'
  | 'button-press'
  | 'popup-open'
  | 'capture';

// Map des fichiers sons (chemins relatifs à assets/sounds/)
// Note: Les fichiers doivent être créés dans assets/sounds/
const SOUND_FILES: Record<SoundName, number | null> = {
  'dice-roll': null, // require('@/assets/sounds/dice-roll.mp3'),
  'pawn-move': null, // require('@/assets/sounds/pawn-move.mp3'),
  'quiz-correct': null, // require('@/assets/sounds/quiz-correct.mp3'),
  'quiz-wrong': null, // require('@/assets/sounds/quiz-wrong.mp3'),
  'token-gain': null, // require('@/assets/sounds/token-gain.mp3'),
  'token-loss': null, // require('@/assets/sounds/token-loss.mp3'),
  'victory': null, // require('@/assets/sounds/victory.mp3'),
  'defeat': null, // require('@/assets/sounds/defeat.mp3'),
  'turn-start': null, // require('@/assets/sounds/turn-start.mp3'),
  'button-press': null, // require('@/assets/sounds/button-press.mp3'),
  'popup-open': null, // require('@/assets/sounds/popup-open.mp3'),
  'capture': null, // require('@/assets/sounds/capture.mp3'),
};

interface UseSoundReturn {
  play: (name: SoundName, volume?: number) => Promise<void>;
  preload: () => Promise<void>;
  unloadAll: () => Promise<void>;
  isEnabled: boolean;
}

export function useSound(): UseSoundReturn {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const soundsRef = useRef<Map<SoundName, Audio.Sound>>(new Map());
  const isLoadedRef = useRef(false);

  // Précharger tous les sons
  const preload = useCallback(async () => {
    if (isLoadedRef.current) return;

    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Charger chaque son
      for (const [name, source] of Object.entries(SOUND_FILES)) {
        if (source !== null) {
          try {
            const { sound } = await Audio.Sound.createAsync(source, {
              shouldPlay: false,
              volume: 1.0,
            });
            soundsRef.current.set(name as SoundName, sound);
          } catch (error) {
            if (__DEV__) {
              console.warn(`[useSound] Failed to load sound: ${name}`, error);
            }
          }
        }
      }

      isLoadedRef.current = true;
    } catch (error) {
      if (__DEV__) {
        console.warn('[useSound] Failed to configure audio mode:', error);
      }
    }
  }, []);

  // Jouer un son
  const play = useCallback(
    async (name: SoundName, volume = 1.0) => {
      if (!soundEnabled) return;

      const sound = soundsRef.current.get(name);
      if (!sound) {
        // Son non chargé ou fichier manquant
        if (__DEV__) {
          console.log(`[useSound] Sound not loaded: ${name}`);
        }
        return;
      }

      try {
        // Reset au début
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(volume);
        await sound.playAsync();
      } catch (error) {
        if (__DEV__) {
          console.warn(`[useSound] Failed to play sound: ${name}`, error);
        }
      }
    },
    [soundEnabled]
  );

  // Décharger tous les sons
  const unloadAll = useCallback(async () => {
    for (const sound of soundsRef.current.values()) {
      try {
        await sound.unloadAsync();
      } catch {
        // Ignorer les erreurs de déchargement
      }
    }
    soundsRef.current.clear();
    isLoadedRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unloadAll();
    };
  }, [unloadAll]);

  return {
    play,
    preload,
    unloadAll,
    isEnabled: soundEnabled,
  };
}

/**
 * Hook simplifié pour jouer des sons ponctuels
 * Sans préchargement, pour des sons non-critiques
 */
export function usePlaySound() {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);

  const playOnce = useCallback(
    async (source: number, volume = 1.0) => {
      if (!soundEnabled) return;

      try {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: true,
          volume,
        });

        // Auto-unload when finished
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      } catch (error) {
        if (__DEV__) {
          console.warn('[usePlaySound] Failed to play sound:', error);
        }
      }
    },
    [soundEnabled]
  );

  return { playOnce, isEnabled: soundEnabled };
}
