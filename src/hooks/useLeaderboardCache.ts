import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLeaderboard, getAllStartups } from '@/services/firebase/firestore';
import type { Startup } from '@/types';

const CACHE_KEYS = {
  PLAYERS: '@leaderboard_players',
  STARTUPS: '@leaderboard_startups',
  PLAYERS_TIMESTAMP: '@leaderboard_players_timestamp',
  STARTUPS_TIMESTAMP: '@leaderboard_startups_timestamp',
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface LeaderboardEntry {
  id: string;
  displayName: string;
  xp: number;
  level: number;
  gamesWon: number;
  avatarUrl?: string | null;
}

export function useLeaderboardCache() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const saveToCache = useCallback(async (
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
    } catch (error) {
      console.error('[useLeaderboardCache] Failed to save to cache:', error);
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
      setPlayers(entries);
      setStartups(startupsData);
      await saveToCache(entries, startupsData);
    } catch (error) {
      console.error('[useLeaderboardCache] Failed to fetch from Firestore:', error);
    } finally {
      isFetchingRef.current = false;
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [saveToCache]);

  useEffect(() => {
    const init = async () => {
      try {
        const [cachedPlayers, cachedStartups, playersTimestamp, startupsTimestamp] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEYS.PLAYERS),
          AsyncStorage.getItem(CACHE_KEYS.STARTUPS),
          AsyncStorage.getItem(CACHE_KEYS.PLAYERS_TIMESTAMP),
          AsyncStorage.getItem(CACHE_KEYS.STARTUPS_TIMESTAMP),
        ]);

        const now = Date.now();
        let playersFromCache = false;
        let startupsFromCache = false;

        if (cachedPlayers && playersTimestamp) {
          const timestamp = parseInt(playersTimestamp, 10);
          if (now - timestamp < CACHE_DURATION) {
            setPlayers(JSON.parse(cachedPlayers) as LeaderboardEntry[]);
            playersFromCache = true;
          }
        }

        if (cachedStartups && startupsTimestamp) {
          const timestamp = parseInt(startupsTimestamp, 10);
          if (now - timestamp < CACHE_DURATION) {
            setStartups(JSON.parse(cachedStartups) as Startup[]);
            startupsFromCache = true;
          }
        }

        // Si les deux sont en cache valide, afficher immédiatement sans attendre Firestore
        if (playersFromCache && startupsFromCache) {
          setIsLoading(false);
          // Rafraîchir en arrière-plan sans bloquer l'UI
          fetchFromFirestore(false);
        } else {
          // Pas de cache valide : fetch Firestore et attendre
          await fetchFromFirestore(false);
        }
      } catch (error) {
        console.error('[useLeaderboardCache] Init error:', error);
        await fetchFromFirestore(false);
      }
    };

    init();
  }, []);

  const refresh = useCallback(async () => {
    await fetchFromFirestore(true);
  }, [fetchFromFirestore]);

  return {
    players,
    startups,
    isLoading,
    isRefreshing,
    refresh,
  };
}
