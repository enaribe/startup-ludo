"use strict";
/**
 * updateLeaderboard - Cloud Function planifiée pour mettre à jour le leaderboard
 *
 * Exécutée périodiquement pour :
 * - Réinitialiser les XP hebdomadaires chaque lundi
 * - Réinitialiser les XP mensuels chaque 1er du mois
 * - Mettre à jour le classement global
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetMonthlyStats = exports.resetWeeklyStats = exports.updateLeaderboard = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Fonction pour récupérer le top N du leaderboard
async function getTopPlayers(firestore, field, limit) {
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
exports.updateLeaderboard = functions.https.onCall(async () => {
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
    }
    catch (error) {
        functions.logger.error('Failed to update leaderboards', error);
        throw new functions.https.HttpsError('internal', 'Failed to update leaderboards');
    }
});
// Fonction planifiée pour reset hebdomadaire (chaque lundi à 00:00 UTC)
exports.resetWeeklyStats = functions.pubsub
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
    }
    catch (error) {
        functions.logger.error('Failed to reset weekly stats', error);
        return null;
    }
});
// Fonction planifiée pour reset mensuel (chaque 1er du mois à 00:00 UTC)
exports.resetMonthlyStats = functions.pubsub
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
    }
    catch (error) {
        functions.logger.error('Failed to reset monthly stats', error);
        return null;
    }
});
//# sourceMappingURL=updateLeaderboard.js.map