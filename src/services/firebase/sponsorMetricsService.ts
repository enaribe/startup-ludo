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
import { useUserStore } from '@/stores/useUserStore';
import { FIRESTORE_COLLECTIONS } from './config';

/** Métriques d'une carte sponsor individuelle. */
export interface SponsorCardMetrics {
  views: number;
  saves: number;
  clicks: number;
  /** Retournements de la carte (verso consulté) — rempli quand la carte recto/verso existera. */
  flips?: number;
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
  /** Retournements de carte, tous supports confondus (télémétrie v2). */
  flips?: number;
  /** JOUEURS DIFFÉRENTS touchés au moins une fois (≠ vues : 3 vues du même joueur = 1). */
  uniqueViews?: number;
  /** Parties lancées dans l'édition sponsorisée (exposition de la marque). */
  gamesPlayed?: number;
  /** Secondes de jeu cumulées dans l'édition (durée d'exposition). */
  playSeconds?: number;
}

/** Document sponsorMetrics/{editionId} tel que lu par l'admin. */
export interface SponsorMetricsDocument {
  editionId: string;
  totals: SponsorMetricsTotals;
  cards: Record<string, SponsorCardMetrics>;
  updatedAt: number;
}

type SponsorMetricKind = 'views' | 'saves' | 'clicks' | 'flips';

// ═══════════════════════════════════════════════════════════════════════════
// TÉLÉMÉTRIE V2 — Espace Annonceur, lot 1
//
// En plus des totaux : des BUCKETS QUOTIDIENS (courbe « vues et clics par
// jour »), l'ATTRIBUTION secteur/région de chaque vue (répartition « personnes
// touchées »), les PERSONNES UNIQUES (marqueur create-only par joueur) et
// l'exposition d'édition (parties jouées, durée). Chaque événement écrit donc
// DEUX documents — le total et le bucket du jour — chacun en fire-and-forget
// indépendant : un échec sur l'un n'empêche pas l'autre, et les increments
// rejoués hors-ligne restent commutatifs.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Jour local de l'appareil au format AAAA-MM-JJ.
 * Date LOCALE et non UTC : le Sénégal est en GMT donc identiques sur le marché
 * principal, mais un joueur de la diaspora doit compter dans SA journée vécue —
 * `toISOString()` ferait basculer ses soirées sur le lendemain.
 */
function jourLocal(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Normalise un libellé en clé de map Firestore : minuscules, sans accent, sans
 * « . » ni « / » (interdits dans les clés). `non-renseigne` par défaut — compter
 * l'inconnu EXPLICITEMENT vaut mieux qu'un tableau de bord qui gonfle les parts
 * des répondants en silence.
 */
export function cleAttribution(valeur: string | undefined | null): string {
  const brut = (valeur ?? '').trim().toLowerCase();
  if (!brut) return 'non-renseigne';
  const slug = brut
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'non-renseigne';
}

/** Secteur du joueur (premier projet du profil) et région déclarée, en clés sûres. */
function attributionJoueur(): { secteur: string; region: string } {
  try {
    const profile = useUserStore.getState().profile;
    return {
      secteur: cleAttribution(profile?.startups?.[0]?.sector),
      region: cleAttribution(profile?.region),
    };
  } catch {
    return { secteur: 'non-renseigne', region: 'non-renseigne' };
  }
}

/**
 * Écrit le bucket quotidien d'une édition (même patron increment + merge que le
 * total : création à la volée, rejouable hors-ligne).
 */
function ecrireBucketQuotidien(editionId: string, patch: Record<string, unknown>): void {
  const now = Date.now();
  setDoc(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorMetrics, editionId, 'daily', jourLocal(now)),
    { date: jourLocal(now), ...patch, updatedAt: now },
    { merge: true }
  ).catch((error: unknown) => {
    metricsLog(`Échec du bucket quotidien (${editionId})`, error);
  });
}

/**
 * Éditions dont on a déjà tenté le marqueur d'unicité DANS CETTE SESSION —
 * évite une écriture (vouée au refus) à chaque vue suivante.
 */
const uniqueDejaTente = new Set<string>();

/**
 * Compte le joueur comme « personne unique » de l'édition, UNE fois pour toutes.
 *
 * MÉCANISME : `touched/{uid}` est CREATE-ONLY dans les règles Firestore. Le
 * premier passage crée le document et incrémente `uniqueViews` ; tout passage
 * suivant (autre session, réinstallation) tente la création, se fait refuser,
 * et n'incrémente rien. L'unicité est donc garantie par la règle, pas par le
 * client — un cache local ne fait qu'économiser des écritures refusées.
 */
function compterPersonneUnique(editionId: string): void {
  const uid = useAuthStore.getState().user?.id;
  if (!uid || uniqueDejaTente.has(editionId)) return;
  uniqueDejaTente.add(editionId);

  const db = getFirestore();
  const now = Date.now();
  setDoc(doc(db, FIRESTORE_COLLECTIONS.sponsorMetrics, editionId, 'touched', uid), {
    firstSeenAt: now,
  })
    .then(() => {
      // Création acceptée = premier contact de CE joueur avec CETTE édition.
      setDoc(
        doc(db, FIRESTORE_COLLECTIONS.sponsorMetrics, editionId),
        { totals: { uniqueViews: increment(1) }, updatedAt: Date.now() },
        { merge: true }
      ).catch((error: unknown) => metricsLog('Échec increment uniqueViews', error));
      // Le bucket du jour compte les NOUVELLES personnes touchées ce jour-là.
      ecrireBucketQuotidien(editionId, { totals: { uniqueViews: increment(1) } });
    })
    .catch(() => {
      // Refus attendu (déjà compté un autre jour) : silence, même en dev.
    });
}

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

  // L'attribution secteur/région n'est portée QUE par les vues : c'est la seule
  // métrique dont la répartition « personnes touchées » a besoin, et les clics/
  // sauvegardes du même joueur n'apporteraient que du double comptage.
  const attribution =
    kind === 'views'
      ? (() => {
          const { secteur, region } = attributionJoueur();
          return { bySector: { [secteur]: increment(1) }, byRegion: { [region]: increment(1) } };
        })()
      : {};

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
      ...attribution,
      updatedAt: now,
    },
    { merge: true }
  ).catch((error: unknown) => {
    // Hors ligne, règles non déployées, quota… : jamais bloquant pour le jeu.
    metricsLog(`Échec de l'incrément ${kind} (${editionId}/${cardId})`, error);
  });

  // Bucket du jour : mêmes compteurs, pour la courbe « vues et clics par jour ».
  ecrireBucketQuotidien(editionId, {
    totals: { [kind]: increment(1) },
    cards: { [cardId]: { [kind]: increment(1) } },
    ...attribution,
  });

  // Première vue de ce joueur sur cette édition → « personne unique ».
  if (kind === 'views') compterPersonneUnique(editionId);

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
 * Le joueur a RETOURNÉ la carte pour lire le verso (« taux de curiosité »).
 * Exporté dès maintenant pour que le branchement soit trivial quand la carte
 * recto/verso arrivera (lot 4) — d'ici là, le compteur reste simplement à zéro.
 */
export function trackSponsorCardFlip(editionId: string, cardId: string): void {
  trackCardMetric(editionId, cardId, 'flips');
}

/**
 * Une partie DÉMARRE dans une édition sponsorisée — exposition de la marque
 * (« 89 % des affichages débouchent sur une partie » sur le tableau de bord).
 * À appeler UNIQUEMENT hors Mode Classe : une séance scolaire n'est jamais une
 * exposition publicitaire (décision du plan Espace Annonceur, §3).
 */
export function trackSponsoredGameStart(editionId: string): void {
  if (!editionId || !canTrack()) return;
  setDoc(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorMetrics, editionId),
    { editionId, totals: { gamesPlayed: increment(1) }, updatedAt: Date.now() },
    { merge: true }
  ).catch((error: unknown) => metricsLog(`Échec gamesPlayed (${editionId})`, error));
  ecrireBucketQuotidien(editionId, { totals: { gamesPlayed: increment(1) } });
  metricsLog('gamesPlayed +1', { editionId });
}

/**
 * Une partie SE TERMINE dans une édition sponsorisée : cumule la durée de jeu
 * (« durée moyenne d'exposition » = playSeconds / gamesPlayed).
 * La durée est bornée à 4 h : une app restée ouverte toute la nuit ne doit pas
 * offrir 30 000 « secondes d'exposition » à l'annonceur.
 */
export function trackSponsoredGameEnd(editionId: string, seconds: number): void {
  if (!editionId || !canTrack()) return;
  const bornee = Math.max(0, Math.min(4 * 3600, Math.round(seconds)));
  if (bornee === 0) return;
  setDoc(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorMetrics, editionId),
    { editionId, totals: { playSeconds: increment(bornee) }, updatedAt: Date.now() },
    { merge: true }
  ).catch((error: unknown) => metricsLog(`Échec playSeconds (${editionId})`, error));
  ecrireBucketQuotidien(editionId, { totals: { playSeconds: increment(bornee) } });
  metricsLog(`playSeconds +${bornee}`, { editionId });
}

/**
 * Impression du popup « édition sponsorisée » (au choix de l'édition).
 * Comptée à part dans `totals.editionPopupViews` : c'est une exposition de la
 * MARQUE (visuel + logo plein cadre), pas l'affichage d'une carte facturée —
 * les deux ne doivent pas se mélanger dans le volume de vues acheté.
 */
export function trackSponsoredEditionView(editionId: string, campaignId?: string): void {
  // Diagnostic : les deux refus ci-dessous produisaient EXACTEMENT le même
  // silence qu'un appel jamais fait. Impossible de distinguer « le popup ne
  // s'affiche pas » de « il s'affiche mais rien n'est compté » sans les dire.
  if (!editionId) {
    metricsLog('vue d’édition IGNORÉE — aucun editionId transmis au popup');
    return;
  }
  if (!canTrack()) {
    const user = (() => {
      try {
        return useAuthStore.getState().user;
      } catch {
        return null;
      }
    })();
    metricsLog(
      `vue d’édition IGNORÉE (${editionId}) — ` +
        (!user ? 'aucun utilisateur connecté' : 'compte INVITÉ (jamais facturé)')
    );
    return;
  }

  const now = Date.now();
  setDoc(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorMetrics, editionId),
    {
      editionId,
      totals: { editionPopupViews: increment(1) },
      updatedAt: now,
    },
    { merge: true }
  )
    .then(() => metricsLog(`editionPopupViews CONFIRMÉ par le serveur (${editionId})`))
    .catch((error: unknown) => {
      metricsLog(`Échec de l'incrément editionPopupViews (${editionId})`, error);
    });

  // Le bucket du jour, comme pour TOUTE autre métrique : l'admin lit la dépense
  // et les fenêtres « 30 derniers jours » depuis les buckets quotidiens, jamais
  // depuis les totaux cumulés (eux ne savent pas dater). Sans cette ligne,
  // l'habillage d'édition affichait ses vues (lues sur les totaux) mais une
  // dépense de 0 FCFA (calculée sur le quotidien resté vide).
  ecrireBucketQuotidien(editionId, { totals: { editionPopupViews: increment(1) } });

  // La MÊME vue est aussi comptée sous la campagne, quand l'habillage en
  // désigne une. Deux lectures différentes en dépendent :
  //   - `sponsorMetrics/{editionId}` : le plafond `viewsGoal` appliqué en
  //     partie, et l'historique de l'édition tous annonceurs confondus ;
  //   - `sponsorMetrics/{campaignId}` : le tableau de bord de l'annonceur,
  //     qui lit par campagne — sans cette écriture il affiche 0 vue sur une
  //     campagne qui diffuse réellement.
  // Écrire aux deux endroits plutôt que déplacer : l'édition reste la clé du
  // plafond, et les annonceurs qui se succèdent ne se volent pas leurs vues.
  if (campaignId) {
    setDoc(
      doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorMetrics, campaignId),
      { editionId: campaignId, totals: { editionPopupViews: increment(1) }, updatedAt: now },
      { merge: true }
    ).catch((error: unknown) =>
      metricsLog(`Échec de l'incrément campagne (${campaignId})`, error)
    );
    ecrireBucketQuotidien(campaignId, { totals: { editionPopupViews: increment(1) } });
    metricsLog(`vue attribuée à la campagne ${campaignId}`);
  } else {
    metricsLog(
      `aucune campagne liée à "${editionId}" — vue comptée sur l'édition seule ` +
        '(habillage posé à la main, ou activé avant ce correctif)'
    );
  }

  metricsLog('editionPopupViews +1', { editionId });
}

/** Cartes déjà signalées dans cette session — évite les écritures vouées au refus. */
const signalementsDejaFaits = new Set<string>();

/**
 * Signale une carte sponsor (contenu trompeur, lien mort, hors sujet…).
 * UN vote par joueur, garanti par la règle create-only de
 * `sponsorReports/{cardId}/votes/{uid}` ; trois votes distincts renvoient la
 * campagne en revérification humaine (route d'entretien du back-office).
 * Fire-and-forget, comme tout le reste : signaler ne bloque jamais le jeu.
 */
export function signalerCarteSponsor(cardId: string): void {
  const uid = useAuthStore.getState().user?.id;
  if (!cardId || !uid || !canTrack() || signalementsDejaFaits.has(cardId)) return;
  signalementsDejaFaits.add(cardId);
  setDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.sponsorReports, cardId, 'votes', uid), {
    reportedAt: Date.now(),
  }).catch(() => {
    // Déjà signalée par ce joueur (refus attendu) ou hors-ligne : silence.
  });
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
