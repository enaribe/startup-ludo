/**
 * Centralisation des imports d'images
 *
 * Structure des assets:
 * assets/
 * ├── images/
 * │   ├── icons/          - Icônes UI (PNG/SVG)
 * │   ├── backgrounds/    - Fonds d'écran, patterns
 * │   ├── avatars/        - Avatars joueurs
 * │   ├── cards/          - Cartes du jeu (Quiz, Financement, etc.)
 * │   ├── board/          - Éléments du plateau (cases, pions, dé)
 * │   └── ui/             - Éléments UI (boutons, badges, etc.)
 * ├── sounds/             - Sons du jeu
 * ├── animations/         - Fichiers Lottie (.json)
 * └── fonts/              - Polices personnalisées
 *
 * Usage:
 * import { IMAGES } from '@/constants/images';
 * <Image source={IMAGES.logo} />
 */

// ===== APP ICONS =====
export const APP_ICONS = {
  icon: require('../../assets/images/icon.png'),
  favicon: require('../../assets/images/favicon.png'),
  splashIcon: require('../../assets/images/splash-icon.png'),
  androidBackground: require('../../assets/images/android-icon-background.png'),
  androidForeground: require('../../assets/images/android-icon-foreground.png'),
  androidMonochrome: require('../../assets/images/android-icon-monochrome.png'),
};

// ===== BACKGROUNDS =====
export const BACKGROUNDS = {
  radial: require('../../assets/images/background-radial.png'),
  // Ajouter ici les backgrounds personnalisés:
  // homeBackground: require('../../assets/images/backgrounds/home-bg.png'),
  // gameBackground: require('../../assets/images/backgrounds/game-bg.png'),
};

// ===== ICONS =====
export const ICONS = {
  // Ajouter ici les icônes personnalisées:
  // logo: require('../../assets/images/icons/logo.png'),
  // dice: require('../../assets/images/icons/dice.png'),
  // token: require('../../assets/images/icons/token.png'),
};

// ===== AVATARS =====
export const AVATARS = {
  // Ajouter ici les avatars:
  // default: require('../../assets/images/avatars/default.png'),
  // avatar1: require('../../assets/images/avatars/avatar-1.png'),
  // avatar2: require('../../assets/images/avatars/avatar-2.png'),
};

// ===== BOARD ELEMENTS =====
export const BOARD = {
  // Plateau et pions:
  // board: require('../../assets/images/board/board.png'),
  // pawnYellow: require('../../assets/images/board/pawn-yellow.png'),
  // pawnBlue: require('../../assets/images/board/pawn-blue.png'),
  // pawnGreen: require('../../assets/images/board/pawn-green.png'),
  // pawnRed: require('../../assets/images/board/pawn-red.png'),
  // dice1: require('../../assets/images/board/dice-1.png'),
  // dice2: require('../../assets/images/board/dice-2.png'),
  // ...
};

// ===== CARDS =====
export const CARDS = {
  // Cartes du jeu:
  // quizCard: require('../../assets/images/cards/quiz-card.png'),
  // fundingCard: require('../../assets/images/cards/funding-card.png'),
  // opportunityCard: require('../../assets/images/cards/opportunity-card.png'),
  // challengeCard: require('../../assets/images/cards/challenge-card.png'),
  // targetCard: require('../../assets/images/cards/target-card.png'),
  // missionCard: require('../../assets/images/cards/mission-card.png'),
};

// ===== UI ELEMENTS =====
export const UI = {
  // Éléments UI:
  // buttonPrimary: require('../../assets/images/ui/button-primary.png'),
  // badge: require('../../assets/images/ui/badge.png'),
  // trophy: require('../../assets/images/ui/trophy.png'),
};

// ===== EXPORT GROUPÉ =====
export const IMAGES = {
  app: APP_ICONS,
  backgrounds: BACKGROUNDS,
  icons: ICONS,
  avatars: AVATARS,
  board: BOARD,
  cards: CARDS,
  ui: UI,
};

export default IMAGES;
