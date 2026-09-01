/**
 * Class Service — Mode Classe, côté ÉLÈVE (lot 5).
 *
 * Deux moments, deux mécaniques radicalement différentes :
 *
 *   1. LE RATTACHEMENT (une fois par an, ~15 min de fenêtre ouverte par le prof)
 *      passe par les DEUX routes publiques du back-office. L'élève n'a aucun
 *      claim scolaire : les règles Firestore lui ferment `classes` et sa
 *      sous-collection `learners` — c'est délibéré, il s'agit d'une liste
 *      nominative de MINEURS. L'API est sa seule porte, et elle est étroite
 *      (fenêtre courte, projection « Fatou D. », limite de tentatives par IP).
 *
 *   2. TOUT LE RESTE (à chaque séance, sans code) passe en Firestore direct.
 *      Ce qui l'autorise est le miroir `classLinks/{uid}` — écrit UNIQUEMENT
 *      par l'Admin SDK lors du rattachement, et fermé en écriture à tous. Les
 *      règles s'y ancrent pour vérifier un rattachement RÉEL, là où
 *      `users/{uid}.classIds` ne serait qu'une déclaration de l'intéressé.
 *
 * ═══ RÈGLES DE ROBUSTESSE (impératives, modèle `sponsorMetricsService`) ═══
 *
 * Les fonctions d'ÉCRITURE appelées PENDANT la partie — `mettreAJourProgression`,
 * `enregistrerReponse`, `terminerSeance` — ne doivent JAMAIS casser ni ralentir
 * le jeu. Elles retournent donc `void`, jamais une promesse :
 *
 *   1. Aucune n'est `await`-able par la boucle de jeu : impossible pour un
 *      appelant de bloquer dessus, même par erreur. Elles avalent leur propre
 *      rejet dans un `.catch()` silencieux (log `__DEV__` uniquement).
 *   2. HORS LIGNE — choix documenté, identique aux métriques sponsor : on
 *      n'annule PAS l'écriture. Le SDK Firestore natif met le `set(merge)` en
 *      file locale et le rejoue à la reconnexion. Une séance jouée avec un wifi
 *      d'établissement capricieux remonte donc quand même, en différé.
 *   3. Les réponses aux quiz sont poussées avec `arrayUnion` : rejouer deux fois
 *      la même écriture ne crée pas de doublon, et deux écritures concurrentes
 *      ne s'écrasent pas l'une l'autre — ce qu'un tableau réécrit en entier
 *      ferait. C'est ce qui protège la donnée du rapport pédagogique (lot 6).
 *
 * Les fonctions de LECTURE, elles, sont `async` : elles alimentent des écrans,
 * pas la boucle de jeu, et leur échec doit être affiché à l'élève.
 */

import auth from '@react-native-firebase/auth';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

import type {
  ClassAnswer,
  ClassGameContext,
  ClassJoinLookup,
  ClassLearnerChoice,
  ClassLink,
  ClassLinkResult,
  ClassProgress,
  ClassSessionContent,
  ClassSessionLookup,
  ClassSessionSummary,
  MyClass,
} from '@/types/class';
import { ClassJoinError } from '@/types/class';
import { CLASS_SESSION_CONTENT_DOC, FIRESTORE_COLLECTIONS, firebaseLog } from './config';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION DE L'API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base des routes de rattachement, servie par le back-office (Next.js).
 *
 * Configurable par `EXPO_PUBLIC_ADMIN_API_URL` — les valeurs Expo publiques
 * sont inlinées au build, il n'y a donc rien à lire au runtime. Le défaut vise
 * le serveur de développement local (`npm run dev` du projet back-office) :
 * jamais d'URL en dur ailleurs dans le code.
 *
 * ⚠️ À RENSEIGNER AVANT TOUT BUILD DE RECETTE OU DE PRODUCTION, sinon
 * l'application tenterait de joindre `localhost` depuis le téléphone d'un élève
 * — ce qui échoue toujours, et en `offline` (pas en erreur explicite).
 * Exemple : `EXPO_PUBLIC_ADMIN_API_URL=https://admin.startupludo.app`
 */
const DEFAUT_ADMIN_API_URL = 'http://localhost:3000';

/** Base d'API normalisée : sans slash final, pour concaténer sans doublon. */
function baseApi(): string {
  const brute = process.env.EXPO_PUBLIC_ADMIN_API_URL ?? DEFAUT_ADMIN_API_URL;
  return brute.replace(/\/+$/, '');
}

/**
 * Délai au-delà duquel une requête de rattachement est abandonnée.
 * Sans lui, un wifi d'établissement qui « accepte » la connexion sans jamais
 * répondre laisserait l'élève sur un bouton en chargement, indéfiniment.
 */
const TIMEOUT_API_MS = 15_000;

/** Log de diagnostic réservé au dev — aucun bruit en production. */
function classLog(message: string, data?: unknown): void {
  if (__DEV__) console.log(`[Classe] ${message}`, data ?? '');
}

/** Alias du snapshot de requête (même convention que `programService`). */
type QDocSnap = FirebaseFirestoreTypes.QueryDocumentSnapshot;

// ═══════════════════════════════════════════════════════════════════════════
// 1. RATTACHEMENT — via les routes publiques du back-office
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Nettoie un code saisi : espaces retirés, majuscules forcées.
 * Même normalisation que le serveur (`_shared.ts`), appliquée ici en premier
 * pour éviter un aller-retour réseau sur une saisie manifestement fausse.
 */
export function normaliserCodeClasse(brut: string): string {
  return brut.trim().toUpperCase().replace(/\s+/g, '');
}

/** Alphabet du code de rattachement — sans O/0 ni I/1, fait pour être dicté. */
const ALPHABET_CODE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

/** Un code normalisé peut-il être un code de rattachement ? */
export function estCodeClasseValide(code: string): boolean {
  return ALPHABET_CODE.test(code);
}

/**
 * Traduit une réponse HTTP en échec typé.
 * Le message rédigé par le serveur est conservé : il est souvent plus précis
 * que tout ce que le mobile pourrait formuler (« déjà rattaché à "Fatou D." »).
 */
async function erreurDepuisReponse(reponse: Response): Promise<ClassJoinError> {
  let messageServeur: string | null = null;
  try {
    const corps = (await reponse.json()) as { error?: unknown };
    if (typeof corps.error === 'string') messageServeur = corps.error;
  } catch {
    // Corps vide ou non-JSON (page d'erreur d'un proxy) : on garde `null` et
    // l'écran affichera son message générique.
  }

  const retryAfter = Number(reponse.headers.get('Retry-After'));
  const retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;

  switch (reponse.status) {
    case 401:
      return new ClassJoinError('unauthenticated', { serverMessage: messageServeur });
    case 404:
      return new ClassJoinError('invalid_code', { serverMessage: messageServeur });
    case 409:
      return new ClassJoinError('conflict', { serverMessage: messageServeur });
    case 429:
      return new ClassJoinError('rate_limited', { retryAfterSeconds, serverMessage: messageServeur });
    default:
      return new ClassJoinError('unknown', { serverMessage: messageServeur });
  }
}

/**
 * `fetch` avec délai maximal, qui distingue « pas de réseau » du reste.
 * Cette distinction n'est pas cosmétique : face à un code refusé l'élève doit
 * demander au prof de rouvrir la fenêtre, face à une coupure il doit réessayer.
 * Confondre les deux immobilise une classe entière.
 */
async function appelApi(url: string, init?: RequestInit): Promise<Response> {
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), TIMEOUT_API_MS);
  try {
    return await fetch(url, { ...init, signal: controleur.signal });
  } catch (error) {
    // `fetch` ne rejette QUE sur un problème de transport (DNS, TCP, timeout).
    // Un 404 ou un 500 sont des réponses : ils passent par `erreurDepuisReponse`.
    classLog('Appel API injoignable', error);
    throw new ClassJoinError('offline');
  } finally {
    clearTimeout(minuterie);
  }
}

/**
 * Étape 1 du rattachement — résout un code et récupère la liste des élèves.
 *
 * Ne demande AUCUNE authentification : la route est publique, bornée par la
 * brièveté de la fenêtre et une limite de tentatives par IP.
 *
 * @throws `ClassJoinError` — `invalid_code` (404, inconnu OU expiré, le serveur
 *         ne distingue pas pour ne pas servir d'oracle), `rate_limited` (429),
 *         `offline`, `unknown`.
 */
export async function rejoindreClasseParCode(code: string): Promise<ClassJoinLookup> {
  const codeNormalise = normaliserCodeClasse(code);
  // Court-circuit local : une saisie hors alphabet ne peut pas être un code.
  // On économise un appel réseau ET un crédit du quota de tentatives.
  if (!estCodeClasseValide(codeNormalise)) throw new ClassJoinError('invalid_code');

  const reponse = await appelApi(`${baseApi()}/api/class/join/${codeNormalise}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!reponse.ok) throw await erreurDepuisReponse(reponse);

  const donnees = (await reponse.json()) as Partial<ClassJoinLookup>;
  const learners = Array.isArray(donnees.learners) ? donnees.learners : [];

  return {
    classId: donnees.classId ?? '',
    className: donnees.className ?? '',
    // Re-normalisation défensive : l'écran grise sur `taken`, une valeur
    // absente ne doit jamais se lire comme « libre ».
    learners: learners.map(
      (e): ClassLearnerChoice => ({
        id: String(e.id ?? ''),
        displayName: String(e.displayName ?? ''),
        taken: e.taken === true,
      })
    ),
  };
}

/**
 * Résout un code de SALLE D'ATTENTE — la porte du QR projeté par l'enseignant.
 *
 * Décalque de `rejoindreClasseParCode`, sur `/api/session/join/[code]` : même
 * absence d'authentification (route publique, bornée par l'expiration du code
 * et la limite de tentatives par IP), même normalisation locale qui économise
 * un appel réseau ET un crédit de quota sur une saisie hors alphabet.
 *
 * ⚠️ CE QU'ELLE NE FAIT PAS : autoriser l'entrée. Elle désigne une séance et
 * projette la liste des noms de SA classe. C'est la règle Firestore
 * `estCetEleve()` qui vérifie ensuite que l'appelant est rattaché à cette
 * classe précise — un élève d'une autre classe obtient donc bien cette réponse,
 * puis se voit refuser l'écriture par la base. L'écran compare `classId` au
 * rattachement local pour l'annoncer proprement, mais la garantie n'est pas là.
 *
 * @throws `ClassJoinError` — mêmes cas que `rejoindreClasseParCode`.
 */
export async function rejoindreSeanceParCode(code: string): Promise<ClassSessionLookup> {
  const codeNormalise = normaliserCodeClasse(code);
  if (!estCodeClasseValide(codeNormalise)) throw new ClassJoinError('invalid_code');

  const reponse = await appelApi(`${baseApi()}/api/session/join/${codeNormalise}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!reponse.ok) throw await erreurDepuisReponse(reponse);

  const donnees = (await reponse.json()) as Partial<ClassSessionLookup>;
  const learners = Array.isArray(donnees.learners) ? donnees.learners : [];

  return {
    sessionId: donnees.sessionId ?? '',
    classId: donnees.classId ?? '',
    className: donnees.className ?? '',
    sessionTitle: donnees.sessionTitle ?? '',
    editionId: donnees.editionId ?? '',
    demarree: donnees.demarree === true,
    // Re-normalisation défensive : l'écran grise sur `taken`, une valeur
    // absente ne doit jamais se lire comme « libre ».
    learners: learners.map(
      (e): ClassLearnerChoice => ({
        id: String(e.id ?? ''),
        displayName: String(e.displayName ?? ''),
        taken: e.taken === true,
      })
    ),
  };
}

/**
 * Étape 2 du rattachement — lie DÉFINITIVEMENT ce compte à un nom de la classe.
 *
 * Le serveur écrit, dans une seule transaction : `learners.linkedUid`,
 * `users/{uid}.classIds[]` et le miroir `classLinks/{uid}`. La transaction est
 * ce qui empêche deux élèves de réclamer le même nom au même instant.
 *
 * @throws `ClassJoinError` — `unauthenticated` (pas de compte, ou compte
 *         invité), `conflict` (409, nom pris ou compte déjà rattaché),
 *         `invalid_code` (404), `rate_limited`, `offline`, `unknown`.
 */
export async function rattacherEleve(code: string, learnerId: string): Promise<ClassLinkResult> {
  const utilisateur = auth().currentUser;
  // Un invité n'a pas d'identité durable : le serveur refuserait de toute façon
  // (`sign_in_provider === 'anonymous'`), autant l'annoncer sans aller-retour.
  if (!utilisateur || utilisateur.isAnonymous) throw new ClassJoinError('unauthenticated');

  let jeton: string;
  try {
    jeton = await utilisateur.getIdToken();
  } catch (error) {
    // Jeton non rafraîchissable : hors ligne, ou session révoquée.
    classLog('Jeton d’identité indisponible', error);
    throw new ClassJoinError('offline');
  }

  const reponse = await appelApi(`${baseApi()}/api/class/link`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jeton}`,
    },
    body: JSON.stringify({ code: normaliserCodeClasse(code), learnerId }),
  });
  if (!reponse.ok) throw await erreurDepuisReponse(reponse);

  const donnees = (await reponse.json()) as Partial<ClassLinkResult>;
  firebaseLog('Élève rattaché à une classe', { classId: donnees.classId, learnerId });

  return {
    classId: donnees.classId ?? '',
    className: donnees.className ?? '',
    learnerId: donnees.learnerId ?? learnerId,
    displayName: donnees.displayName ?? '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. MES CLASSES — Firestore direct, via le miroir `classLinks/{uid}`
// ═══════════════════════════════════════════════════════════════════════════

/** Lecture typée d'un `classLinks/{uid}`, ou `null` si l'élève n'est rattaché à rien. */
async function lireClassLink(uid: string): Promise<ClassLink | null> {
  const snap = await getDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.classLinks, uid));
  const data = snap.data();
  if (!data) return null;

  const classId = typeof data['classId'] === 'string' ? data['classId'] : '';
  const learnerId = typeof data['learnerId'] === 'string' ? data['learnerId'] : '';
  if (!classId || !learnerId) return null;

  return {
    classId,
    learnerId,
    linkedAt: typeof data['linkedAt'] === 'number' ? data['linkedAt'] : 0,
  };
}

/**
 * Les classes de l'élève connecté.
 *
 * ⚠️ LIMITE CONNUE, ASSUMÉE POUR CE LOT : `classLinks` est UN document par
 * compte (`classLinks/{uid}`) — le back-office y écrit en `merge`, donc un
 * élève rattaché à une seconde classe voit la première REMPLACÉE. Le parcours
 * mobile est donc mono-classe aujourd'hui, ce qui couvre le cas d'usage réel
 * (un élève, une classe). Le multi-matières exigera de faire de `classLinks`
 * une sous-collection côté back-office ; cette fonction renvoie déjà un tableau
 * pour que ni les écrans ni leur mise en page n'aient à changer ce jour-là.
 *
 * Le NOM de la classe ne peut pas être lu ici : les règles ferment
 * `classes/{cid}` à l'élève, à dessein. Il est récupéré au rattachement (réponse
 * de `/api/class/link`) et confié à l'appelant, qui le persiste — d'où le
 * paramètre `nomsConnus`, une simple table de correspondance d'affichage.
 */
export async function getMesClasses(nomsConnus?: Record<string, string>): Promise<MyClass[]> {
  const uid = auth().currentUser?.uid;
  if (!uid) return [];

  try {
    const lien = await lireClassLink(uid);
    if (!lien) return [];

    return [
      {
        classId: lien.classId,
        className: nomsConnus?.[lien.classId] ?? '',
        learnerId: lien.learnerId,
        linkedAt: lien.linkedAt,
      },
    ];
  } catch (error) {
    // Hors ligne ou règles non déployées : pas de classe affichée plutôt qu'un
    // écran en erreur. L'élève retrouvera sa classe à la reconnexion.
    firebaseLog('Lecture des classes de l’élève en échec', error);
    return [];
  }
}

/** Le rattachement de l'élève connecté, ou `null`. Utile pour connaître son `learnerId`. */
export async function getMonRattachement(): Promise<ClassLink | null> {
  const uid = auth().currentUser?.uid;
  if (!uid) return null;
  try {
    return await lireClassLink(uid);
  } catch (error) {
    firebaseLog('Lecture du rattachement en échec', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. SÉANCES EN COURS
// ═══════════════════════════════════════════════════════════════════════════

/** Convertit un document Firestore en séance typée. */
function versSeance(id: string, data: Record<string, unknown>): ClassSessionSummary {
  const contentPackId = typeof data['contentPackId'] === 'string' ? data['contentPackId'] : undefined;
  const title = typeof data['title'] === 'string' ? data['title'] : undefined;
  const startedAt = typeof data['startedAt'] === 'number' ? data['startedAt'] : undefined;
  const startedPlayingAt =
    typeof data['startedPlayingAt'] === 'number' ? data['startedPlayingAt'] : undefined;

  return {
    id,
    classId: typeof data['classId'] === 'string' ? data['classId'] : '',
    status: data['status'] === 'running' || data['status'] === 'ended' ? data['status'] : 'scheduled',
    editionId: typeof data['editionId'] === 'string' ? data['editionId'] : 'classic',
    durationMinutes: typeof data['durationMinutes'] === 'number' ? data['durationMinutes'] : 30,
    // `exactOptionalPropertyTypes` n'est pas activé, mais on évite quand même de
    // poser des clés à `undefined` : elles remonteraient telles quelles dans le
    // contexte de jeu puis dans Firestore, qui les refuse.
    ...(contentPackId ? { contentPackId } : {}),
    ...(title ? { title } : {}),
    ...(startedAt ? { startedAt } : {}),
    ...(startedPlayingAt ? { startedPlayingAt } : {}),
  };
}

/**
 * Les séances actuellement OUVERTES d'une classe.
 *
 * Requête doublement bornée — `classId` ET `status == 'running'` — et ce n'est
 * pas seulement une optimisation : les règles Firestore refusent une requête
 * dont le filtre ne garantit pas que TOUS les documents renvoyés seraient
 * lisibles. Élargir ce `where` ferait échouer la requête entière, pas seulement
 * les documents hors périmètre.
 *
 * ⚠️ Un index composite (`classId` + `status`) est nécessaire — il est déclaré
 * dans `firestore.indexes.json`.
 *
 * Ne lève jamais : une séance invisible est un désagrément, un écran en erreur
 * devant une classe en est un autre.
 */
export async function getSeancesEnCours(classId: string): Promise<ClassSessionSummary[]> {
  if (!classId) return [];

  try {
    const snap = await getDocs(
      query(
        collection(getFirestore(), FIRESTORE_COLLECTIONS.classSessions),
        where('classId', '==', classId),
        where('status', '==', 'running')
      )
    );
    return snap.docs.map((d: QDocSnap) => versSeance(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    firebaseLog('Lecture des séances en cours en échec', error);
    return [];
  }
}

/**
 * Écoute temps réel des séances en cours d'une classe. Retourne l'unsubscribe.
 *
 * POURQUOI un `onSnapshot` ici et pas ailleurs : l'élève ouvre l'app AVANT que
 * le prof ne lance la séance — c'est même le cas nominal, toute la classe est
 * déjà en attente. Sans temps réel, il devrait tirer pour rafraîchir jusqu'à ce
 * que ça marche, trente fois, pendant que le prof répète « rafraîchissez ».
 * Le coût est borné : une classe, une poignée de documents, l'écran seulement.
 */
export function ecouterSeancesEnCours(
  classId: string,
  callback: (seances: ClassSessionSummary[]) => void
): () => void {
  if (!classId) return () => undefined;

  return onSnapshot(
    query(
      collection(getFirestore(), FIRESTORE_COLLECTIONS.classSessions),
      where('classId', '==', classId),
      where('status', '==', 'running')
    ),
    (snap) => {
      callback(snap.docs.map((d: QDocSnap) => versSeance(d.id, d.data() as Record<string, unknown>)));
    },
    (error) => {
      // Index manquant, règles, hors ligne : on n'efface pas la liste déjà
      // affichée — l'élève garde sa séance sous les yeux et peut la rejoindre.
      firebaseLog('Abonnement aux séances en cours en échec', error);
    }
  );
}

/**
 * Écoute UNE séance précise — le moteur de la SALLE D'ATTENTE.
 *
 * L'élève entré par le QR patiente sur `startedPlayingAt` : quand l'enseignant
 * appuie sur « Démarrer la partie », le champ apparaît et toute la salle part
 * ensemble, à la seconde. Sans temps réel, chacun devrait tirer pour rafraîchir
 * et le départ groupé — tout l'intérêt de la salle d'attente — serait perdu.
 *
 * Lecture PAR ID, jamais en requête : la règle Firestore autorise l'élève
 * rattaché à lire la séance de SA classe, mais un `where` ne pourrait rien
 * promettre sur `classId` et le listing serait refusé en bloc.
 *
 * Le callback reçoit `null` si la séance disparaît ou devient illisible — c'est
 * le cas quand l'enseignant clôture : l'écran doit alors sortir l'élève.
 */
export function ecouterSeance(
  sessionId: string,
  callback: (seance: ClassSessionSummary | null) => void
): () => void {
  if (!sessionId) return () => undefined;

  return onSnapshot(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.classSessions, sessionId),
    (snap) => {
      const data = snap.data();
      callback(data ? versSeance(snap.id, data as Record<string, unknown>) : null);
    },
    (error) => {
      // Règles, hors ligne : on ne prétend pas que la séance n'existe plus —
      // l'écran garde son état et laisse l'élève réessayer.
      firebaseLog('Abonnement à la séance en échec', error);
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. CONTENU DE LA SÉANCE
// ═══════════════════════════════════════════════════════════════════════════

/** Tableau typé depuis une valeur Firestore inconnue — `[]` si ce n'en est pas un. */
function tableauOuVide<T>(valeur: unknown): T[] {
  return Array.isArray(valeur) ? (valeur as T[]) : [];
}

/**
 * Le contenu pédagogique figé de la séance — quiz, duels, financements,
 * opportunités et défis générés depuis le cours de l'enseignant, puis relus
 * par lui.
 *
 * Retourne `null` si l'enseignant n'a rien généré : la séance se joue alors
 * avec le contenu de l'édition qu'il a choisie. C'est un repli normal, pas une
 * panne — la voie (c) du wizard back-office est précisément « une édition
 * existante ».
 */
export async function getContenuSeance(sessionId: string): Promise<ClassSessionContent | null> {
  if (!sessionId) return null;

  try {
    const snap = await getDoc(
      doc(
        getFirestore(),
        FIRESTORE_COLLECTIONS.classSessionContent(sessionId),
        CLASS_SESSION_CONTENT_DOC
      )
    );
    const data = snap.data();
    if (!data) return null;

    const contenu: ClassSessionContent = {
      quizzes: tableauOuVide(data['quizzes']),
      duels: tableauOuVide(data['duels']),
      fundings: tableauOuVide(data['fundings']),
      opportunities: tableauOuVide(data['opportunities']),
      challengeEvents: tableauOuVide(data['challengeEvents']),
    };

    // Un pack entièrement vide vaut absence de pack : injecté tel quel, il
    // priverait la partie de TOUT événement (l'EventManager n'a pas de repli
    // quand un contentPack est posé). Mieux vaut l'édition de l'enseignant.
    const total =
      contenu.quizzes.length +
      contenu.duels.length +
      contenu.fundings.length +
      contenu.opportunities.length +
      contenu.challengeEvents.length;
    if (total === 0) return null;

    classLog('Contenu de séance chargé', { sessionId, cartes: total });
    return contenu;
  } catch (error) {
    // Le jeu doit pouvoir démarrer quand même, avec le contenu de l'édition.
    firebaseLog('Lecture du contenu de séance en échec', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. PARTICIPATION — écritures de l'élève PENDANT la partie
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Référence du document participant de l'élève dans une séance.
 * Un document par élève, l'id étant son `learnerId` : c'est ce qui rend la
 * règle Firestore exprimable (« le learner visé est rattaché à MON compte »).
 */
function refParticipant(sessionId: string, learnerId: string) {
  return doc(
    getFirestore(),
    FIRESTORE_COLLECTIONS.classSessionParticipants(sessionId),
    learnerId
  );
}

/**
 * Écriture « au mieux » du document participant : jamais attendue, jamais
 * bruyante. TOUTES les écritures en cours de partie passent par ici.
 *
 * `set(merge)` crée le document au premier appel — aucune initialisation n'est
 * requise côté enseignant, et un élève qui rejoint après le début de la séance
 * n'est pas un cas particulier.
 */
function ecrireParticipant(
  sessionId: string,
  learnerId: string,
  donnees: Record<string, unknown>,
  contexte: string
): void {
  if (!sessionId || !learnerId) return;

  setDoc(refParticipant(sessionId, learnerId), { ...donnees, lastSeenAt: Date.now() }, { merge: true })
    .catch((error: unknown) => {
      // Hors ligne, règles non déployées, séance clôturée par le prof pendant
      // la partie… : aucun de ces cas ne doit interrompre l'élève qui joue.
      classLog(`Écriture participant en échec (${contexte})`, error);
    });
}

/**
 * L'élève rejoint la séance — premier contact, avant même le lancement du jeu.
 *
 * `displayName` est recopié dans le document : l'écran de suivi de l'enseignant
 * (lot 6) affiche ainsi la liste sans une jointure par élève sur `learners`.
 *
 * Volontairement `void` comme les autres écritures de séance : un réseau lent
 * ne doit pas retarder l'entrée en jeu. Si l'écriture se perd, la partie se
 * joue quand même et la progression recréera le document au premier throttle.
 */
export function rejoindreSeance(sessionId: string, learnerId: string, displayName = ''): void {
  ecrireParticipant(
    sessionId,
    learnerId,
    {
      learnerId,
      ...(displayName ? { displayName } : {}),
      status: 'joined',
      joinedAt: Date.now(),
    },
    'rejoindreSeance'
  );
}

/**
 * Remonte la progression de l'élève sur le plateau.
 *
 * Appelée sous throttle (~10 s) et à chaque événement notable — voir
 * `useClassSessionReporter`. Le débit est donc borné par l'appelant, pas ici.
 */
export function mettreAJourProgression(
  sessionId: string,
  learnerId: string,
  data: { progress: ClassProgress; score?: number }
): void {
  ecrireParticipant(
    sessionId,
    learnerId,
    {
      learnerId,
      status: 'playing',
      progress: data.progress,
      ...(typeof data.score === 'number' ? { score: data.score } : {}),
    },
    'mettreAJourProgression'
  );
}

/**
 * Enregistre UNE réponse de quiz — la donnée qui fera le rapport pédagogique.
 *
 * `arrayUnion` et non un tableau réécrit : les réponses arrivent au fil de la
 * partie, souvent avec des écritures de progression en vol. Réécrire le tableau
 * entier ferait perdre toute réponse écrite entre la lecture et l'écriture, et
 * hors ligne le rejeu de la file écraserait les réponses suivantes. `arrayUnion`
 * est additif et idempotent : deux envois du même objet ne font qu'une entrée.
 *
 * `answeredAt` est posé PAR L'APPELANT au moment de la réponse et non ici, pour
 * que l'horodatage reste juste même quand l'écriture part avec dix minutes de
 * retard, au retour du réseau.
 */
export function enregistrerReponse(sessionId: string, learnerId: string, reponse: ClassAnswer): void {
  if (!reponse.quizId) return;

  ecrireParticipant(
    sessionId,
    learnerId,
    {
      learnerId,
      status: 'playing',
      answers: arrayUnion(reponse),
      lastEvent: {
        kind: reponse.correct === true ? 'quiz_ok' : 'quiz_ko',
        label: reponse.category ?? '',
        at: reponse.answeredAt ?? Date.now(),
      },
    },
    'enregistrerReponse'
  );
}

/**
 * Clôt la participation de l'élève : partie terminée (gagnée, perdue ou quittée).
 *
 * Le score et la progression finale sont écrits DANS LE MÊME appel que le
 * passage en `finished` : deux écritures séparées laisseraient, si la seconde
 * se perd, un élève « terminé » avec un score figé au dernier throttle.
 */
export function terminerSeance(
  sessionId: string,
  learnerId: string,
  data?: { progress?: ClassProgress; score?: number; abandoned?: boolean }
): void {
  ecrireParticipant(
    sessionId,
    learnerId,
    {
      learnerId,
      status: data?.abandoned ? 'abandoned' : 'finished',
      finishedAt: Date.now(),
      ...(data?.progress ? { progress: data.progress } : {}),
      ...(typeof data?.score === 'number' ? { score: data.score } : {}),
    },
    'terminerSeance'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. CONSTRUCTION DU CONTEXTE DE JEU
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fabrique le contexte à passer à `initGame` pour jouer une séance.
 * Regroupé ici pour que les écrans n'aient pas à connaître la forme exacte du
 * contexte — et pour qu'un champ ajouté un jour ne soit pas oublié dans l'un
 * des appelants.
 */
export function construireContexteClasse(
  seance: ClassSessionSummary,
  learnerId: string
): ClassGameContext {
  return {
    origin: 'class',
    classId: seance.classId,
    sessionId: seance.id,
    learnerId,
    ...(seance.contentPackId ? { contentPackId: seance.contentPackId } : {}),
    editionId: seance.editionId,
  };
}
