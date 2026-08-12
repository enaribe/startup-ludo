/**
 * Sponsor Metrics Service — comptage des métriques des cartes SPONSOR.
 *
 * POURQUOI : le sponsoring d'édition devient PAYANT, facturé au volume de vues.
 * Le back-office sponsor a donc besoin de trois compteurs par carte (preuve de
 * valeur + base de facturation) :
 *   - `views`  : la carte sponsor s'est réellement affichée au joueur en partie
 *   - `saves`  : le joueur a appuyé sur « Sauvegarder » (carte avec lien)
 *   - `clicks` : le joueur a ouvert le lien externe depuis son profil
 * Plus une métrique d'édition : `totals.editionPopupViews` (impression du popup
 * affiché au choix d'une édition sponsorisée).
 *
 * Doc Firestore : sponsorMetrics/{editionId}
 * {
 *   editionId: string,
 *   totals: { views: number, saves: number, clicks: number, editionPopupViews: number },
 *   cards: { [cardId]: { views: number, saves: number, clicks: number, lastSeenAt: number } },
 *   updatedAt: number
 * }
 * Un doc par ÉDITION (et non par carte) : une édition sponsorisée compte au plus
 * quelques dizaines de cartes, le doc reste très en-dessous de la limite de 1 Mo
 * et l'admin lit tout le rapport d'un sponsor en UNE lecture.
 *
 * ═══ RÈGLES DE ROBUSTESSE (impératives) ═══
 * Ces appels ne doivent JAMAIS casser ni ralentir le jeu :
 *   1. Aucune fonction de tracking n'est `await`-ée par l'UI : elles retournent
 *      `void` et avalent leur propre erreur via `.catch()` silencieux
 *      (log `__DEV__` uniquement). Impossible de faire remonter un rejet non géré.
 *   2. No-op si l'utilisateur n'est pas authentifié ou est invité : les règles
 *      Firestore exigent un compte authentifié, un invité produirait un
 *      `permission-denied` à chaque carte. On préfère ne pas compter plutôt que
 *      de polluer les logs (et la facturation) avec des écritures rejetées.
 *   3. HORS LIGNE — choix documenté : on N'annule PAS l'écriture. Le SDK Firestore
 *      natif met le `set(merge)` dans sa file d'attente locale et le rejoue à la
 *      reconnexion ; `FieldValue.increment` est commutatif, donc rejouer N
 *      incréments en retard donne exactement le même total. Une partie jouée dans
 *      le métro est ainsi facturée correctement. La promesse retournée par `set()`
 *      ne se résout qu'à l'acquittement serveur : on ne l'attend jamais (règle 1),
 *      sinon un joueur hors ligne bloquerait un `await` pendant toute la partie.
 */
import {
  doc,
  getDoc,
  getFirestore,
  increment,
  onSnapshot,
  setDoc,
} from '@react-native-firebase/firestore';

// Import DIRECT du store (et non du barrel `@/stores`) : le barrel réexporte
// useGameStore → EventManager → ce service, ce qui créerait un cycle et pourrait
// laisser `useAuthStore` indéfini au moment de l'initialisation des modules.
import { useAuthStore } from '@/stores/useAuthStore';
import { FIRESTORE_COLLECTIONS } from './config';

/** Métriques d'une carte sponsor individuelle. */
export interface SponsorCardMetrics {
  views: number;
  saves: number;
  clicks: number;
  /** Timestamp (ms) du dernier affichage de la carte — « vue pour la dernière fois ». */
  lastSeenAt: number;
}

/** Totaux agrégés d'une édition sponsorisée. */
export interface SponsorMetricsTotals {
  views: number;
  saves: number;
  clicks: number;
  /** Impressions du popup affiché au choix de l'édition sponsorisée. */
  editionPopupViews: number;
}

/** Document sponsorMetrics/{editionId} tel que lu par l'admin. */
export interface SponsorMetricsDocument {
  editionId: string;
  totals: SponsorMetricsTotals;
  cards: Record<string, SponsorCardMetrics>;
  updatedAt: number;
}

type SponsorMetricKind = 'views' | 'saves' | 'clicks';

/** Log de diagnostic réservé au dev (aucun bruit en production). */
function metricsLog(message: string, data?: unknown): void {
  if (__DEV__) console.log(`[SponsorMetrics] ${message}`, data ?? '');
}

/**
 * Vrai si l'utilisateur courant peut écrire des métriques.
 * Un invité (pas de compte Firebase) serait refusé par les règles Firestore :
 * on ne tente même pas l'écriture.
 */
function canTrack(): boolean {
  try {
    const user = useAuthStore.getState().user;
    return !!user && !user.isGuest;
  } catch {
    // Store pas encore initialisé (ordre de résolution des modules) : on
    // s'abstient plutôt que de risquer une exception dans la boucle de jeu.
    return false;
  }
}

/**
 * Incrémente un compteur de carte + le total d'édition, en une seule écriture.
 * `set(..., { merge: true })` crée le document à la volée au tout premier
 * événement : aucune initialisation côté admin n'est nécessaire.
 * Ne retourne rien et n'échoue jamais visiblement (cf. règles de robustesse).
 */
function trackCardMetric(editionId: string, cardId: string, kind: SponsorMetricKind): void {
  if (!editionId || !cardId || !canTrack()) return;

  const now = Date.now();
  setDoc(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorMetrics, editionId),
    {
      editionId,
      totals: { [kind]: increment(1) },
      cards: {
        [cardId]: {
          [kind]: increment(1),
          // Rafraîchi à chaque événement : dernière activité constatée sur la carte.
          lastSeenAt: now,
        },
      },
      updatedAt: now,
    },
    { merge: true }
  ).catch((error: unknown) => {
    // Hors ligne, règles non déployées, quota… : jamais bloquant pour le jeu.
    metricsLog(`Échec de l'incrément ${kind} (${editionId}/${cardId})`, error);
  });

  metricsLog(`${kind} +1`, { editionId, cardId });
}

/** Une carte sponsor s'est affichée au joueur pendant une partie. */
export function trackSponsorCardView(editionId: string, cardId: string): void {
  trackCardMetric(editionId, cardId, 'views');
}

/** Le joueur a sauvegardé la carte sponsor (bouton « Sauvegarder »). */
export function trackSponsorCardSave(editionId: string, cardId: string): void {
  trackCardMetric(editionId, cardId, 'saves');
}

/** Le joueur a ouvert le lien externe de la carte (depuis son profil). */
export function trackSponsorCardClick(editionId: string, cardId: string): void {
  trackCardMetric(editionId, cardId, 'clicks');
}

/**
 * Impression du popup « édition sponsorisée » (au choix de l'édition).
 * Comptée à part dans `totals.editionPopupViews` : c'est une exposition de la
 * MARQUE (visuel + logo plein cadre), pas l'affichage d'une carte facturée —
 * les deux ne doivent pas se mélanger dans le volume de vues acheté.
 */
export function trackSponsoredEditionView(editionId: string): void {
  if (!editionId || !canTrack()) return;

  const now = Date.now();
  setDoc(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorMetrics, editionId),
    {
      editionId,
      totals: { editionPopupViews: increment(1) },
      updatedAt: now,
    },
    { merge: true }
  ).catch((error: unknown) => {
    metricsLog(`Échec de l'incrément editionPopupViews (${editionId})`, error);
  });

  metricsLog('editionPopupViews +1', { editionId });
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAFOND DE DIFFUSION (budget de vues acheté par le sponsor)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cache mémoire du total de vues par édition, alimenté par `watchSponsorViews`.
 * POURQUOI un cache : `EventManager.pickSponsorCard()` est appelé de façon
 * synchrone à chaque case opportunité/financement et ne peut pas attendre une
 * lecture réseau. On maintient donc un total « à jour au mieux » en mémoire, lu
 * en O(1) au tirage.
 */
const viewsCache = new Map<string, number>();

/** Abonnements actifs (un par édition) — évite d'empiler les listeners. */
const viewsUnsubscribes = new Map<string, () => void>();

/**
 * Total de vues connu localement pour une édition (0 si jamais chargé).
 * Lecture synchrone, sans réseau : utilisable dans la boucle de jeu.
 */
export function getCachedSponsorViews(editionId: string): number {
  return viewsCache.get(editionId) ?? 0;
}

/**
 * Ouvre (ou réutilise) un abonnement léger sur `sponsorMetrics/{editionId}` pour
 * garder `viewsCache` à jour pendant la partie. À appeler au chargement de
 * l'édition / au démarrage d'une partie.
 *
 * COMPROMIS ASSUMÉ — pourquoi un `onSnapshot` et pas une lecture unique :
 *   - un `getDoc` unique fige le total au démarrage : une longue partie pourrait
 *     dépasser le plafond de plusieurs dizaines de vues avant la partie suivante ;
 *   - `onSnapshot` sur UN document est très peu coûteux (1 lecture facturée à
 *     l'ouverture, puis une par mise à jour) et reflète aussi les vues des AUTRES
 *     joueurs, donc le plafond est respecté à l'échelle de toute la base.
 * LIMITE CONNUE : le plafond reste « au mieux ». Firestore ne pouvant pas
 * refuser un incrément au-delà d'un seuil, un léger dépassement est possible
 * (parties simultanées, latence de propagation, clients hors ligne qui rejouent
 * leur file). C'est acceptable : mieux vaut quelques vues offertes qu'un jeu
 * bloqué en attente du réseau.
 */
export function watchSponsorViews(editionId: string): void {
  if (!editionId || viewsUnsubscribes.has(editionId)) return;

  const unsubscribe = onSnapshot(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorMetrics, editionId),
    (snapshot) => {
      const totals = snapshot?.data()?.['totals'] as Partial<SponsorMetricsTotals> | undefined;
      const views = typeof totals?.views === 'number' ? totals.views : 0;
      viewsCache.set(editionId, views);
      metricsLog(`Total de vues de "${editionId}" : ${views}`);
    },
    (error) => {
      // Doc absent, offline ou règles : on garde la dernière valeur connue
      // (0 par défaut) → la diffusion continue plutôt que de s'arrêter à tort.
      metricsLog(`Abonnement aux vues de "${editionId}" en échec`, error);
    }
  );

  viewsUnsubscribes.set(editionId, unsubscribe);
}

/** Ferme l'abonnement d'une édition (ou de toutes si `editionId` est omis). */
export function unwatchSponsorViews(editionId?: string): void {
  if (editionId) {
    viewsUnsubscribes.get(editionId)?.();
    viewsUnsubscribes.delete(editionId);
    return;
  }
  viewsUnsubscribes.forEach((unsubscribe) => unsubscribe());
  viewsUnsubscribes.clear();
}

/**
 * Lecture ponctuelle du document de métriques (back-office / diagnostic).
 * Retourne `null` si le document n'existe pas encore ou si la lecture échoue.
 */
export async function fetchSponsorMetrics(
  editionId: string
): Promise<SponsorMetricsDocument | null> {
  try {
    const snapshot = await getDoc(
      doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorMetrics, editionId)
    );
    const data = snapshot.data();
    if (!data) return null;

    const totals = (data['totals'] ?? {}) as Partial<SponsorMetricsTotals>;
    return {
      editionId,
      totals: {
        views: totals.views ?? 0,
        saves: totals.saves ?? 0,
        clicks: totals.clicks ?? 0,
        editionPopupViews: totals.editionPopupViews ?? 0,
      },
      cards: (data['cards'] ?? {}) as Record<string, SponsorCardMetrics>,
      updatedAt: (data['updatedAt'] as number | undefined) ?? 0,
    };
  } catch (error) {
    metricsLog(`Lecture des métriques de "${editionId}" en échec`, error);
    return null;
  }
}
