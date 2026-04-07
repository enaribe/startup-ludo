/**
 * useSound - Hook pour la gestion des sons du jeu
 *
 * Fichiers dans assets/sounds/ (racine projet) :
 * - correctt.mp3  → quiz bonne réponse
 * - wrong.mp3     → quiz mauvaise réponse
 * - move.mp3      → déplacement pion
 * - rolldice.mp3  → lancer le dé
 * - showpopup.mp3 → ouverture popups (quiz, opportunité, duel, financement…)
 * - winn.mp3      → victoire
 * - lose.mp3      → défaite
 * - tour.mp3      → passage de tour à un autre joueur (pas au lancer du dé)
 * - song1.mp3     → musique de fond (voir useBackgroundMusic, musicEnabled)
 *
 * Utilise expo-audio. Respecte soundEnabled du store.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAudioPlayer, type AudioSource } from 'expo-audio';
import { useSettingsStore } from '@/stores';

/** Clés sémantiques (indépendantes des noms de fichiers) */
export type SoundName =
  | 'quiz-correct'
  | 'quiz-wrong'
  | 'pawn-move'
  | 'dice-roll'
  | 'popup-open'
  | 'victory'
  | 'defeat'
  | 'tour';

const SOUND_FILES: Record<SoundName, AudioSource> = {
  'quiz-correct': require('../../assets/sounds/correctt.mp3'),
  'quiz-wrong': require('../../assets/sounds/wrong.mp3'),
  'pawn-move': require('../../assets/sounds/move.mp3'),
  'dice-roll': require('../../assets/sounds/rolldice.mp3'),
  'popup-open': require('../../assets/sounds/showpopup.mp3'),
  victory: require('../../assets/sounds/winn.mp3'),
  defeat: require('../../assets/sounds/lose.mp3'),
  tour: require('../../assets/sounds/tour.mp3'),
};

interface UseSoundReturn {
  play: (name: SoundName, volume?: number) => void;
  isEnabled: boolean;
}

/**
 * Hook pour jouer des sons dans le jeu
 */
export function useSound(): UseSoundReturn {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const player = useAudioPlayer(null);

  const play = useCallback(
    (name: SoundName, _volume = 1.0) => {
      if (!soundEnabled) return;

      const source = SOUND_FILES[name];
      if (!source) {
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
 * Joue un son une fois à l’ouverture (transition false → true de `visible`).
 */
export function usePlaySoundOnOpen(visible: boolean, name: SoundName): void {
  const { play } = useSound();
  const prevVisible = useRef(false);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      play(name);
    }
    prevVisible.current = visible;
  }, [visible, name, play]);
}

/**
 * Hook simplifié pour un fichier audio arbitraire
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
