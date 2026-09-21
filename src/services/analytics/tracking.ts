/**
 * Tracking produit — façade unique branchée sur Amplitude.
 *
 * Les écrans et stores appellent trackEvent / identifyUser / etc. sans
 * connaître l'outil derrière : brancher un autre outil analytics se fait
 * ici, sans toucher aux call sites.
 */

import {
  clearAmplitudeIdentity,
  identifyAmplitudeUser,
  setAmplitudeProfileAttributes,
  trackAmplitudeEvent,
  trackAmplitudeScreen,
} from './amplitude';

/**
 * Identifie le joueur connecté (à appeler au login / restauration de session).
 * Les traits deviennent des propriétés utilisateur → cohortes et segments.
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  identifyAmplitudeUser(userId, traits);
}

/** Oublie l'utilisateur courant (logout / suppression de compte). */
export function clearIdentity(): void {
  clearAmplitudeIdentity();
}

/** Envoie un événement de tracking (ex: "game_started", { mode: "solo" }). */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  trackAmplitudeEvent(name, properties);
}

/** Envoie une vue d'écran (Pathfinder, écran de sortie des funnels). */
export function trackScreen(title: string, _properties?: Record<string, unknown>): void {
  trackAmplitudeScreen(title);
}

/** Met à jour des attributs du profil identifié (ex: niveau, xp). */
export function setProfileAttributes(attributes: Record<string, unknown>): void {
  setAmplitudeProfileAttributes(attributes);
}
