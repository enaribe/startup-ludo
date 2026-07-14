/**
 * Étapes du tutoriel interactif du plateau de jeu.
 *
 * Chaque étape pointe (ou non) un élément réel de l'écran via `target`.
 * Une étape sans `target` est une bulle centrée (intro / conclusion).
 */
import type { TutorialTargetId } from '@/stores/useTutorialStore';

export interface TutorialStep {
  /** Élément à mettre en avant — absent = bulle centrée plein écran. */
  target?: TutorialTargetId;
  /** Clé i18n du titre court de l'étape. */
  titleKey: string;
  /** Clé i18n de l'explication affichée dans la bulle. */
  textKey: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  { titleKey: 'tutorial.welcome.title', textKey: 'tutorial.welcome.text' },
  { target: 'dice', titleKey: 'tutorial.dice.title', textKey: 'tutorial.dice.text' },
  { target: 'board', titleKey: 'tutorial.board.title', textKey: 'tutorial.board.text' },
  { target: 'tokens', titleKey: 'tutorial.tokens.title', textKey: 'tutorial.tokens.text' },
  { target: 'jokers', titleKey: 'tutorial.jokers.title', textKey: 'tutorial.jokers.text' },
  { titleKey: 'tutorial.done.title', textKey: 'tutorial.done.text' },
];
