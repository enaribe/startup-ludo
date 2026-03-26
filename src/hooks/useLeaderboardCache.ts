import { useCallback, useEffect, useState } from 'react';
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

  // Charger depuis le cache
  const loadFromCache = useCallback(async () => {
    try {
      const [cachedPlayers, cachedStartups, playersTimestamp, startupsTimestamp] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.PLAYERS),
        AsyncStorage.getItem(CACHE_KEYS.STARTUPS),
        AsyncStorage.getItem(CACHE_KEYS.PLAYERS_TIMESTAMP),
        AsyncStorage.getItem(CACHE_KEYS.STARTUPS_TIMESTAMP),
      ]);

      const now = Date.now();

      // Vérifier si le cache est encore valide
      if (cachedPlayers && playersTimestamp) {
        const timestamp = parseInt(playersTimestamp, 10);
        if (now - timestamp < CACHE_DURATION) {
          const parsed = JSON.parse(cachedPlayers) as LeaderboardEntry[];
          setPlayers(parsed);
        }
      }

      if (cachedStartups && startupsTimestamp) {
        const timestamp = parseInt(startupsTimestamp, 10);
        if (now - timestamp < CACHE_DURATION) {
          const parsed = JSON.parse(cachedStartups) as Startup[];
          setStartups(parsed);
        }
      }
    } catch (error) {
      console.error('[useLeaderboardCache] Failed to load from cache:', error);
    }
  }, []);

  // Sauvegarder dans le cache
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

  // Récupérer depuis Firestore
  const fetchFromFirestore = useCallback(async (force = false) => {
    if (!force && isRefreshing) return;

    try {
      setIsRefreshing(true);

      const [entries, startupsData] = await Promise.all([
        getLeaderboard('allTime', 100), // Récupérer plus de joueurs pour avoir de la marge
        getAllStartups(100),
      ]);

      setPlayers(entries);
      setStartups(startupsData);

      // Sauvegarder dans le cache
      await saveToCache(entries, startupsData);
    } catch (error) {
      console.error('[useLeaderboardCache] Failed to fetch from Firestore:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [isRefreshing, saveToCache]);

  // Charger les données au montage
  useEffect(() => {
    const init = async () => {
      // D'abord charger depuis le cache (rapide)
      await loadFromCache();
      // Puis récupérer depuis Firestore si nécessaire
      await fetchFromFirestore();
    };

    init();
  }, []);

  // Fonction de refresh manuel
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
