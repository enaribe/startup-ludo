/**
 * Social Store - Gestion des relations follow/unfollow
 *
 * Note: on utilise Record<string, boolean> au lieu de Set<string>
 * car Immer ne supporte pas Set sans le plugin MapSet.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getFollowCounts,
  searchUsers,
  type SocialUser,
} from '@/services/firebase/socialService';

interface SocialStoreState {
  following: SocialUser[];
  followers: SocialUser[];
  followingIds: Record<string, boolean>;
  followCounts: { followersCount: number; followingCount: number };
  searchResults: SocialUser[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
}

interface SocialStoreActions {
  loadFollowing: (userId: string) => Promise<void>;
  loadFollowers: (userId: string) => Promise<void>;
  loadFollowCounts: (userId: string) => Promise<void>;
  toggleFollow: (currentUserId: string, targetUserId: string) => Promise<void>;
  isFollowed: (userId: string) => boolean;
  searchUsers: (queryStr: string) => Promise<void>;
  clearSearch: () => void;
  reset: () => void;
}

const initialState: SocialStoreState = {
  following: [],
  followers: [],
  followingIds: {},
  followCounts: { followersCount: 0, followingCount: 0 },
  searchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,
};

/** Évite double tap / double appel concurrent sur le même couple (follow/unfollow). */
const toggleFollowInFlight = new Set<string>();

export const useSocialStore = create<SocialStoreState & SocialStoreActions>()(
  immer((set, get) => ({
    ...initialState,

    loadFollowing: async (userId) => {
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const users = await getFollowing(userId);
        const ids: Record<string, boolean> = {};
        users.forEach((u) => { ids[u.id] = true; });
        set((state) => {
          state.following = users;
          state.followingIds = ids;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = error instanceof Error ? error.message : 'Erreur inconnue';
        });
      }
    },

    loadFollowers: async (userId) => {
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const users = await getFollowers(userId);
        set((state) => {
          state.followers = users;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = error instanceof Error ? error.message : 'Erreur inconnue';
        });
      }
    },

    loadFollowCounts: async (userId) => {
      try {
        const counts = await getFollowCounts(userId);
        set((state) => { state.followCounts = counts; });
      } catch {
        // silencieux
      }
    },

    toggleFollow: async (currentUserId, targetUserId) => {
      const flightKey = `${currentUserId}_${targetUserId}`;
      if (toggleFollowInFlight.has(flightKey)) return;
      toggleFollowInFlight.add(flightKey);
      try {
        const isCurrentlyFollowed = !!get().followingIds[targetUserId];

        // Update optimiste
        set((state) => {
          if (isCurrentlyFollowed) {
            delete state.followingIds[targetUserId];
            state.following = state.following.filter((u) => u.id !== targetUserId);
            state.followCounts.followingCount = Math.max(0, state.followCounts.followingCount - 1);
          } else {
            state.followingIds[targetUserId] = true;
            state.followCounts.followingCount += 1;
          }
        });

        try {
          if (isCurrentlyFollowed) {
            await unfollowUser(currentUserId, targetUserId);
          } else {
            await followUser(currentUserId, targetUserId);
            // Recharger la liste following pour avoir les données complètes du profil
            const users = await getFollowing(currentUserId);
            const ids: Record<string, boolean> = {};
            users.forEach((u) => { ids[u.id] = true; });
            set((state) => {
              state.following = users;
              state.followingIds = ids;
            });
          }
          // Mettre à jour les compteurs depuis Firebase
          const counts = await getFollowCounts(currentUserId);
          set((state) => { state.followCounts = counts; });
        } catch (error) {
          // Revert en cas d'erreur
          set((state) => {
            if (isCurrentlyFollowed) {
              state.followingIds[targetUserId] = true;
              state.followCounts.followingCount += 1;
            } else {
              delete state.followingIds[targetUserId];
              state.following = state.following.filter((u) => u.id !== targetUserId);
              state.followCounts.followingCount = Math.max(0, state.followCounts.followingCount - 1);
            }
            state.error = error instanceof Error ? error.message : 'Erreur lors du suivi';
          });
        }
      } finally {
        toggleFollowInFlight.delete(flightKey);
      }
    },

    isFollowed: (userId) => !!get().followingIds[userId],

    searchUsers: async (queryStr) => {
      if (!queryStr.trim()) {
        set((state) => { state.searchResults = []; });
        return;
      }
      set((state) => { state.isSearching = true; });
      try {
        const results = await searchUsers(queryStr);
        set((state) => {
          state.searchResults = results;
          state.isSearching = false;
        });
      } catch {
        set((state) => { state.isSearching = false; });
      }
    },

    clearSearch: () => set((state) => { state.searchResults = []; }),

    reset: () => set(initialState),
  }))
);
