/**
 * Edition Service - Éditions depuis Firestore
 * MIGRATED TO @react-native-firebase/firestore
 *
 * Le chargement passe par un listener temps réel (onSnapshot) et non un
 * getDocs one-shot : le SDK natif gère les retries et la reconnexion réseau,
 * donc un démarrage sans réseau n'est plus fatal (la liste arrive dès que la
 * connexion revient), et les modifs admin arrivent sans redémarrer l'app.
 */

import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { FIRESTORE_COLLECTIONS, firebaseLog } from './config';
import type { Edition, EditionId } from '@/data/types';

let cachedEditions: Record<EditionId, Edition> | null = null;
type QDocSnap = FirebaseFirestoreTypes.QueryDocumentSnapshot;

/** Mapping défensif d'un doc Firestore vers Edition (jamais de throw). */
function mapEditionDoc(doc: QDocSnap): Edition {
  const data = doc.data();
  return {
    id: doc.id as EditionId,
    name: data.name || '',
    description: data.description || '',
    icon: data.icon || 'game-controller-outline',
    color: data.color || '#FFBC40',
    sectors: data.sectors || [],
    quizzes: data.quizzes || [],
    duels: data.duels || [],
    fundings: data.fundings || [],
    opportunities: data.opportunities || [],
    challenges: data.challenges || [],
    startupIdeas: data.startupIdeas || [],
    defaultProjects: data.defaultProjects || [],
    translations: data.translations || {},
    sponsor: data.sponsor || null,
  } as Edition;
}

function logEditionsDetails(editions: Record<string, Edition>): void {
  if (!__DEV__) return;
  for (const [id, ed] of Object.entries(editions)) {
    firebaseLog(`Edition ${id}: ${ed.defaultProjects?.length || 0} defaultProjects, ${ed.sectors?.length || 0} sectors`);
    // Diagnostic sponsor : vérifie que les cartes opportunité/financement
    // sponsor sont bien chargées (et complètes : texte, logo, lien).
    const sponsor = ed.sponsor;
    if (sponsor?.enabled) {
      const summarize = (cards?: { text?: string; logoUrl?: string; linkUrl?: string }[]) => {
        const list = cards ?? [];
        const valid = list.filter((c) => c.text);
        const withLogo = valid.filter((c) => c.logoUrl).length;
        const withLink = valid.filter((c) => c.linkUrl).length;
        return `${valid.length} valide(s) sur ${list.length} (${withLogo} avec logo, ${withLink} avec lien)`;
      };
      console.log(
        `[Sponsor] Édition "${id}" sponsorisée par "${sponsor.name}" ` +
          `(logo: ${sponsor.logoUrl ? 'oui' : 'non'}, description: ${sponsor.description ? `${sponsor.description.length} car.` : 'non'}) — ` +
          `opportunités: ${summarize(sponsor.opportunities)} | financements: ${summarize(sponsor.fundings)}`
      );
    } else {
      console.log(`[Sponsor] Édition "${id}" : non sponsorisée`);
    }
  }
}

/**
 * Écoute temps réel de la collection editions. Retourne l'unsubscribe.
 * - Le premier snapshot peut venir du cache disque natif (offline) : c'est
 *   voulu, la donnée de la dernière session s'affiche immédiatement.
 * - Les erreurs réseau ne passent PAS par onError (le SDK retry tout seul) ;
 *   onError ne reçoit que les erreurs fatales (ex. permission-denied).
 */
export function subscribeToEditionsFromFirestore(
  onData: (editions: Record<EditionId, Edition>) => void,
  onError?: (error: unknown) => void
): () => void {
  return onSnapshot(
    collection(getFirestore(), FIRESTORE_COLLECTIONS.editions),
    (snapshot) => {
      const editions: Record<string, Edition> = {};
      snapshot.docs.forEach((doc: QDocSnap) => {
        editions[doc.id] = mapEditionDoc(doc);
      });
      cachedEditions = editions as Record<EditionId, Edition>;
      logEditionsDetails(editions);
      firebaseLog(
        `Editions snapshot: ${snapshot.docs.length} éditions (source: ${snapshot.metadata.fromCache ? 'cache natif' : 'serveur'})`
      );
      onData(cachedEditions);
    },
    (error) => {
      firebaseLog('Editions listener error', error);
      console.warn('[Data] Editions listener error:', error);
      onError?.(error);
    }
  );
}

/**
 * Fetch one-shot de toutes les éditions (conservé pour compat / usages ponctuels).
 */
export async function fetchEditionsFromFirestore(): Promise<Record<EditionId, Edition>> {
  try {
    const snapshot = await getDocs(collection(getFirestore(), FIRESTORE_COLLECTIONS.editions));

    const editions: Record<string, Edition> = {};
    snapshot.docs.forEach((doc: QDocSnap) => {
      editions[doc.id] = mapEditionDoc(doc);
    });

    cachedEditions = editions as Record<EditionId, Edition>;
    logEditionsDetails(editions);
    firebaseLog(`Fetched ${snapshot.docs.length} editions from Firestore`);
    return cachedEditions;
  } catch (error) {
    firebaseLog('Failed to fetch editions from Firestore', error);
    throw error;
  }
}

/**
 * Get cached editions (if previously fetched).
 */
export function getCachedEditions(): Record<EditionId, Edition> | null {
  return cachedEditions;
}
