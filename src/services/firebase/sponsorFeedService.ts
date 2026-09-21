/**
 * Sponsor Feed Service — cache du feed des campagnes annonceurs (lot 4).
 *
 * Le mobile ne lit JAMAIS la collection `campaigns` : le back-office publie
 * dans `sponsorFeed/cards` une projection compacte des seules campagnes carte
 * ACTIVES (validées par la modération CONCREE). Ce module maintient un cache
 * mémoire de ce document, car `EventManager.pickSponsorCard()` est appelé de
 * façon SYNCHRONE dans la boucle de jeu — il ne peut attendre aucun réseau.
 *
 * Contrat du document (écrit par startup-ludo-admin/src/lib/sponsor-feed.ts) :
 * { cards: FeedCard[], updatedAt } — lecture publique, écriture serveur seule.
 *
 * HORS-LIGNE : le SDK Firestore sert la dernière version connue du document ;
 * un joueur dans le métro tire donc les cartes du dernier feed vu. C'est le
 * comportement voulu — mieux vaut diffuser une campagne active d'hier que rien.
 */

import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { FIRESTORE_COLLECTIONS } from './config';

/** Une carte du feed — miroir du FeedCard côté admin. */
export interface FeedCard {
  /** = id de campagne : clé des métriques (`sponsorMetrics/{id}`). */
  id: string;
  kind: 'financement' | 'opportunite' | 'evenement';
  tokens: number;
  text: string;
  structure: string;
  logoUrl: string | null;
  ctaUrl: string | null;
  ctaLabel: string | null;
  verso: {
    description: string;
    avantage: string | null;
    criteres: string | null;
    dateLimite: string | null;
  } | null;
  targeting: { sectors: string[]; regions: string[] };
  viewsGoal: number;
  perView: number;
  startAt: number | null;
  endAt: number | null;
}

let feedCache: FeedCard[] = [];
let unsubscribe: (() => void) | null = null;

function feedLog(message: string, data?: unknown): void {
  if (__DEV__) console.log(`[SponsorFeed] ${message}`, data ?? '');
}

/** Coercition défensive d'une carte brute du feed. */
function normaliser(brut: unknown): FeedCard | null {
  if (!brut || typeof brut !== 'object') return null;
  const c = brut as Record<string, unknown>;
  const id = typeof c.id === 'string' ? c.id : '';
  const text = typeof c.text === 'string' ? c.text : '';
  const kind = c.kind === 'financement' || c.kind === 'opportunite' || c.kind === 'evenement'
    ? c.kind
    : null;
  if (!id || !text || !kind) return null;

  const targeting = (c.targeting ?? {}) as Record<string, unknown>;
  const verso = (c.verso ?? null) as Record<string, unknown> | null;
  return {
    id,
    kind,
    tokens: typeof c.tokens === 'number' ? c.tokens : 2,
    text,
    structure: typeof c.structure === 'string' ? c.structure : '',
    logoUrl: typeof c.logoUrl === 'string' ? c.logoUrl : null,
    ctaUrl: typeof c.ctaUrl === 'string' ? c.ctaUrl : null,
    ctaLabel: typeof c.ctaLabel === 'string' ? c.ctaLabel : null,
    verso:
      verso && typeof verso.description === 'string'
        ? {
            description: verso.description,
            avantage: typeof verso.avantage === 'string' ? verso.avantage : null,
            criteres: typeof verso.criteres === 'string' ? verso.criteres : null,
            dateLimite: typeof verso.dateLimite === 'string' ? verso.dateLimite : null,
          }
        : null,
    targeting: {
      sectors: Array.isArray(targeting.sectors) ? targeting.sectors.filter((s): s is string => typeof s === 'string') : [],
      regions: Array.isArray(targeting.regions) ? targeting.regions.filter((r): r is string => typeof r === 'string') : [],
    },
    viewsGoal: typeof c.viewsGoal === 'number' ? c.viewsGoal : 0,
    perView: typeof c.perView === 'number' ? c.perView : 15,
    startAt: typeof c.startAt === 'number' ? c.startAt : null,
    endAt: typeof c.endAt === 'number' ? c.endAt : null,
  };
}

/**
 * Ouvre (une seule fois) l'écoute du feed. À appeler au démarrage d'une
 * partie — même patron que `watchSponsorViews` : un seul listener, un
 * document, coût marginal, et le plafond des campagnes reste juste pendant
 * une longue partie.
 */
export function watchSponsorFeed(): void {
  if (unsubscribe) return;
  unsubscribe = onSnapshot(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorFeed, 'cards'),
    (snap) => {
      const brutes = (snap.data()?.cards ?? []) as unknown[];
      feedCache = brutes.map(normaliser).filter((c): c is FeedCard => c !== null);
      feedLog(`Feed mis à jour : ${feedCache.length} carte(s) active(s)`);
    },
    (error) => {
      // Réseau, règles… : le cache garde sa dernière valeur, le jeu continue.
      feedLog('Écoute du feed en échec (cache conservé)', error);
    }
  );
}

/** Cartes actives connues localement — lecture synchrone pour la boucle de jeu. */
export function getCachedFeedCards(): FeedCard[] {
  return feedCache;
}
