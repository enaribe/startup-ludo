/**
 * App Config Service — configuration applicative pilotée depuis l'admin.
 * Document `appConfig/version` : version minimale supportée + liens stores.
 * Utilisé par le popup de mise à jour obligatoire (ForceUpdatePopup).
 */
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';

import { FIRESTORE_COLLECTIONS, firebaseLog } from './config';

/** Document Firestore `appConfig/version` (géré depuis l'admin). */
export interface AppVersionConfig {
  /** Version minimale supportée (ex: "2.2.0"). En dessous → mise à jour obligatoire. */
  minSupportedVersion: string;
  /** Lien Play Store (Android). */
  androidStoreUrl?: string;
  /** Lien App Store (iOS). */
  iosStoreUrl?: string;
  /** Message optionnel affiché dans le popup (remplace le texte par défaut). */
  message?: string;
}

const VERSION_DOC_ID = 'version';

/**
 * Écoute en temps réel la config de version. Si l'admin remonte la version
 * minimale pendant que l'app est ouverte, le popup apparaît immédiatement.
 * Retourne la fonction de désabonnement. En cas d'erreur (offline, rules),
 * le callback n'est pas appelé — l'app reste utilisable (fail-open).
 */
export function subscribeToAppVersionConfig(
  callback: (config: AppVersionConfig | null) => void
): () => void {
  const ref = doc(getFirestore(), FIRESTORE_COLLECTIONS.appConfig, VERSION_DOC_ID);
  return onSnapshot(
    ref,
    (snapshot) => {
      const data = snapshot?.data();
      if (data && typeof (data as AppVersionConfig).minSupportedVersion === 'string') {
        callback(data as AppVersionConfig);
      } else {
        callback(null);
      }
    },
    (error) => {
      // Fail-open : on ne bloque jamais l'app si la config est illisible.
      firebaseLog('Failed to subscribe to app version config', error);
    }
  );
}
