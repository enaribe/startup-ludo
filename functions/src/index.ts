/**
 * Cloud Functions pour Startup Ludo
 *
 * Export principal de toutes les fonctions.
 * Note: Ces fonctions sont prêtes mais non déployées.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Game Functions
export { createRoom } from './game/createRoom';
export { joinRoom } from './game/joinRoom';
export { processGameAction } from './game/processGameAction';

// Export User Functions
export { onUserCreate } from './user/onUserCreate';
export { updateStats } from './user/updateStats';
export {
  updateLeaderboard,
  resetWeeklyStats,
  resetMonthlyStats,
} from './user/updateLeaderboard';
