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
  /** Titre court de l'étape. */
  title: string;
  /** Explication affichée dans la bulle. */
  text: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Bienvenue sur le plateau !',
    text: "Voici un petit guide pour découvrir comment jouer. Suis les flèches — tu peux passer à tout moment.",
  },
  {
    target: 'dice',
    title: 'Lance le dé',
    text: "Quand c'est ton tour, appuie sur le dé pour le lancer. Ton pion avance du nombre de cases obtenu.",
  },
  {
    target: 'board',
    title: 'Les cases du plateau',
    text: "Selon la case où tu t'arrêtes, il se passe quelque chose : un quiz, un duel contre un adversaire, un financement, ou un joker à gagner.",
  },
  {
    target: 'tokens',
    title: 'Tes jetons & ton objectif',
    text: "Cette barre montre tes jetons. Gagnes-en un maximum : à la fin de la partie, le joueur avec le plus de jetons l'emporte !",
  },
  {
    target: 'jokers',
    title: 'Tes jokers',
    text: "Les jokers te donnent des coups de pouce : choisir ton dé, relancer, te protéger ou voler des jetons. Appuie ici pour les utiliser.",
  },
  {
    title: "C'est parti !",
    text: "Tu connais l'essentiel. À toi de jouer et de bâtir la meilleure startup. Bonne chance !",
  },
];
