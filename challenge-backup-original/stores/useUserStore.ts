import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserProfile, Startup } from '@/types';
import { getUserProfile } from '@/services/firebase/firestore';
import {
  getRankFromXP,
  getLevelFromXP,
  checkRankUp,
  getXPForNextRank,
  getRankProgress,
  type RankInfo,
} from '@/config/progression';

interface UserStoreState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  // Computed values from progression system
  rankInfo: RankInfo | null;
  levelProgress: { level: number; currentXP: number; xpForNext: number } | null;
  rankProgress: number;
  nextRankInfo: { nextRank: RankInfo | null; xpNeeded: number } | null;
}

interface UserStoreActions {
  // Profile management
  setProfile: (profile: UserProfile | null) => void;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // XP and Rank (using new progression system)
  addXP: (amount: number) => RankInfo | null; // Returns new rank if rank up occurred
  getTotalXP: () => number;
  refreshProgressionInfo: () => void;

  // Statistics
  incrementGamesPlayed: () => void;
  incrementGamesWon: () => void;
  addTokensEarned: (amount: number) => void;

  // Startups
  addStartup: (startup: Startup) => void;
  updateStartup: (startupId: string, updates: Partial<Startup>) => void;
  removeStartup: (startupId: string) => void;

  // Achievements
  addAchievement: (achievementId: string) => void;
  hasAchievement: (achievementId: string) => boolean;
  getUnlockedAchievements: () => string[];

  // State management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type UserStore = UserStoreState & UserStoreActions;

const initialState: UserStoreState = {
  profile: null,
  isLoading: false,
  error: null,
  rankInfo: null,
  levelProgress: null,
  rankProgress: 0,
  nextRankInfo: null,
};

export const useUserStore = create<UserStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      setProfile: (profile) => {
        set((state) => {
          state.profile = profile;
          state.isLoading = false;
        });
        // Refresh progression info when profile is set
        get().refreshProgressionInfo();
      },

      loadProfile: async (userId) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const profile = await getUserProfile(userId);
          if (profile) {
            get().setProfile(profile);
          }
        } catch (error) {
          set((state) => {
            state.error =
              error instanceof Error ? error.message : 'Erreur de chargement du profil';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      updateProfile: async (updates) => {
        const { profile } = get();
        if (!profile) return;

        set((state) => {
          state.isLoading = true;
        });

        try {
          // TODO: Implement Firestore profile update
          set((state) => {
            if (state.profile) {
              Object.assign(state.profile, updates);
            }
          });
        } catch (error) {
          set((state) => {
            state.error =
              error instanceof Error ? error.message : 'Erreur de mise à jour du profil';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      addXP: (amount) => {
        const { profile } = get();
        if (!profile) return null;

        const oldXP = profile.xp;
        const newXP = oldXP + amount;

        set((state) => {
          if (state.profile) {
            state.profile.xp = newXP;

            // Update level using new system
            const levelInfo = getLevelFromXP(newXP);
            state.profile.level = levelInfo.level;

            // Update rank using new system
            const rankInfo = getRankFromXP(newXP);
            state.profile.rank = rankInfo.id;
          }
        });

        // Check for rank up
        const rankUp = checkRankUp(oldXP, newXP);

        // Refresh all progression info
        get().refreshProgressionInfo();

        return rankUp;
      },

      getTotalXP: () => {
        const { profile } = get();
        return profile?.xp ?? 0;
      },

      refreshProgressionInfo: () => {
        const { profile } = get();
        if (!profile) {
          set((state) => {
            state.rankInfo = null;
            state.levelProgress = null;
            state.rankProgress = 0;
            state.nextRankInfo = null;
          });
          return;
        }

        const totalXP = profile.xp;
        const rankInfo = getRankFromXP(totalXP);
        const levelProgress = getLevelFromXP(totalXP);
        const rankProgressValue = getRankProgress(totalXP);
        const nextRankInfo = getXPForNextRank(totalXP);

        set((state) => {
          state.rankInfo = rankInfo;
          state.levelProgress = levelProgress;
          state.rankProgress = rankProgressValue;
          state.nextRankInfo = nextRankInfo;
        });
      },

      incrementGamesPlayed: () => {
        set((state) => {
          if (state.profile) {
            state.profile.gamesPlayed += 1;
          }
        });
      },

      incrementGamesWon: () => {
        set((state) => {
          if (state.profile) {
            state.profile.gamesWon += 1;
          }
        });
      },

      addTokensEarned: (amount) => {
        set((state) => {
          if (state.profile) {
            state.profile.totalTokensEarned += amount;
          }
        });
      },

      addStartup: (startup) => {
        set((state) => {
          if (state.profile) {
            state.profile.startups.push(startup);
          }
        });
      },

      updateStartup: (startupId, updates) => {
        set((state) => {
          if (state.profile) {
            const startupIndex = state.profile.startups.findIndex(
              (s) => s.id === startupId
            );
            if (startupIndex !== -1) {
              const startup = state.profile.startups[startupIndex];
              if (startup) {
                Object.assign(startup, updates);
              }
            }
          }
        });
      },

      removeStartup: (startupId) => {
        set((state) => {
          if (state.profile) {
            state.profile.startups = state.profile.startups.filter(
              (s) => s.id !== startupId
            );
          }
        });
      },

      addAchievement: (achievementId) => {
        set((state) => {
          if (state.profile && !state.profile.achievements.includes(achievementId)) {
            state.profile.achievements.push(achievementId);
          }
        });
      },

      hasAchievement: (achievementId) => {
        const { profile } = get();
        return profile?.achievements.includes(achievementId) ?? false;
      },

      getUnlockedAchievements: () => {
        const { profile } = get();
        return profile?.achievements ?? [];
      },

      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      reset: () => {
        set(() => initialState);
      },
    }))
  )
);
