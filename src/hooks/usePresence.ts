import { useEffect, useMemo, useState } from 'react';

import {
  subscribeToPresence,
  type PresenceMap,
} from '@/services/firebase/presenceService';

export function usePresenceMap(userIds: string[]): PresenceMap {
  const stableKey = useMemo(
    () => Array.from(new Set(userIds.filter(Boolean))).sort().join('|'),
    [userIds]
  );
  const [presence, setPresence] = useState<PresenceMap>({});

  useEffect(() => {
    const ids = stableKey ? stableKey.split('|') : [];
    if (ids.length === 0) {
      setPresence({});
      return undefined;
    }
    return subscribeToPresence(ids, setPresence);
  }, [stableKey]);

  return presence;
}
