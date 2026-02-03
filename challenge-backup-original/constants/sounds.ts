/**
 * Centralisation des imports de sons
 *
 * Dossier: assets/sounds/
 *
 * Format recommandé: MP3 ou WAV
 * - MP3: Plus léger, compatibilité universelle
 * - WAV: Meilleure qualité, latence plus faible
 *
 * Usage:
 * import { SOUNDS } from '@/constants/sounds';
 * import { Audio } from 'expo-audio';
 *
 * const sound = await Audio.Sound.createAsync(SOUNDS.diceRoll);
 * await sound.sound.playAsync();
 */

// ===== GAME SOUNDS =====
export const GAME_SOUNDS = {
  // Sons de dé:
  // diceRoll: require('../../assets/sounds/dice-roll.mp3'),
  // diceResult: require('../../assets/sounds/dice-result.mp3'),

  // Sons de pions:
  // pawnMove: require('../../assets/sounds/pawn-move.mp3'),
  // pawnCapture: require('../../assets/sounds/pawn-capture.mp3'),
  // pawnHome: require('../../assets/sounds/pawn-home.mp3'),
  // pawnFinish: require('../../assets/sounds/pawn-finish.mp3'),
};

// ===== UI SOUNDS =====
export const UI_SOUNDS = {
  // Sons d'interface:
  // buttonTap: require('../../assets/sounds/button-tap.mp3'),
  // success: require('../../assets/sounds/success.mp3'),
  // error: require('../../assets/sounds/error.mp3'),
  // notification: require('../../assets/sounds/notification.mp3'),
};

// ===== QUIZ SOUNDS =====
export const QUIZ_SOUNDS = {
  // Sons de quiz:
  // correct: require('../../assets/sounds/quiz-correct.mp3'),
  // wrong: require('../../assets/sounds/quiz-wrong.mp3'),
  // timer: require('../../assets/sounds/quiz-timer.mp3'),
  // timerEnd: require('../../assets/sounds/quiz-timer-end.mp3'),
};

// ===== TOKEN SOUNDS =====
export const TOKEN_SOUNDS = {
  // Sons de jetons:
  // gain: require('../../assets/sounds/token-gain.mp3'),
  // loss: require('../../assets/sounds/token-loss.mp3'),
  // jackpot: require('../../assets/sounds/token-jackpot.mp3'),
};

// ===== CELEBRATION SOUNDS =====
export const CELEBRATION_SOUNDS = {
  // Sons de victoire:
  // victory: require('../../assets/sounds/victory.mp3'),
  // applause: require('../../assets/sounds/applause.mp3'),
  // fanfare: require('../../assets/sounds/fanfare.mp3'),
};

// ===== MUSIC =====
export const MUSIC = {
  // Musiques de fond:
  // menuTheme: require('../../assets/sounds/music-menu.mp3'),
  // gameTheme: require('../../assets/sounds/music-game.mp3'),
};

// ===== EXPORT GROUPÉ =====
export const SOUNDS = {
  game: GAME_SOUNDS,
  ui: UI_SOUNDS,
  quiz: QUIZ_SOUNDS,
  tokens: TOKEN_SOUNDS,
  celebration: CELEBRATION_SOUNDS,
  music: MUSIC,
};

export default SOUNDS;
