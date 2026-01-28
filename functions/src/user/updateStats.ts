/**
 * updateStats - Cloud Function pour mettre à jour les statistiques utilisateur
 *
 * Appelée à la fin d'une partie pour mettre à jour les stats du joueur
 * (XP, parties jouées/gagnées, jetons, etc.)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface UpdateStatsRequest {
  userId: string;
  gameResult: {
    won: boolean;
    tokensEarned: number;
    xpEarned: number;
    position: number; // Classement final dans la partie
    totalPlayers: number;
  };
}

// Système de rangs basé sur l'XP
const RANKS = [
  { id: 'intern', minXP: 0, name: 'Stagiaire' },
  { id: 'junior', minXP: 500, name: 'Junior' },
  { id: 'senior', minXP: 2000, name: 'Senior' },
  { id: 'lead', minXP: 5000, name: 'Lead' },
  { id: 'ceo', minXP: 10000, name: 'CEO' },
  { id: 'unicorn', minXP: 25000, name: 'Licorne' },
];

function getRankFromXP(xp: number): string {
  let rank = RANKS[0].id;
  for (const r of RANKS) {
    if (xp >= r.minXP) {
      rank = r.id;
    }
  }
  return rank;
}

function getLevelFromXP(xp: number): number {
  // 100 XP par niveau, avec progression croissante
  // Niveau 1: 0-99 XP, Niveau 2: 100-299 XP, etc.
  return Math.floor(Math.sqrt(xp / 25)) + 1;
}

export const updateStats = functions.https.onCall(
  async (request: functions.https.CallableRequest<UpdateStatsRequest>) => {
    const { userId, gameResult } = request.data;

    // Validation
    if (!userId || !gameResult) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId and gameResult are required'
      );
    }

    const firestore = admin.firestore();
    const userRef = firestore.collection('users').doc(userId);
    const statsRef = firestore.collection('userStats').doc(userId);

    try {
      // Transaction pour éviter les conflits
      await firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'User not found');
        }

        const userData = userDoc.data() || {};
        const currentXP = userData.xp || 0;
        const newXP = currentXP + gameResult.xpEarned;
        const newRank = getRankFromXP(newXP);
        const newLevel = getLevelFromXP(newXP);

        // Mettre à jour le profil utilisateur
        transaction.update(userRef, {
          xp: newXP,
          level: newLevel,
          rank: newRank,
          gamesPlayed: admin.firestore.FieldValue.increment(1),
          gamesWon: gameResult.won
            ? admin.firestore.FieldValue.increment(1)
            : userData.gamesWon,
          totalTokensEarned: admin.firestore.FieldValue.increment(
            gameResult.tokensEarned
          ),
          lastLogin: Date.now(),
        });

        // Mettre à jour les statistiques pour le leaderboard
        transaction.update(statsRef, {
          xp: newXP,
          gamesWon: gameResult.won
            ? admin.firestore.FieldValue.increment(1)
            : userData.gamesWon || 0,
          totalTokensEarned: admin.firestore.FieldValue.increment(
            gameResult.tokensEarned
          ),
          weeklyXP: admin.firestore.FieldValue.increment(gameResult.xpEarned),
          monthlyXP: admin.firestore.FieldValue.increment(gameResult.xpEarned),
          lastUpdated: Date.now(),
        });
      });

      functions.logger.info(
        `Stats updated for user ${userId}: +${gameResult.xpEarned} XP, +${gameResult.tokensEarned} tokens`
      );

      // Vérifier si l'utilisateur a changé de rang
      const updatedUser = await userRef.get();
      const updatedData = updatedUser.data();

      return {
        success: true,
        newXP: updatedData?.xp,
        newLevel: updatedData?.level,
        newRank: updatedData?.rank,
        rankUp: updatedData?.rank !== getRankFromXP(updatedData?.xp - gameResult.xpEarned),
      };
    } catch (error) {
      functions.logger.error(`Failed to update stats for user: ${userId}`, error);
      throw new functions.https.HttpsError('internal', 'Failed to update stats');
    }
  }
);
