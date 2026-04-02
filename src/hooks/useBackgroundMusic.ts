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

/**
 * Pendant une partie : volume BGM multiplié par ce ratio (dé, popups, etc. restent au niveau normal via `useSound`).
 */
const BGM_GAMEPLAY_DUCK_RATIO = 0.18;

function getBgmVolume(gameplayDuck: boolean): number {
  return gameplayDuck ? BGM_VOLUME * BGM_GAMEPLAY_DUCK_RATIO : BGM_VOLUME;
}

export function useBackgroundMusic(): void {
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const isHydrated = useSettingsStore((state) => state.isHydrated);
  const bgmGameplayDuck = useAudioUiStore((state) => state.bgmGameplayDuck);
  const player = useAudioPlayer(BGM_SOURCE);

  useEffect(() => {
    if (!isHydrated) return;
    const volume = getBgmVolume(bgmGameplayDuck);
    try {
      player.loop = true;
      player.volume = volume;
      if (musicEnabled) {
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
