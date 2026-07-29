"use strict";
/**
 * onUserCreate - Cloud Function trigger lors de la création d'un utilisateur
 *
 * Crée automatiquement un profil utilisateur dans Firestore
 * lorsqu'un nouvel utilisateur s'inscrit via Firebase Auth.
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
exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    functions.logger.info(`New user created: ${uid}`);
    // Créer le profil initial
    const userProfile = {
        id: uid,
        email: email || '',
        displayName: displayName || `Joueur_${uid.substring(0, 6)}`,
        avatarUrl: photoURL || null,
        xp: 0,
        level: 1,
        rank: 'intern', // Stagiaire
        gamesPlayed: 0,
        gamesWon: 0,
        totalTokensEarned: 0,
        startups: [],
        achievements: [],
        createdAt: Date.now(),
        lastLogin: Date.now(),
        isGuest: !email, // Si pas d'email, c'est un compte invité
    };
    // Sauvegarder dans Firestore
    const firestore = admin.firestore();
    try {
        await firestore.collection('users').doc(uid).set(userProfile);
        functions.logger.info(`Profile created for user: ${uid}`);
        // Initialiser les statistiques dans un document séparé pour les requêtes de leaderboard
        await firestore.collection('userStats').doc(uid).set({
            id: uid,
            displayName: userProfile.displayName,
            xp: 0,
            gamesWon: 0,
            totalTokensEarned: 0,
            weeklyXP: 0,
            monthlyXP: 0,
            lastUpdated: Date.now(),
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error(`Failed to create profile for user: ${uid}`, error);
        throw new functions.https.HttpsError('internal', 'Failed to create user profile');
    }
});
//# sourceMappingURL=onUserCreate.js.map