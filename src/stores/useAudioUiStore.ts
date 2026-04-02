import { create } from 'zustand';

/**
 * État UI audio non persisté (pas AsyncStorage).
 * Pendant une partie, la musique de fond est abaissée ; les SFX gardent leur volume via `useSound`.
 */
interface AudioUiState {
  /** True tant que l’écran de jeu actif est monté */
  bgmGameplayDuck: boolean;
  setBgmGameplayDuck: (duck: boolean) => void;
}

export const useAudioUiStore = create<AudioUiState>((set) => ({
  bgmGameplayDuck: false,
  setBgmGameplayDuck: (duck) => set({ bgmGameplayDuck: duck }),
}));
