/**
 * Cache Helper - AsyncStorage persistence for Firestore data
 *
 * Pattern: cache for instant display, always sync with Firestore.
 *
 * Usage:
 *   await cachedFetch('editions', fetchFromFirestore, (data) => { EDITIONS = data; });
 *   → If cache exists: apply instantly, then fetch Firestore to detect changes.
 *   → If no cache: fetch Firestore, save to AsyncStorage.
 *   → Deletions in Firestore are reflected (empty data = deletion).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseLog } from './config';

const CACHE_PREFIX = '@firestore_cache_';

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

/**
 * Load cached data from AsyncStorage.
 * Returns null if no cache exists.
 */
export async function loadFromCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

/**
 * Save data to AsyncStorage cache.
 */
export async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, fetchedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    firebaseLog(`Cache save failed for ${key}`, error);
  }
}

/**
 * Fetch data with AsyncStorage caching.
 *
 * 1. If cache exists → apply immediately for instant display
 * 2. Always fetch Firestore to detect changes (additions AND deletions)
 * 3. If Firestore succeeds → update cache + apply fresh data
 * 4. If Firestore fails → keep cached data (already applied)
 * 5. If no cache and Firestore fails → throw (caller uses local fallback)
 *
 * @param key - Cache key (e.g. 'editions', 'challenges')
 * @param fetcher - Function that fetches from Firestore
 * @param onUpdate - Called when data is loaded (to update mutable exports)
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  onUpdate: (data: T) => void,
): Promise<void> {
  const cached = await loadFromCache<T>(key);

  if (cached) {
    // Apply cached data immediately for instant display
    onUpdate(cached.data);
    firebaseLog(`[Cache] ${key}: loaded from AsyncStorage`);
  } else {
    firebaseLog(`[Cache] ${key}: no cache`);
  }

  // Always fetch Firestore to detect changes (additions + deletions)
  try {
    const fresh = await fetcher();
    onUpdate(fresh);
    await saveToCache(key, fresh);
    firebaseLog(`[Cache] ${key}: synced from Firestore and cached`);
  } catch (error) {
    if (!cached) {
      // No cache and fetch failed — caller uses local fallback
      firebaseLog(`[Cache] ${key}: Firestore fetch failed, no cache available`, error);
      throw error;
    }
    // Cache exists but fetch failed — keep using cached data (already applied above)
    firebaseLog(`[Cache] ${key}: Firestore fetch failed, using cached data`, error);
  }
}

/**
 * Clear a specific cache entry.
 */
export async function clearCache(key: string): Promise<void> {
  await AsyncStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Clear all Firestore caches.
 */
export async function clearAllCaches(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  if (cacheKeys.length > 0) {
    await AsyncStorage.multiRemove(cacheKeys);
  }
}
