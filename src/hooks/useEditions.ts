import { useSyncExternalStore } from 'react';

import { getEditionListSnapshot, subscribeEditions } from '@/data';
import type { Edition } from '@/data/types';

/**
 * Liste réactive des éditions.
 *
 * EDITIONS est rempli de façon asynchrone (Firestore) après le démarrage.
 * Ce hook re-render le composant quand la liste change, afin que les écrans
 * de sélection d'édition ne restent pas bloqués sur le fallback local
 * (une seule édition « classic ») quand ils sont montés avant la fin du fetch.
 */
export function useEditions(): Edition[] {
  return useSyncExternalStore(subscribeEditions, getEditionListSnapshot, getEditionListSnapshot);
}
