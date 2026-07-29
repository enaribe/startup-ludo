/**
 * Cloud Functions pour Startup Ludo
 *
 * Export principal de toutes les fonctions.
 * Note: Ces fonctions sont prêtes mais non déployées.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Callables legacy (createRoom, joinRoom, processGameAction, updateStats) :
// jamais déployés ni appelés par l'app (rooms gérées côté client via Realtime DB).
// Ils ne compilent pas (style v2 sur API v1) → exclus du build (cf. tsconfig.json).

// Export Notification Functions (FCM direct, hors Customer.io)
export { onGameInvitationCreated } from './notifications/onGameInvitationCreated';

// Export User Functions
export { onUserCreate } from './user/onUserCreate';
export {
  updateLeaderboard,
  resetWeeklyStats,
  resetMonthlyStats,
} from './user/updateLeaderboard';
