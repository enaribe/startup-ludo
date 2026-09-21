// Amplitude — analytics produit (funnels, rétention, DAU/WAU/MAU, Pathfinder).
//
// Initialisation unique au démarrage (RootLayout). Sans clé API, tout est
// no-op silencieux : l'app ne doit jamais dépendre du tracking.
//
// - Sessions trackées automatiquement (durée / nombre / stickiness).
// - Session Replay actif (sampleRate 1 = toutes les sessions, dans la limite
//   du quota gratuit ; ajustable à distance depuis le dashboard Amplitude).
// - Les événements métier arrivent via la façade tracking.ts (un seul
//   catalogue, zéro double instrumentation).

import {
  Identify,
  add,
  identify,
  init,
  reset,
  setUserId,
  track,
  trackScreenView,
  Types,
} from '@amplitude/analytics-react-native';
import { SessionReplayPlugin } from '@amplitude/plugin-session-replay-react-native';

let initialized = false;

/**
 * Dernier écran vu (posé par trackAmplitudeScreen) : injecté en propriété
 * `screen` sur l'événement automatique « [Amplitude] End Session » — on sait
 * ainsi sur quel écran chaque session s'est terminée (sortie d'app).
 */
let currentScreen: string | null = null;

/**
 * Initialise le SDK Amplitude. À appeler une seule fois au démarrage de
 * l'app (RootLayout) — les appels suivants sont ignorés.
 */
export function initAmplitude(): void {
  if (initialized) return;

  const apiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) {
    console.warn('Amplitude API key missing — analytics disabled');
    return;
  }

  initialized = true;
  // Enrichissement : ajoute l'écran de sortie sur l'événement End Session
  // (généré automatiquement par le SDK, sans propriétés par défaut).
  add({
    name: 'end-session-screen',
    type: 'enrichment' as const,
    setup: async () => undefined,
    execute: async (event) => {
      if (event.event_type === 'session_end' && currentScreen) {
        event.event_properties = { ...event.event_properties, screen: currentScreen };
      }
      return event;
    },
  });
  init(apiKey, undefined, {
    logLevel: Types.LogLevel.Warn,
    // Événements Start/End Session → durée et nombre de sessions, stickiness
    trackingSessionEvents: true,
    // End Session n'est émis qu'AU RETOUR dans l'app, une fois la session
    // expirée (défaut SDK : 5 min d'inactivité). En dev, 30 s pour tester
    // sans attendre ; en prod on garde le défaut.
    ...(__DEV__ ? { sessionTimeout: 30 * 1000 } : {}),
  })
    .promise.then(() => {
      // Le plugin natif exige un sessionId numérique : il n'existe qu'une fois
      // l'init terminée (startNewSessionIfNeeded), d'où le chaînage ici.
      // enableRemoteConfig permet d'ajuster le sampleRate depuis le dashboard
      // sans re-livrer l'app (si le quota gratuit de replays est atteint).
      return add(new SessionReplayPlugin({ sampleRate: 1, enableRemoteConfig: true })).promise;
    })
    .then(() => {
      if (__DEV__) console.log('[Amplitude] Session Replay actif');
    })
    .catch((error: unknown) => {
      // Binaire buildé sans le module natif, ou échec du setup : on dégrade
      // en silence (events/screens continuent, seul le replay est absent).
      console.warn('[Amplitude] Session Replay indisponible :', error);
    });
  if (__DEV__) console.log('[Amplitude] SDK initialisé (sessions + replay)');
}

/**
 * Envoie un événement Amplitude. No-op si le SDK n'est pas initialisé
 * (clé manquante) — le SDK met lui-même en file les événements émis
 * pendant que l'init se termine.
 */
export function trackAmplitudeEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!initialized) {
    // Le silence est le pire diagnostic : sans cette ligne, un événement perdu
    // faute de clé API ressemble exactement à un événement jamais appelé.
    if (__DEV__) {
      console.warn(`[Amplitude] "${eventName}" IGNORÉ — SDK non initialisé (clé API absente ?)`);
    }
    return;
  }
  const result = track(eventName, properties);
  if (__DEV__) {
    // Confirmation de livraison : HTTP 200 = l'événement est bien arrivé
    // dans le projet Amplitude (visible ensuite dans le flux en direct).
    result.promise
      .then((r) => console.log(`[Amplitude] "${eventName}" envoyé (HTTP ${r.code})`))
      .catch((error: unknown) => console.warn(`[Amplitude] "${eventName}" en échec :`, error));
  }
}

/**
 * Vue d'écran (événement standard « [Amplitude] Screen Viewed ») — alimente
 * Pathfinder (parcours réels) et donne l'écran de sortie exact des funnels.
 */
export function trackAmplitudeScreen(screenName: string): void {
  currentScreen = screenName;
  if (!initialized) return;
  trackScreenView(screenName);
  if (__DEV__) console.log(`[Amplitude] écran "${screenName}"`);
}

/**
 * Associe l'utilisateur courant (login / restauration de session).
 * Les traits deviennent des propriétés utilisateur → cohortes et segments.
 */
export function identifyAmplitudeUser(
  userId: string,
  traits?: Record<string, unknown>
): void {
  if (!initialized) return;
  setUserId(userId);
  if (traits) {
    const id = new Identify();
    for (const [key, value] of Object.entries(traits)) {
      if (value !== undefined && value !== null) {
        id.set(key, value as string | number | boolean);
      }
    }
    identify(id);
  }
}

/**
 * Met à jour des propriétés de l'utilisateur courant (ex: xp, rang) sans
 * changer son identité — alimente cohortes et segments.
 */
export function setAmplitudeProfileAttributes(attributes: Record<string, unknown>): void {
  if (!initialized) return;
  const id = new Identify();
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) {
      id.set(key, value as string | number | boolean);
    }
  }
  identify(id);
}

/** Oublie l'utilisateur courant (logout / suppression de compte). */
export function clearAmplitudeIdentity(): void {
  if (!initialized) return;
  reset();
}
