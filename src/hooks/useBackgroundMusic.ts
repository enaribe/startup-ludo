/**
 * Musique de fond continue (song1.mp3), en boucle.
 * Respecte `musicEnabled` et l’hydratation du store (préférences persistées).
 * Les effets sonores utilisent un autre lecteur (`useSound`).
 */

import { useEffect } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { useAudioUiStore, useSettingsStore } from '@/stores';

const BGM_SOURCE = require('../../assets/sounds/song1.mp3');

/** Volume musique de fond hors partie (0–1) */
const BGM_VOLUME = 0.35;

export function useBackgroundMusic(): void {
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const isHydrated = useSettingsStore((state) => state.isHydrated);
  const bgmGameplayDuck = useAudioUiStore((state) => state.bgmGameplayDuck);
  const player = useAudioPlayer(BGM_SOURCE);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      player.loop = true;
      if (bgmGameplayDuck) {
        player.pause();
      } else if (musicEnabled) {
        player.volume = BGM_VOLUME;
        player.play();
      } else {
        player.pause();
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[useBackgroundMusic] playback error', error);
      }
    }
  }, [isHydrated, musicEnabled, bgmGameplayDuck, player]);
}
