/**
 * Centralisation des animations Lottie
 *
 * Dossier: assets/animations/
 *
 * Format: JSON (exporté depuis After Effects avec Bodymovin)
 * Source recommandée: lottiefiles.com
 *
 * Usage:
 * import { ANIMATIONS } from '@/constants/animations';
 * import LottieView from 'lottie-react-native';
 *
 * <LottieView source={ANIMATIONS.confetti} autoPlay loop />
 */

// ===== GAME ANIMATIONS =====
export const GAME_ANIMATIONS = {
  // Animations de jeu:
  // diceRoll: require('../../assets/animations/dice-roll.json'),
  // pawnMove: require('../../assets/animations/pawn-move.json'),
  // tokenGain: require('../../assets/animations/token-gain.json'),
  // tokenLoss: require('../../assets/animations/token-loss.json'),
};

// ===== CELEBRATION ANIMATIONS =====
export const CELEBRATION_ANIMATIONS = {
  // Animations de victoire:
  // confetti: require('../../assets/animations/confetti.json'),
  // fireworks: require('../../assets/animations/fireworks.json'),
  // trophy: require('../../assets/animations/trophy.json'),
  // stars: require('../../assets/animations/stars.json'),
};

// ===== UI ANIMATIONS =====
export const UI_ANIMATIONS = {
  // Animations d'interface:
  // loading: require('../../assets/animations/loading.json'),
  // success: require('../../assets/animations/success.json'),
  // error: require('../../assets/animations/error.json'),
  // empty: require('../../assets/animations/empty.json'),
};

// ===== ONBOARDING ANIMATIONS =====
export const ONBOARDING_ANIMATIONS = {
  // Animations d'onboarding:
  // welcome: require('../../assets/animations/onboarding-welcome.json'),
  // tutorial: require('../../assets/animations/onboarding-tutorial.json'),
};

// ===== EXPORT GROUPÉ =====
export const ANIMATIONS = {
  game: GAME_ANIMATIONS,
  celebration: CELEBRATION_ANIMATIONS,
  ui: UI_ANIMATIONS,
  onboarding: ONBOARDING_ANIMATIONS,
};

export default ANIMATIONS;
