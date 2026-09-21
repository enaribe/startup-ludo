/**
 * Notifications push — permission et token FCM via @react-native-firebase/messaging.
 *
 * Sert les notifications DIRECTES envoyées par nos Cloud Functions via FCM pur
 * (invitation de partie, etc.) : le token est enregistré dans Firestore
 * (`pushTokens/{userId}`) par pushTokenService.
 *
 * Le module natif n'est disponible que dans un development build
 * (EAS / expo run:*), pas dans Expo Go ni sur web — toutes les fonctions
 * dégradent en valeur neutre sans jamais throw.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';

export type PushPermissionStatus = 'GRANTED' | 'DENIED' | 'NOTDETERMINED';

type MessagingModule = typeof import('@react-native-firebase/messaging');

/**
 * Android ne distingue pas « jamais demandé » de « refusé » : on mémorise
 * nous-même le fait d'avoir déjà déclenché le prompt système.
 */
const STORAGE_KEY_REQUESTED = '@push_permission_requested';

function getMessagingModule(): MessagingModule | null {
  if (Platform.OS === 'web') return null;
  try {
    // Require paresseux : évite de charger le module natif dans Expo Go/web
    return require('@react-native-firebase/messaging');
  } catch {
    return null;
  }
}

/**
 * Statut actuel de la permission notifications.
 * Retourne 'NOTDETERMINED' si le module n'est pas disponible (Expo Go, web).
 */
export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  const mod = getMessagingModule();
  if (!mod) return 'NOTDETERMINED';
  try {
    const status = await mod.hasPermission(mod.getMessaging());
    const { AuthorizationStatus } = mod;
    if (status === AuthorizationStatus.NOT_DETERMINED) return 'NOTDETERMINED';
    if (status === AuthorizationStatus.DENIED) {
      // Android 13+ répond DENIED même avant tout prompt système : tant que
      // nous n'avons jamais demandé, on considère la permission indéterminée.
      if (Platform.OS === 'android') {
        const asked = await AsyncStorage.getItem(STORAGE_KEY_REQUESTED).catch(() => null);
        return asked ? 'DENIED' : 'NOTDETERMINED';
      }
      return 'DENIED';
    }
    // AUTHORIZED / PROVISIONAL / EPHEMERAL
    return 'GRANTED';
  } catch (error) {
    console.warn('[Push] getPushPermissionStatus failed:', error);
    return 'NOTDETERMINED';
  }
}

/**
 * Affiche le prompt SYSTÈME de permission notifications (iOS + Android 13+).
 * À n'appeler qu'après le pré-prompt maison (voir usePushPermissionPrompt) :
 * un refus système est quasi irréversible côté OS.
 */
export async function requestPushPermission(): Promise<PushPermissionStatus> {
  const mod = getMessagingModule();
  if (!mod) return 'NOTDETERMINED';
  try {
    if (Platform.OS === 'android') {
      await AsyncStorage.setItem(STORAGE_KEY_REQUESTED, '1').catch(() => {});
      // Avant Android 13, la permission est accordée d'office
      if ((Platform.Version as number) < 33) return 'GRANTED';
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return result === PermissionsAndroid.RESULTS.GRANTED ? 'GRANTED' : 'DENIED';
    }

    const status = await mod.requestPermission(mod.getMessaging(), {
      alert: true,
      badge: true,
      sound: true,
    });
    const { AuthorizationStatus } = mod;
    if (status === AuthorizationStatus.NOT_DETERMINED) return 'NOTDETERMINED';
    if (status === AuthorizationStatus.DENIED) return 'DENIED';
    return 'GRANTED';
  } catch (error) {
    console.warn('[Push] requestPushPermission failed:', error);
    return 'NOTDETERMINED';
  }
}

/**
 * Token push FCM de ce device. Sert à le cibler pour les notifications
 * directes envoyées par nos Cloud Functions.
 * Retourne null si indisponible (pas de permission, Expo Go, web).
 */
export async function getRegisteredPushToken(): Promise<string | null> {
  const mod = getMessagingModule();
  if (!mod) return null;
  try {
    const messaging = mod.getMessaging();
    // iOS exige l'enregistrement APNs avant getToken (no-op si déjà fait)
    if (Platform.OS === 'ios') {
      await mod.registerDeviceForRemoteMessages(messaging);
    }
    return await mod.getToken(messaging);
  } catch {
    // Pas de token disponible (permission refusée ou pas encore accordée)
    return null;
  }
}
