/**
 * updateLeaderboard - Cloud Function planifiée pour mettre à jour le leaderboard
 *
 * Exécutée périodiquement pour :
 * - Réinitialiser les XP hebdomadaires chaque lundi
 * - Réinitialiser les XP mensuels chaque 1er du mois
 * - Mettre à jour le classement global
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  rank: number;
  xp: number;
  gamesWon: number;
}

// Fonction pour récupérer le top N du leaderboard
async function getTopPlayers(
  firestore: admin.firestore.Firestore,
  field: string,
  limit: number
): Promise<LeaderboardEntry[]> {
  const snapshot = await firestore
    .collection('userStats')
    .orderBy(field, 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc, index) => {
    const data = doc.data();
    return {
      userId: doc.id,
      displayName: data.displayName || 'Anonyme',
      rank: index + 1,
      xp: data[field] || 0,
      gamesWon: data.gamesWon || 0,
    };
  });
}

// Mise à jour manuelle du leaderboard (callable)
export const updateLeaderboard = functions.https.onCall(async () => {
  const firestore = admin.firestore();

  try {
    // Récupérer les tops pour chaque catégorie
    const [allTimeTop, weeklyTop, monthlyTop] = await Promise.all([
      getTopPlayers(firestore, 'xp', 100),
      getTopPlayers(firestore, 'weeklyXP', 100),
      getTopPlayers(firestore, 'monthlyXP', 100),
    ]);

    // Sauvegarder les leaderboards
    const leaderboardRef = firestore.collection('leaderboards');

    await Promise.all([
      leaderboardRef.doc('allTime').set({
        entries: allTimeTop,
        updatedAt: Date.now(),
      }),
      leaderboardRef.doc('weekly').set({
        entries: weeklyTop,
        updatedAt: Date.now(),
      }),
      leaderboardRef.doc('monthly').set({
        entries: monthlyTop,
        updatedAt: Date.now(),
      }),
    ]);

    functions.logger.info('Leaderboards updated successfully');

    return { success: true };
  } catch (error) {
    functions.logger.error('Failed to update leaderboards', error);
    throw new functions.https.HttpsError('internal', 'Failed to update leaderboards');
  }
});

// Fonction planifiée pour reset hebdomadaire (chaque lundi à 00:00 UTC)
export const resetWeeklyStats = functions.pubsub
  .schedule('0 0 * * 1') // Cron: chaque lundi à minuit
  .timeZone('UTC')
  .onRun(async () => {
    const firestore = admin.firestore();

    try {
      // Reset les XP hebdomadaires de tous les utilisateurs
      const batch = firestore.batch();
      const statsSnapshot = await firestore.collection('userStats').get();

      statsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { weeklyXP: 0 });
      });

      await batch.commit();

      functions.logger.info('Weekly stats reset completed');
      return null;
    } catch (error) {
      functions.logger.error('Failed to reset weekly stats', error);
      return null;
    }
  });

// Fonction planifiée pour reset mensuel (chaque 1er du mois à 00:00 UTC)
export const resetMonthlyStats = functions.pubsub
  .schedule('0 0 1 * *') // Cron: chaque 1er du mois à minuit
  .timeZone('UTC')
  .onRun(async () => {
    const firestore = admin.firestore();

    try {
      // Reset les XP mensuels de tous les utilisateurs
      const batch = firestore.batch();
      const statsSnapshot = await firestore.collection('userStats').get();

      statsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { monthlyXP: 0 });
      });

      await batch.commit();

      functions.logger.info('Monthly stats reset completed');
      return null;
    } catch (error) {
      functions.logger.error('Failed to reset monthly stats', error);
      return null;
    }
  });
