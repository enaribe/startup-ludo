// Customer.io — tracking d'événements et identification des joueurs.
//
// Le SDK natif (customerio-reactnative) n'est disponible que dans un
// development build (EAS / expo run:*), pas dans Expo Go ni sur web.
// Toutes les fonctions sont des no-op silencieux si le SDK n'est pas
// initialisé, pour ne jamais faire crasher l'app.

import { Platform } from 'react-native';

type CioModule = typeof import('customerio-reactnative');

let cio: CioModule | null = null;
let initPromise: Promise<void> | null = null;

function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_CUSTOMERIO_CDP_API_KEY;
}

/**
 * Initialise le SDK Customer.io. À appeler une seule fois au démarrage
 * de l'app (RootLayout). Les appels identify/track émis pendant
 * l'initialisation attendent automatiquement qu'elle se termine.
 */
export function initCustomerIO(): Promise<void> {
  if (initPromise) return initPromise;
  if (Platform.OS === 'web') {
    initPromise = Promise.resolve();
    return initPromise;
  }

  const cdpApiKey = getApiKey();
  if (!cdpApiKey) {
    if (__DEV__) {
      console.warn('[CustomerIO] EXPO_PUBLIC_CUSTOMERIO_CDP_API_KEY manquante — tracking désactivé');
    }
    initPromise = Promise.resolve();
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Require paresseux : évite de charger le module natif dans Expo Go/web
      const mod: CioModule = require('customerio-reactnative');
      const region =
        (process.env.EXPO_PUBLIC_CUSTOMERIO_REGION ?? 'us').toLowerCase() === 'eu'
          ? mod.CioRegion.EU
          : mod.CioRegion.US;

      await mod.CustomerIO.initialize({
        cdpApiKey,
        region,
        logLevel: __DEV__ ? mod.CioLogLevel.Debug : mod.CioLogLevel.Error,
        trackApplicationLifecycleEvents: true,
        autoTrackDeviceAttributes: true,
      });

      cio = mod;
      console.log('[CustomerIO] SDK initialisé');
    } catch (error) {
      console.warn('[CustomerIO] Échec d’initialisation:', error);
    }
  })();

  return initPromise;
}

/** Exécute un appel SDK après l'init, sans jamais rejeter. */
function withCio(fn: (mod: CioModule) => Promise<unknown>, label: string): void {
  (initPromise ?? Promise.resolve())
    .then(() => (cio ? fn(cio) : undefined))
    .catch((error: unknown) => console.warn(`[CustomerIO] ${label} failed:`, error));
}

/**
 * Identifie le joueur connecté (à appeler au login / restauration de session).
 * Les traits alimentent les segments et campagnes côté Customer.io.
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  withCio(
    (mod) => mod.CustomerIO.identify({ userId, traits: traits as Record<string, any> }),
    'identify'
  );
}

/** Oublie l'utilisateur courant (logout / suppression de compte). */
export function clearIdentity(): void {
  withCio((mod) => mod.CustomerIO.clearIdentify(), 'clearIdentify');
}

/** Envoie un événement de tracking (ex: "game_started", { mode: "solo" }). */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  withCio(
    (mod) => mod.CustomerIO.track(name, properties as Record<string, any>),
    `track(${name})`
  );
}

/** Envoie une vue d'écran (utile pour le ciblage in-app). */
export function trackScreen(title: string, properties?: Record<string, unknown>): void {
  withCio(
    (mod) => mod.CustomerIO.screen(title, properties as Record<string, any>),
    `screen(${title})`
  );
}

/** Met à jour des attributs du profil identifié (ex: niveau, xp). */
export function setProfileAttributes(attributes: Record<string, unknown>): void {
  withCio(
    (mod) => mod.CustomerIO.setProfileAttributes(attributes as Record<string, any>),
    'setProfileAttributes'
  );
}

// ===== Notifications push =====

export type PushPermissionStatus = 'GRANTED' | 'DENIED' | 'NOTDETERMINED';

/**
 * Statut actuel de la permission notifications.
 * Retourne 'NOTDETERMINED' si le SDK n'est pas disponible (Expo Go, web).
 */
export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  await (initPromise ?? Promise.resolve());
  if (!cio) return 'NOTDETERMINED';
  try {
    return (await cio.CustomerIO.pushMessaging.getPushPermissionStatus()) as PushPermissionStatus;
  } catch (error) {
    console.warn('[CustomerIO] getPushPermissionStatus failed:', error);
    return 'NOTDETERMINED';
  }
}

/**
 * Token push (FCM) enregistré par le SDK. Sert à cibler ce device pour les
 * notifications DIRECTES envoyées par nos Cloud Functions (hors Customer.io).
 * Retourne null si indisponible (pas de permission, Expo Go, web).
 */
export async function getRegisteredPushToken(): Promise<string | null> {
  await (initPromise ?? Promise.resolve());
  if (!cio) return null;
  try {
    return await cio.CustomerIO.pushMessaging.getRegisteredDeviceToken();
  } catch {
    // Pas de token enregistré (permission refusée ou pas encore accordée)
    return null;
  }
}

/**
 * Affiche le prompt SYSTÈME de permission notifications (iOS + Android 13+).
 * À n'appeler qu'après le pré-prompt maison (voir usePushPermissionPrompt) :
 * un refus système est quasi irréversible côté OS.
 */
export async function requestPushPermission(): Promise<PushPermissionStatus> {
  await (initPromise ?? Promise.resolve());
  if (!cio) return 'NOTDETERMINED';
  try {
    return (await cio.CustomerIO.pushMessaging.showPromptForPushNotifications({
      ios: { badge: true, sound: true },
    })) as PushPermissionStatus;
  } catch (error) {
    console.warn('[CustomerIO] requestPushPermission failed:', error);
    return 'NOTDETERMINED';
  }
}
