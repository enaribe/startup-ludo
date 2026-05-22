/**
 * useTutorialStore — état du tutoriel interactif du plateau de jeu.
 *
 * Gère :
 *  - `completed` : booléen persistant — le tutoriel a-t-il déjà été fait ?
 *  - `active` / `stepIndex` : déroulement en cours du tutoriel
 *  - `targets` : positions à l'écran des éléments à pointer (dé, jetons, jokers…)
 *
 * Le booléen `completed` est le seul champ persisté : tant qu'il est `false`,
 * le tutoriel se relance à la première partie. « Passer » ou « Terminer »
 * le passe à `true`.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Identifiant d'un élément du plateau ciblable par le tutoriel. */
export type TutorialTargetId = 'dice' | 'tokens' | 'board' | 'jokers';

/** Rectangle d'un élément mesuré à l'écran (coordonnées fenêtre). */
export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TutorialStoreState {
  /** Le tutoriel a déjà été terminé ou passé (persisté). */
  completed: boolean;
  /** Le tutoriel est en cours d'affichage. */
  active: boolean;
  /** Index de l'étape courante. */
  stepIndex: number;
  /** Positions mesurées des éléments ciblables. */
  targets: Partial<Record<TutorialTargetId, TargetRect>>;
  /** Hydratation AsyncStorage terminée. */
  isHydrated: boolean;
}

interface TutorialStoreActions {
  /** Démarre le tutoriel (si pas déjà fait). */
  start: () => void;
  /** Étape suivante. */
  next: () => void;
  /** Étape précédente. */
  prev: () => void;
  /** Termine le tutoriel et le marque comme complété. */
  finish: () => void;
  /** Passe le tutoriel et le marque comme complété. */
  skip: () => void;
  /** Enregistre / met à jour la position d'un élément ciblable. */
  registerTarget: (id: TutorialTargetId, rect: TargetRect) => void;
  /** Réinitialise le tutoriel (utile pour le relancer manuellement). */
  reset: () => void;
}

type TutorialStore = TutorialStoreState & TutorialStoreActions;

const initialState: TutorialStoreState = {
  completed: false,
  active: false,
  stepIndex: 0,
  targets: {},
  isHydrated: false,
};

export const useTutorialStore = create<TutorialStore>()(
  persist(
    immer<TutorialStore>((set, get) => ({
      ...initialState,

      start: () => {
        if (get().completed) return;
        set((state) => {
          state.active = true;
          state.stepIndex = 0;
        });
      },

      next: () => {
        set((state) => {
          state.stepIndex += 1;
        });
      },

      prev: () => {
        set((state) => {
          state.stepIndex = Math.max(0, state.stepIndex - 1);
        });
      },

      finish: () => {
        set((state) => {
          state.active = false;
          state.completed = true;
          state.stepIndex = 0;
        });
      },

      skip: () => {
        set((state) => {
          state.active = false;
          state.completed = true;
          state.stepIndex = 0;
        });
      },

      registerTarget: (id, rect) => {
        set((state) => {
          state.targets[id] = rect;
        });
      },

      reset: () => {
        set((state) => {
          state.completed = false;
          state.active = false;
          state.stepIndex = 0;
          state.targets = {};
        });
      },
    })),
    {
      name: 'startup-ludo-tutorial',
      storage: createJSONStorage(() => AsyncStorage),
      // Seul `completed` est persisté — le reste est éphémère
      partialize: (state) => ({ completed: state.completed }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    }
  )
);
