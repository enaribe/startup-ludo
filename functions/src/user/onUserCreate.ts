/**
 * onUserCreate - Cloud Function trigger lors de la création d'un utilisateur
 *
 * Crée automatiquement un profil utilisateur dans Firestore
 * lorsqu'un nouvel utilisateur s'inscrit via Firebase Auth.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  rank: string;
  gamesPlayed: number;
  gamesWon: number;
  totalTokensEarned: number;
  startups: never[];
  achievements: never[];
  createdAt: number;
  lastLogin: number;
  isGuest: boolean;
}

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  functions.logger.info(`New user created: ${uid}`);

  // Créer le profil initial
  const userProfile: UserProfile = {
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
  } catch (error) {
    functions.logger.error(`Failed to create profile for user: ${uid}`, error);
    throw new functions.https.HttpsError('internal', 'Failed to create user profile');
  }
});
