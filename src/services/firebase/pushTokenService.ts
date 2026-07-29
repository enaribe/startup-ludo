/**
 * Push Token Service — enregistre le token FCM du device dans Firestore
 * (`pushTokens/{userId}`) pour les notifications DIRECTES envoyées par nos
 * Cloud Functions via FCM pur (invitation de partie, etc.).
 *
 * Customer.io n'est PAS utilisé pour ces notifications directes : il reste
 * réservé aux campagnes marketing (onboarding, réactivation, broadcasts).
 * Le token est simplement lu depuis le SDK (qui le récupère auprès de FCM).
 *
 * Doc Firestore : { userId, tokens: { [token]: { platform, updatedAt } } }
 * → plusieurs devices par joueur, nettoyage des tokens invalides côté function.
 */
import { deleteField, doc, getFirestore, setDoc, updateDoc } from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

import {
  getPushPermissionStatus,
  getRegisteredPushToken,
} from '@/services/analytics';
import { FIRESTORE_COLLECTIONS, firebaseLog } from './config';

/** Le token peut mettre quelques secondes à être enregistré après la permission. */
const TOKEN_RETRY_DELAYS_MS = [0, 2000, 8000];

async function fetchTokenWithRetry(): Promise<string | null> {
  for (const delay of TOKEN_RETRY_DELAYS_MS) {
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    const token = await getRegisteredPushToken();
    if (token) return token;
  }
  return null;
}

/**
 * Enregistre le token du device pour ce joueur. À appeler après l'acceptation
 * de la permission, et à chaque login si la permission est déjà accordée
 * (rafraîchissement du token). Fire-and-forget : ne throw jamais.
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    const status = await getPushPermissionStatus();
    if (status !== 'GRANTED') return;

    const token = await fetchTokenWithRetry();
    if (!token) return;

    await setDoc(
      doc(getFirestore(), FIRESTORE_COLLECTIONS.pushTokens, userId),
      {
        userId,
        tokens: {
          [token]: { platform: Platform.OS, updatedAt: Date.now() },
        },
      },
      { merge: true }
    );
    firebaseLog('Push token registered', { userId });
  } catch (error) {
    firebaseLog('Failed to register push token', error);
  }
}

/**
 * Retire le token de CE device pour ce joueur (déconnexion) : le prochain
 * utilisateur du téléphone ne recevra pas les notifications du compte précédent.
 * À appeler AVANT le signOut Firebase (l'écriture nécessite l'auth).
 */
export async function unregisterPushToken(userId: string): Promise<void> {
  try {
    const token = await getRegisteredPushToken();
    if (!token) return;
    await updateDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.pushTokens, userId), {
      [`tokens.${token}`]: deleteField(),
    });
    firebaseLog('Push token unregistered', { userId });
  } catch (error) {
    // Doc absent ou offline : non bloquant
    firebaseLog('Failed to unregister push token', error);
  }
}
