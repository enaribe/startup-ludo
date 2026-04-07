import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLeaderboard, getAllStartups } from '@/services/firebase/firestore';
import type { Startup } from '@/types';

const CACHE_KEYS = {
  PLAYERS: '@leaderboard_players_v2',
  STARTUPS: '@leaderboard_startups_v2',
  PLAYERS_TIMESTAMP: '@leaderboard_players_ts_v2',
  STARTUPS_TIMESTAMP: '@leaderboard_startups_ts_v2',
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  xp: number;
  level: number;
  gamesWon: number;
  avatarUrl?: string | null;
}

// Cache mémoire : survit aux remontages de composant sans repasser par AsyncStorage
type MemCache = {
  players: LeaderboardEntry[];
  startups: Startup[];
  playersTs: number;
  startupsTs: number;
} | null;
let _memCache: MemCache = null;

export function useLeaderboardCache() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>(_memCache?.players ?? []);
  const [startups, setStartups] = useState<Startup[]>(_memCache?.startups ?? []);
  const [isLoading, setIsLoading] = useState(_memCache === null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const persistCache = useCallback(async (
    playersData?: LeaderboardEntry[],
    startupsData?: Startup[]
  ) => {
    try {
      const now = Date.now();
      const promises: Promise<void>[] = [];
      if (playersData) {
        promises.push(
          AsyncStorage.setItem(CACHE_KEYS.PLAYERS, JSON.stringify(playersData)),
          AsyncStorage.setItem(CACHE_KEYS.PLAYERS_TIMESTAMP, now.toString())
        );
      }
      if (startupsData) {
        promises.push(
          AsyncStorage.setItem(CACHE_KEYS.STARTUPS, JSON.stringify(startupsData)),
          AsyncStorage.setItem(CACHE_KEYS.STARTUPS_TIMESTAMP, now.toString())
        );
      }
      await Promise.all(promises);
    } catch {
      // non-bloquant
    }
  }, []);

  const fetchFromFirestore = useCallback(async (isManualRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManualRefresh) setIsRefreshing(true);

    try {
      const [entries, startupsData] = await Promise.all([
        getLeaderboard('allTime', 100),
        getAllStartups(100),
      ]);

      const now = Date.now();
      _memCache = { players: entries, startups: startupsData, playersTs: now, startupsTs: now };

      setPlayers(entries);
      setStartups(startupsData);
      void persistCache(entries, startupsData);
    } catch {
      // silencieux — on garde l'état actuel
    } finally {
      isFetchingRef.current = false;
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [persistCache]);

  useEffect(() => {
    // Si le cache mémoire est encore frais, pas de chargement initial
    if (_memCache) {
      const now = Date.now();
      const fresh =
        now - _memCache.playersTs < CACHE_DURATION &&
        now - _memCache.startupsTs < CACHE_DURATION;
      if (fresh) {
        setIsLoading(false);
        // Rafraîchissement silencieux en arrière-plan
        void fetchFromFirestore(false);
        return;
      }
    }

    const init = async () => {
      try {
        const [cachedPlayers, cachedStartups, playersTs, startupsTs] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEYS.PLAYERS),
          AsyncStorage.getItem(CACHE_KEYS.STARTUPS),
          AsyncStorage.getItem(CACHE_KEYS.PLAYERS_TIMESTAMP),
          AsyncStorage.getItem(CACHE_KEYS.STARTUPS_TIMESTAMP),
        ]);

        const now = Date.now();
        let playersFromCache = false;
        let startupsFromCache = false;
        let parsedPlayers: LeaderboardEntry[] | undefined;
        let parsedStartups: Startup[] | undefined;

        if (cachedPlayers && playersTs && now - parseInt(playersTs, 10) < CACHE_DURATION) {
          parsedPlayers = JSON.parse(cachedPlayers) as LeaderboardEntry[];
          setPlayers(parsedPlayers);
          playersFromCache = true;
        }

        if (cachedStartups && startupsTs && now - parseInt(startupsTs, 10) < CACHE_DURATION) {
          parsedStartups = JSON.parse(cachedStartups) as Startup[];
          setStartups(parsedStartups);
          startupsFromCache = true;
        }

        if (playersFromCache && startupsFromCache && parsedPlayers && parsedStartups) {
          // Peupler le cache mémoire depuis AsyncStorage
          _memCache = {
            players: parsedPlayers,
            startups: parsedStartups,
            playersTs: parseInt(playersTs!, 10),
            startupsTs: parseInt(startupsTs!, 10),
          };
          setIsLoading(false);
          // Rafraîchissement silencieux en arrière-plan
          void fetchFromFirestore(false);
        } else {
          await fetchFromFirestore(false);
        }
      } catch {
        await fetchFromFirestore(false);
      }
    };

    void init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    await fetchFromFirestore(true);
  }, [fetchFromFirestore]);

  return { players, startups, isLoading, isRefreshing, refresh };
}
