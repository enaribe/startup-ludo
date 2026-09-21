/**
 * gameQuitTracker — enrichissement de l'événement `game_quit`.
 *
 * Un abandon VOLONTAIRE (bouton quitter) s'attrape sur le moment. Les trois
 * autres raisons tuent l'app avant tout envoi : on maintient donc un
 * MARQUEUR AsyncStorage « partie en cours », mis à jour pendant le jeu
 * (tour courant, écran affiché, indice de raison), effacé à toute sortie
 * propre (fin de partie, quit volontaire, navigation normale).
 *
 * Au lancement suivant, si le marqueur est encore là, la partie s'est
 * terminée anormalement : `flushAbandonedGame()` émet le `game_quit`
 * rétroactif avec la raison mémorisée :
 *   - 'app_backgrounded' : l'app était passée en arrière-plan (puis tuée) ;
 *   - 'network_lost'     : la connexion RTDB était tombée (partie en ligne) ;
 *   - 'crash'            : aucun indice → mort brutale au premier plan.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { trackEvent } from './tracking';

const STORAGE_KEY = '@game_in_progress';

export type GameQuitScreen = 'plateau_de_jeu' | 'resultats' | 'attente_adversaire';
export type GameQuitReasonHint = 'app_backgrounded' | 'network_lost';

interface GameProgressMarker {
  mode: string;
  edition: string;
  playersCount: number;
  startedAt: number;
  turnNumber: number;
  screen: GameQuitScreen;
  /** Case du pion du joueur local : index circuit, ou 'home'/'final'/'finished'. */
  boardPosition?: number | string | null;
  /** Type de la case où le pion se trouve (quiz, funding, duel, opportunity…). */
  caseEventType?: string | null;
  /** Événement en cours d'affichage (popup ouvert) au dernier instant connu. */
  activeEvent?: string | null;
  /** Dernière activité connue — sert de fin de partie pour la durée. */
  lastUpdatedAt: number;
  reasonHint?: GameQuitReasonHint;
}

/** Copie mémoire du marqueur (l'AsyncStorage n'est que la sauvegarde crash). */
let marker: GameProgressMarker | null = null;

function persist(): void {
  if (!marker) return;
  marker.lastUpdatedAt = Date.now();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(marker)).catch(() => {});
}

/** À l'entrée en partie. Écrase tout marqueur précédent. */
export function markGameInProgress(ctx: {
  mode: string;
  edition: string;
  playersCount: number;
  startedAt: number;
}): void {
  marker = {
    ...ctx,
    turnNumber: 1,
    screen: 'plateau_de_jeu',
    lastUpdatedAt: Date.now(),
  };
  persist();
}

/** À chaque changement de tour, d'écran, de case ou d'événement affiché. */
export function updateGameProgress(
  update: Partial<
    Pick<
      GameProgressMarker,
      'turnNumber' | 'screen' | 'boardPosition' | 'caseEventType' | 'activeEvent'
    >
  >
): void {
  if (!marker) return;
  Object.assign(marker, update);
  persist();
}

/**
 * L'app part en arrière-plan (ou en revient). Cet indice PRIME sur
 * network_lost : en arrière-plan la connexion RTDB tombe aussi, mais c'est
 * une conséquence, pas la cause de l'abandon.
 */
export function setBackgroundedHint(backgrounded: boolean): void {
  if (!marker) return;
  if (backgrounded) marker.reasonHint = 'app_backgrounded';
  else delete marker.reasonHint;
  persist();
}

/**
 * Connexion RTDB perdue / retrouvée (parties en ligne). N'écrase jamais un
 * indice d'arrière-plan, et son retour n'efface que lui-même.
 */
export function setNetworkLostHint(lost: boolean): void {
  if (!marker) return;
  if (lost) {
    if (marker.reasonHint === 'app_backgrounded') return;
    marker.reasonHint = 'network_lost';
  } else if (marker.reasonHint === 'network_lost') {
    delete marker.reasonHint;
  }
  persist();
}

/** Sortie PROPRE (fin de partie, quit volontaire, navigation) : plus rien à signaler. */
export function clearGameInProgress(): void {
  marker = null;
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

/**
 * Au lancement de l'app : si un marqueur a survécu, la dernière partie s'est
 * terminée anormalement → émet le `game_quit` rétroactif puis nettoie.
 */
export async function flushAbandonedGame(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    await AsyncStorage.removeItem(STORAGE_KEY);
    const m = JSON.parse(raw) as GameProgressMarker;
    trackEvent('game_quit', {
      mode: m.mode,
      edition: m.edition,
      players_count: m.playersCount,
      turn_number: m.turnNumber,
      screen: m.screen,
      board_position: m.boardPosition ?? 'inconnue',
      case_event_type: m.caseEventType ?? 'none',
      active_event: m.activeEvent ?? 'none',
      reason: m.reasonHint ?? 'crash',
      // Durée jusqu'à la dernière activité connue, pas jusqu'à ce boot-ci.
      duration_seconds: Math.max(0, Math.round((m.lastUpdatedAt - m.startedAt) / 1000)),
    });
  } catch {
    // Marqueur corrompu : on repart proprement.
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }
}
