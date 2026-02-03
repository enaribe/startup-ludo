/**
 * useSound - Hook pour la gestion des sons du jeu
 *
 * Utilise expo-audio pour une lecture performante.
 * Respecte le setting soundEnabled du store.
 */

import { useCallback } from 'react';
import { useAudioPlayer, AudioSource } from 'expo-audio';
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
const SOUND_FILES: Record<SoundName, AudioSource | null> = {
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
  play: (name: SoundName, volume?: number) => void;
  isEnabled: boolean;
}

/**
 * Hook pour jouer des sons dans le jeu
 * Utilise expo-audio avec l'API moderne useAudioPlayer
 */
export function useSound(): UseSoundReturn {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const player = useAudioPlayer(null);

  // Jouer un son
  const play = useCallback(
    (name: SoundName, _volume = 1.0) => {
      if (!soundEnabled) return;

      const source = SOUND_FILES[name];
      if (!source) {
        // Son non configuré ou fichier manquant
        if (__DEV__) {
          console.log(`[useSound] Sound not configured: ${name}`);
        }
        return;
      }

      try {
        player.replace(source);
        player.play();
      } catch (error) {
        if (__DEV__) {
          console.warn(`[useSound] Failed to play sound: ${name}`, error);
        }
      }
    },
    [soundEnabled, player]
  );

  return {
    play,
    isEnabled: soundEnabled,
  };
}

/**
 * Hook simplifié pour jouer des sons ponctuels
 * Sans préchargement, pour des sons non-critiques
 */
export function usePlaySound() {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const player = useAudioPlayer(null);

  const playOnce = useCallback(
    (source: AudioSource) => {
      if (!soundEnabled) return;

      try {
        player.replace(source);
        player.play();
      } catch (error) {
        if (__DEV__) {
          console.warn('[usePlaySound] Failed to play sound:', error);
        }
      }
    },
    [soundEnabled, player]
  );

  return { playOnce, isEnabled: soundEnabled };
}
