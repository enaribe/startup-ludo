import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLeaderboard, getAllStartups } from '@/services/firebase/firestore';
import type { Startup } from '@/types';

const CACHE_KEYS = {
  PLAYERS: '@leaderboard_players_v3',
  STARTUPS: '@leaderboard_startups_v3',
  PLAYERS_TIMESTAMP: '@leaderboard_players_ts_v3',
  STARTUPS_TIMESTAMP: '@leaderboard_startups_ts_v3',
};

/** Durée de validité du cache (cohérent avec le message UI). */
const CACHE_DURATION = 5 * 60 * 1000; // 5 min
/** Si le cache est plus récent que ça, on ne refresh pas en arrière-plan. */
const REFRESH_DEBOUNCE = 30 * 1000; // 30s
/** Top N entrées à charger — la fenêtre autour de l'utilisateur est calculée client-side. */
const LEADERBOARD_LIMIT = 20;
const STARTUPS_LIMIT = 20;

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  xp: number;
  level: number;
  gamesWon: number;
  totalGames: number;
  avatarUrl?: string | null;
}

// Cache mémoire — survit aux remontages sans repasser par AsyncStorage.
type MemCache = {
  players: LeaderboardEntry[] | null;
  startups: Startup[] | null;
  playersTs: number;
  startupsTs: number;
};
let _memCache: MemCache = {
  players: null,
  startups: null,
  playersTs: 0,
  startupsTs: 0,
};

/** Invalider le cache mémoire (à appeler au logout pour éviter les fuites entre comptes). */
export function clearLeaderboardCache(): void {
  _memCache = { players: null, startups: null, playersTs: 0, startupsTs: 0 };
}

type Dataset = 'players' | 'startups';

/**
 * Hook de cache du classement, fetch lazy par dataset.
 * @param dataset 'players' ou 'startups' — détermine ce qui est chargé.
 *                Si on ne précise pas, on charge les deux (compat).
 */
export function useLeaderboardCache(dataset: Dataset | 'both' = 'both') {
  const [players, setPlayers] = useState<LeaderboardEntry[]>(_memCache.players ?? []);
  const [startups, setStartups] = useState<Startup[]>(_memCache.startups ?? []);
  const [isLoading, setIsLoading] = useState(() => {
    if (dataset === 'players') return _memCache.players === null;
    if (dataset === 'startups') return _memCache.startups === null;
    return _memCache.players === null && _memCache.startups === null;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef<{ players: boolean; startups: boolean }>({
    players: false,
    startups: false,
  });

  const persistPlayers = useCallback(async (entries: LeaderboardEntry[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.PLAYERS, JSON.stringify(entries)),
        AsyncStorage.setItem(CACHE_KEYS.PLAYERS_TIMESTAMP, Date.now().toString()),
      ]);
    } catch (err) {
      if (__DEV__) console.warn('[LeaderboardCache] persistPlayers failed', err);
    }
  }, []);

  const persistStartups = useCallback(async (data: Startup[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.STARTUPS, JSON.stringify(data)),
        AsyncStorage.setItem(CACHE_KEYS.STARTUPS_TIMESTAMP, Date.now().toString()),
      ]);
    } catch (err) {
      if (__DEV__) console.warn('[LeaderboardCache] persistStartups failed', err);
    }
  }, []);

  const fetchPlayers = useCallback(async () => {
    if (isFetchingRef.current.players) return;
    isFetchingRef.current.players = true;
    try {
      const entries = await getLeaderboard('allTime', LEADERBOARD_LIMIT);
      const now = Date.now();
      _memCache.players = entries;
      _memCache.playersTs = now;
      setPlayers(entries);
      void persistPlayers(entries);
    } catch (err) {
      if (__DEV__) console.warn('[LeaderboardCache] fetchPlayers failed', err);
    } finally {
      isFetchingRef.current.players = false;
    }
  }, [persistPlayers]);

  const fetchStartups = useCallback(async () => {
    if (isFetchingRef.current.startups) return;
    isFetchingRef.current.startups = true;
    try {
      const data = await getAllStartups(STARTUPS_LIMIT);
      const now = Date.now();
      _memCache.startups = data;
      _memCache.startupsTs = now;
      setStartups(data);
      void persistStartups(data);
    } catch (err) {
      if (__DEV__) console.warn('[LeaderboardCache] fetchStartups failed', err);
    } finally {
      isFetchingRef.current.startups = false;
    }
  }, [persistStartups]);

  /**
   * Hydratation : pour chaque dataset demandé, on hydrate depuis le cache mémoire,
   * puis AsyncStorage en fallback, puis Firestore. Skip le refresh background si
   * le cache mémoire est plus récent que REFRESH_DEBOUNCE.
   */
  useEffect(() => {
    const wantPlayers = dataset === 'players' || dataset === 'both';
    const wantStartups = dataset === 'startups' || dataset === 'both';

    const hydrateOne = async (
      key: 'players' | 'startups',
      cacheKey: string,
      tsKey: string,
      setter: (data: never[]) => void,
      fetcher: () => Promise<void>,
    ): Promise<void> => {
      const now = Date.now();
      const memData = _memCache[key];
      const memTs = key === 'players' ? _memCache.playersTs : _memCache.startupsTs;

      // Mémoire frais → skip fetch background si très récent
      if (memData !== null) {
        const tooRecent = now - memTs < REFRESH_DEBOUNCE;
        const stillFresh = now - memTs < CACHE_DURATION;
        if (tooRecent) return;
        if (stillFresh) {
          // Refresh silencieux
          void fetcher();
          return;
        }
        // Cache expiré → fetch
        await fetcher();
        return;
      }

      // Pas en mémoire → essayer AsyncStorage
      try {
        const [cached, ts] = await Promise.all([
          AsyncStorage.getItem(cacheKey),
          AsyncStorage.getItem(tsKey),
        ]);

        if (cached && ts && now - parseInt(ts, 10) < CACHE_DURATION) {
          const parsed = JSON.parse(cached);
          setter(parsed);
          if (key === 'players') {
            _memCache.players = parsed;
            _memCache.playersTs = parseInt(ts, 10);
          } else {
            _memCache.startups = parsed;
            _memCache.startupsTs = parseInt(ts, 10);
          }
          // Refresh silencieux
          void fetcher();
        } else {
          await fetcher();
        }
      } catch (err) {
        if (__DEV__) console.warn(`[LeaderboardCache] hydrate ${key} failed`, err);
        await fetcher();
      }
    };

    const init = async () => {
      const tasks: Promise<void>[] = [];
      if (wantPlayers) {
        tasks.push(
          hydrateOne(
            'players',
            CACHE_KEYS.PLAYERS,
            CACHE_KEYS.PLAYERS_TIMESTAMP,
            setPlayers as (data: never[]) => void,
            fetchPlayers,
          ),
        );
      }
      if (wantStartups) {
        tasks.push(
          hydrateOne(
            'startups',
            CACHE_KEYS.STARTUPS,
            CACHE_KEYS.STARTUPS_TIMESTAMP,
            setStartups as (data: never[]) => void,
            fetchStartups,
          ),
        );
      }
      await Promise.all(tasks);
      setIsLoading(false);
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const tasks: Promise<void>[] = [];
      if (dataset === 'players' || dataset === 'both') tasks.push(fetchPlayers());
      if (dataset === 'startups' || dataset === 'both') tasks.push(fetchStartups());
      await Promise.all(tasks);
    } finally {
      setIsRefreshing(false);
    }
  }, [dataset, fetchPlayers, fetchStartups]);

  return { players, startups, isLoading, isRefreshing, refresh };
}
