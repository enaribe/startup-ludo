/**
 * Saved Opportunity Service — opportunités/financements SPONSOR sauvegardés
 * par le joueur pendant une partie (bouton « Sauvegarder » du SponsorEventPopup).
 *
 * Doc Firestore : savedOpportunities/{userId} = { userId, items: { [cardId]: SavedSponsorOpportunity } }
 * → map clé par id de carte : sauvegarde idempotente (pas de doublon si la même
 * carte ressort dans une autre partie), suppression via deleteField.
 * Le joueur les retrouve dans son Profil ; un clic ouvre linkUrl en externe.
 */
import { deleteField, doc, getFirestore, onSnapshot, setDoc, updateDoc } from '@react-native-firebase/firestore';

import type { SavedSponsorOpportunity } from '@/types';
import { FIRESTORE_COLLECTIONS, firebaseLog } from './config';

/** Sauvegarde une opportunité sponsor (idempotent — re-sauver écrase la même clé). */
export async function saveSponsorOpportunity(
  userId: string,
  item: SavedSponsorOpportunity
): Promise<void> {
  await setDoc(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.savedOpportunities, userId),
    {
      userId,
      items: { [item.id]: item },
    },
    { merge: true }
  );
  firebaseLog('Sponsor opportunity saved', { userId, cardId: item.id });
}

/** Retire une opportunité sauvegardée (depuis le profil). */
export async function removeSavedOpportunity(userId: string, cardId: string): Promise<void> {
  try {
    await updateDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.savedOpportunities, userId), {
      [`items.${cardId}`]: deleteField(),
    });
    firebaseLog('Saved opportunity removed', { userId, cardId });
  } catch (error) {
    // Doc absent ou offline : non bloquant
    firebaseLog('Failed to remove saved opportunity', error);
  }
}

/**
 * Écoute temps réel des opportunités sauvegardées du joueur,
 * triées de la plus récente à la plus ancienne. Retourne l'unsubscribe.
 */
export function subscribeToSavedOpportunities(
  userId: string,
  callback: (items: SavedSponsorOpportunity[]) => void
): () => void {
  return onSnapshot(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.savedOpportunities, userId),
    (snapshot) => {
      const items = (snapshot?.data()?.items ?? {}) as Record<string, SavedSponsorOpportunity>;
      const sorted = Object.values(items).sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
      if (__DEV__) console.log(`[Sponsor] Profil : ${sorted.length} opportunité(s) sauvegardée(s) reçue(s)`);
      callback(sorted);
    },
    (error) => {
      firebaseLog('Failed to subscribe to saved opportunities', error);
      callback([]);
    }
  );
}
