/**
 * Username Service — gestion des pseudos uniques.
 *
 * Chaque pseudo est réservé dans la collection `usernames`, dont l'ID du
 * document est le pseudo en minuscules. L'unicité de l'ID de document
 * garantit qu'aucun pseudo ne peut être pris deux fois.
 */
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  limit,
  runTransaction,
} from '@react-native-firebase/firestore';

import { firebaseLog } from './config';
import { updateFirestoreUserProfile } from './firestore';

const COLLECTION = 'usernames';

/** Longueur min / max d'un pseudo. */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/** Caractères autorisés : lettres, chiffres, underscore. */
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export type UsernameValidationError =
  | 'too_short'
  | 'too_long'
  | 'invalid_chars';

/**
 * Valide le format d'un pseudo (sans vérifier la disponibilité).
 * Retourne null si valide, sinon le code d'erreur.
 */
export function validateUsernameFormat(raw: string): UsernameValidationError | null {
  const trimmed = raw.trim();
  if (trimmed.length < USERNAME_MIN_LENGTH) return 'too_short';
  if (trimmed.length > USERNAME_MAX_LENGTH) return 'too_long';
  if (!USERNAME_REGEX.test(trimmed)) return 'invalid_chars';
  return null;
}

/** Message d'erreur lisible pour un code de validation. */
export function getUsernameErrorMessage(code: UsernameValidationError): string {
  switch (code) {
    case 'too_short':
      return `Le pseudo doit faire au moins ${USERNAME_MIN_LENGTH} caractères.`;
    case 'too_long':
      return `Le pseudo ne peut pas dépasser ${USERNAME_MAX_LENGTH} caractères.`;
    case 'invalid_chars':
      return 'Le pseudo ne peut contenir que des lettres, chiffres et _.';
    default:
      return 'Pseudo invalide.';
  }
}

/** Clé de document : pseudo normalisé en minuscules. */
function usernameKey(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Vérifie si un pseudo est disponible (non réservé).
 * Le pseudo doit déjà être valide en format.
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const key = usernameKey(username);
    if (!key) return false;
    const snap = await getDoc(doc(getFirestore(), COLLECTION, key));
    return !snap.exists();
  } catch (error) {
    firebaseLog('isUsernameAvailable error', error);
    // En cas d'erreur réseau, considérer indisponible pour ne pas réserver à tort
    return false;
  }
};

/**
 * Réserve un pseudo pour un utilisateur. Échoue si le pseudo est déjà pris.
 * Si l'utilisateur avait déjà un ancien pseudo, le passer en `previousUsername`
 * pour le libérer dans la même opération.
 */
export const reserveUsername = async (
  username: string,
  userId: string,
  displayName: string,
  previousUsername?: string | null
): Promise<void> => {
  const db = getFirestore();
  const key = usernameKey(username);
  const prevKey = previousUsername ? usernameKey(previousUsername) : null;

  await runTransaction(db, async (tx) => {
    const newRef = doc(db, COLLECTION, key);
    const existing = await tx.get(newRef);

    // Le pseudo est déjà pris par quelqu'un d'autre
    if (existing.exists()) {
      const data = existing.data();
      if (data?.userId !== userId) {
        throw new Error('Ce pseudo est déjà utilisé.');
      }
      // Déjà à moi : rien à faire
      return;
    }

    // Libère l'ancien pseudo s'il existe et m'appartient
    if (prevKey && prevKey !== key) {
      const prevRef = doc(db, COLLECTION, prevKey);
      const prevSnap = await tx.get(prevRef);
      if (prevSnap.exists() && prevSnap.data()?.userId === userId) {
        tx.delete(prevRef);
      }
    }

    tx.set(newRef, {
      userId,
      displayName,
      // Champ indexable pour la recherche par préfixe insensible à la casse
      usernameLower: key,
      createdAt: Date.now(),
    });
  });

  firebaseLog('reserveUsername success', { username: key, userId });
};

/** Libère un pseudo (ex: suppression de compte). */
export const releaseUsername = async (username: string): Promise<void> => {
  try {
    const key = usernameKey(username);
    if (!key) return;
    await deleteDoc(doc(getFirestore(), COLLECTION, key));
  } catch (error) {
    firebaseLog('releaseUsername error', error);
  }
};

/**
 * Retourne le userId associé à un pseudo, ou null si le pseudo est libre.
 * Utile pour la recherche de joueur par pseudo exact.
 */
export const getUserIdByUsername = async (username: string): Promise<string | null> => {
  try {
    const key = usernameKey(username);
    if (!key) return null;
    const snap = await getDoc(doc(getFirestore(), COLLECTION, key));
    return snap.exists() ? (snap.data()?.userId as string) ?? null : null;
  } catch (error) {
    firebaseLog('getUserIdByUsername error', error);
    return null;
  }
};

/**
 * Retourne le pseudo déjà réservé par un utilisateur, ou null s'il n'en a pas.
 */
export const getUsernameForUser = async (userId: string): Promise<string | null> => {
  try {
    const q = query(
      collection(getFirestore(), COLLECTION),
      where('userId', '==', userId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return (snap.docs[0]?.data()?.displayName as string) ?? null;
  } catch (error) {
    firebaseLog('getUsernameForUser error', error);
    return null;
  }
};

/**
 * Transforme un displayName libre en un pseudo candidat valide :
 * minuscules, espaces et caractères interdits → underscore, tronqué.
 */
function normalizeToCandidate(displayName: string): string {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, USERNAME_MAX_LENGTH);
}

interface EnsureUsernameResult {
  /** True si l'utilisateur a (déjà ou désormais) un pseudo unique réservé. */
  hasUsername: boolean;
  /** Le pseudo réservé, si la migration a réussi. */
  username: string | null;
  /** True s'il faut envoyer l'utilisateur sur l'écran de choix de pseudo. */
  needsManualChoice: boolean;
}

/**
 * Pour un compte existant sans pseudo réservé : tente de migrer automatiquement
 * son displayName actuel en pseudo unique. Si le pseudo est déjà pris ou invalide,
 * l'utilisateur devra en choisir un manuellement.
 */
export const ensureUsernameForUser = async (
  userId: string,
  displayName: string
): Promise<EnsureUsernameResult> => {
  // Déjà un pseudo réservé → rien à faire
  const existing = await getUsernameForUser(userId);
  if (existing) {
    return { hasUsername: true, username: existing, needsManualChoice: false };
  }

  // Tenter une migration auto à partir du displayName
  const candidate = normalizeToCandidate(displayName || '');

  // Candidat trop court ou invalide → choix manuel obligatoire
  if (validateUsernameFormat(candidate) !== null) {
    return { hasUsername: false, username: null, needsManualChoice: true };
  }

  try {
    await reserveUsername(candidate, userId, candidate);
    // Propage le nouveau pseudo dans users + userStats (classement, recherche)
    try {
      await updateFirestoreUserProfile(userId, { displayName: candidate });
    } catch (err) {
      firebaseLog('ensureUsernameForUser: profile sync failed', err);
    }
    firebaseLog('ensureUsernameForUser: migrated', { userId, candidate });
    return { hasUsername: true, username: candidate, needsManualChoice: false };
  } catch {
    // Pseudo déjà pris par quelqu'un d'autre → choix manuel
    return { hasUsername: false, username: null, needsManualChoice: true };
  }
};
