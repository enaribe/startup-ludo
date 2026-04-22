/**
 * gameLog - Logger centralisé pour le gameplay
 *
 * Par défaut silencieux pour ne pas spammer la console.
 * Active les catégories dont tu as besoin via GAME_LOG_FLAGS.
 *
 * En prod (!__DEV__), seuls les niveaux 'error' et 'crash' remontent.
 */

type LogCategory =
  | 'board'      // GameBoard, calcul positions
  | 'pawn'       // Pawn animations
  | 'turn'       // useTurnMachine
  | 'store'      // useGameStore (executeMove, exitHome, ...)
  | 'remote'     // applyRemoteAction
  | 'duel'       // useDuel
  | 'popup'      // Quiz/Funding/Duel popups montages
  | 'crash';     // debug spécial autour des crashs SVG / render

/**
 * Active/désactive par catégorie.
 * Changer ici pour activer les logs pendant debug, remettre à `false` en temps normal.
 */
const GAME_LOG_FLAGS: Record<LogCategory, boolean> = {
  board: false,
  pawn: false,
  turn: false,
  store: false,
  remote: false,
  duel: false,
  popup: false,
  crash: true,  // ⚡ Logs spéciaux pour le debug du crash Motorola - à désactiver après fix
};

/** Log normal — filtré par catégorie */
export const gameLog = (category: LogCategory, ...args: unknown[]): void => {
  if (!__DEV__) return;
  if (!GAME_LOG_FLAGS[category]) return;
  // eslint-disable-next-line no-console
  console.log(`[${category}]`, ...args);
};

/** Warning — toujours affiché en dev */
export const gameWarn = (category: LogCategory, ...args: unknown[]): void => {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.warn(`[${category}]`, ...args);
};

/** Erreur — toujours affichée (même en prod, pour Crashlytics plus tard) */
export const gameError = (category: LogCategory, ...args: unknown[]): void => {
  // eslint-disable-next-line no-console
  console.error(`[${category}]`, ...args);
};

/**
 * Log spécial pour debug du crash SVG :
 * log toujours en dev, traçabilité du composant + état.
 */
export const crashLog = (tag: string, data?: Record<string, unknown>): void => {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[CRASH-DEBUG] ${tag}`, data ?? '');
};
