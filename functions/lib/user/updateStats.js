"use strict";
/**
 * updateStats - Cloud Function pour mettre à jour les statistiques utilisateur
 *
 * Appelée à la fin d'une partie pour mettre à jour les stats du joueur
 * (XP, parties jouées/gagnées, jetons, etc.)
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
exports.updateStats = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Système de rangs basé sur l'XP
const RANKS = [
    { id: 'intern', minXP: 0, name: 'Stagiaire' },
    { id: 'junior', minXP: 500, name: 'Junior' },
    { id: 'senior', minXP: 2000, name: 'Senior' },
    { id: 'lead', minXP: 5000, name: 'Lead' },
    { id: 'ceo', minXP: 10000, name: 'CEO' },
    { id: 'unicorn', minXP: 25000, name: 'Licorne' },
];
function getRankFromXP(xp) {
    let rank = RANKS[0].id;
    for (const r of RANKS) {
        if (xp >= r.minXP) {
            rank = r.id;
        }
    }
    return rank;
}
function getLevelFromXP(xp) {
    // 100 XP par niveau, avec progression croissante
    // Niveau 1: 0-99 XP, Niveau 2: 100-299 XP, etc.
    return Math.floor(Math.sqrt(xp / 25)) + 1;
}
exports.updateStats = functions.https.onCall(async (request) => {
    const { userId, gameResult } = request.data;
    // Validation
    if (!userId || !gameResult) {
        throw new functions.https.HttpsError('invalid-argument', 'userId and gameResult are required');
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
                totalTokensEarned: admin.firestore.FieldValue.increment(gameResult.tokensEarned),
                lastLogin: Date.now(),
            });
            // Mettre à jour les statistiques pour le leaderboard
            transaction.update(statsRef, {
                xp: newXP,
                gamesWon: gameResult.won
                    ? admin.firestore.FieldValue.increment(1)
                    : userData.gamesWon || 0,
                totalTokensEarned: admin.firestore.FieldValue.increment(gameResult.tokensEarned),
                weeklyXP: admin.firestore.FieldValue.increment(gameResult.xpEarned),
                monthlyXP: admin.firestore.FieldValue.increment(gameResult.xpEarned),
                lastUpdated: Date.now(),
            });
        });
        functions.logger.info(`Stats updated for user ${userId}: +${gameResult.xpEarned} XP, +${gameResult.tokensEarned} tokens`);
        // Vérifier si l'utilisateur a changé de rang
        const updatedUser = await userRef.get();
        const updatedData = updatedUser.data();
        return {
            success: true,
            newXP: updatedData === null || updatedData === void 0 ? void 0 : updatedData.xp,
            newLevel: updatedData === null || updatedData === void 0 ? void 0 : updatedData.level,
            newRank: updatedData === null || updatedData === void 0 ? void 0 : updatedData.rank,
            rankUp: (updatedData === null || updatedData === void 0 ? void 0 : updatedData.rank) !== getRankFromXP((updatedData === null || updatedData === void 0 ? void 0 : updatedData.xp) - gameResult.xpEarned),
        };
    }
    catch (error) {
        functions.logger.error(`Failed to update stats for user: ${userId}`, error);
        throw new functions.https.HttpsError('internal', 'Failed to update stats');
    }
});
//# sourceMappingURL=updateStats.js.map