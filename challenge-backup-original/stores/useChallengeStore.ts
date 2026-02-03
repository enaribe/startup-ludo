/**
 * Challenge Store - Gestion des programmes d'accompagnement
 *
 * Gère:
 * - Liste des Challenges disponibles
 * - Inscriptions de l'utilisateur (enrollments)
 * - Challenge actif sélectionné
 * - Progression (XP, niveaux, sous-niveaux)
 * - Livrables (secteur, pitch, business plan)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Challenge,
  ChallengeEnrollment,
  ChallengeDeliverables,
  EnrollmentStatus,
  ChampionStatus,
} from '@/types/challenge';

// ===== STATE =====

interface ChallengeStoreState {
  // Données
  challenges: Challenge[];
  enrollments: ChallengeEnrollment[];
  activeChallengeId: string | null;

  // UI
  isLoading: boolean;
  error: string | null;
}

// ===== ACTIONS =====

interface ChallengeStoreActions {
  // Challenges
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
  getChallengeById: (id: string) => Challenge | undefined;
  getActiveChallenge: () => Challenge | null;

  // Enrollments
  enrollInChallenge: (challengeId: string, userId: string) => ChallengeEnrollment;
  getEnrollmentForChallenge: (challengeId: string) => ChallengeEnrollment | undefined;
  getActiveEnrollment: () => ChallengeEnrollment | null;
  getUserEnrollments: (userId: string) => ChallengeEnrollment[];
  setActiveChallenge: (challengeId: string | null) => void;
  updateEnrollmentStatus: (enrollmentId: string, status: EnrollmentStatus) => void;

  // Progression
  addXp: (enrollmentId: string, amount: number) => void;
  setCurrentLevel: (enrollmentId: string, level: number) => void;
  setCurrentSubLevel: (enrollmentId: string, subLevel: number) => void;
  checkAndUnlockNextLevel: (enrollmentId: string) => boolean;
  checkAndUnlockNextSubLevel: (enrollmentId: string) => boolean;

  // Secteur
  selectSector: (enrollmentId: string, sectorId: string) => void;

  // Livrables
  savePitch: (enrollmentId: string, pitch: NonNullable<ChallengeDeliverables['pitch']>) => void;
  saveBusinessPlan: (
    enrollmentId: string,
    type: 'simple' | 'full',
    content: Record<string, string>,
    document: string
  ) => void;
  setChampionStatus: (enrollmentId: string, status: ChampionStatus) => void;

  // Utils
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ===== INITIAL STATE =====

const initialState: ChallengeStoreState = {
  challenges: [],
  enrollments: [],
  activeChallengeId: null,
  isLoading: false,
  error: null,
};

// ===== STORE =====

export const useChallengeStore = create<ChallengeStoreState & ChallengeStoreActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // ===== CHALLENGES =====

      setChallenges: (challenges) => {
        set((state) => {
          state.challenges = challenges;
        });
      },

      addChallenge: (challenge) => {
        set((state) => {
          const exists = state.challenges.some((c) => c.id === challenge.id);
          if (!exists) {
            state.challenges.push(challenge);
          }
        });
      },

      getChallengeById: (id) => {
        return get().challenges.find((c) => c.id === id);
      },

      getActiveChallenge: () => {
        const { challenges, activeChallengeId } = get();
        if (!activeChallengeId) return null;
        return challenges.find((c) => c.id === activeChallengeId) || null;
      },

      // ===== ENROLLMENTS =====

      enrollInChallenge: (challengeId, userId) => {
        const existing = get().enrollments.find(
          (e) => e.challengeId === challengeId && e.userId === userId
        );
        if (existing) return existing;

        const newEnrollment: ChallengeEnrollment = {
          id: `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          challengeId,
          userId,
          currentLevel: 1,
          currentSubLevel: 1,
          totalXp: 0,
          xpByLevel: { 1: 0, 2: 0, 3: 0, 4: 0 },
          selectedSectorId: null,
          deliverables: {},
          status: 'active',
          championStatus: null,
          enrolledAt: Date.now(),
          lastPlayedAt: Date.now(),
          completedAt: null,
        };

        set((state) => {
          state.enrollments.push(newEnrollment);
          state.activeChallengeId = challengeId;
        });

        return newEnrollment;
      },

      getEnrollmentForChallenge: (challengeId) => {
        return get().enrollments.find((e) => e.challengeId === challengeId);
      },

      getActiveEnrollment: () => {
        const { enrollments, activeChallengeId } = get();
        if (!activeChallengeId) return null;
        return enrollments.find((e) => e.challengeId === activeChallengeId) || null;
      },

      getUserEnrollments: (userId) => {
        return get().enrollments.filter((e) => e.userId === userId);
      },

      setActiveChallenge: (challengeId) => {
        set((state) => {
          state.activeChallengeId = challengeId;
          // Mettre à jour lastPlayedAt
          if (challengeId) {
            const enrollment = state.enrollments.find((e) => e.challengeId === challengeId);
            if (enrollment) {
              enrollment.lastPlayedAt = Date.now();
            }
          }
        });
      },

      updateEnrollmentStatus: (enrollmentId, status) => {
        set((state) => {
          const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
          if (enrollment) {
            enrollment.status = status;
            if (status === 'completed') {
              enrollment.completedAt = Date.now();
            }
          }
        });
      },

      // ===== PROGRESSION =====

      addXp: (enrollmentId, amount) => {
        set((state) => {
          const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
          if (enrollment) {
            enrollment.totalXp += amount;
            enrollment.xpByLevel[enrollment.currentLevel] =
              (enrollment.xpByLevel[enrollment.currentLevel] || 0) + amount;
            enrollment.lastPlayedAt = Date.now();
          }
        });
      },

      setCurrentLevel: (enrollmentId, level) => {
        set((state) => {
          const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
          if (enrollment) {
            enrollment.currentLevel = level;
            enrollment.currentSubLevel = 1; // Reset sous-niveau
            enrollment.lastPlayedAt = Date.now();
          }
        });
      },

      setCurrentSubLevel: (enrollmentId, subLevel) => {
        set((state) => {
          const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
          if (enrollment) {
            enrollment.currentSubLevel = subLevel;
            enrollment.lastPlayedAt = Date.now();
          }
        });
      },

      checkAndUnlockNextLevel: (enrollmentId) => {
        const { enrollments, challenges } = get();
        const enrollment = enrollments.find((e) => e.id === enrollmentId);
        if (!enrollment) return false;

        const challenge = challenges.find((c) => c.id === enrollment.challengeId);
        if (!challenge) return false;

        const currentLevel = challenge.levels.find((l) => l.number === enrollment.currentLevel);
        if (!currentLevel) return false;

        const currentLevelXp = enrollment.xpByLevel[enrollment.currentLevel] || 0;

        // Vérifier si tous les sous-niveaux sont complétés et XP suffisant
        if (
          currentLevelXp >= currentLevel.xpRequired &&
          enrollment.currentSubLevel >= currentLevel.subLevels.length
        ) {
          const nextLevel = enrollment.currentLevel + 1;
          if (nextLevel <= challenge.totalLevels) {
            set((state) => {
              const e = state.enrollments.find((en) => en.id === enrollmentId);
              if (e) {
                e.currentLevel = nextLevel;
                e.currentSubLevel = 1;
                e.lastPlayedAt = Date.now();
              }
            });
            return true;
          } else {
            // Challenge complété
            set((state) => {
              const e = state.enrollments.find((en) => en.id === enrollmentId);
              if (e) {
                e.status = 'completed';
                e.completedAt = Date.now();
              }
            });
            return true;
          }
        }
        return false;
      },

      checkAndUnlockNextSubLevel: (enrollmentId) => {
        const { enrollments, challenges } = get();
        const enrollment = enrollments.find((e) => e.id === enrollmentId);
        if (!enrollment) return false;

        const challenge = challenges.find((c) => c.id === enrollment.challengeId);
        if (!challenge) return false;

        const currentLevel = challenge.levels.find((l) => l.number === enrollment.currentLevel);
        if (!currentLevel) return false;

        const currentSubLevel = currentLevel.subLevels.find(
          (sl) => sl.number === enrollment.currentSubLevel
        );
        if (!currentSubLevel) return false;

        const currentLevelXp = enrollment.xpByLevel[enrollment.currentLevel] || 0;

        // Calculer XP requis pour le sous-niveau actuel
        const xpForCurrentSubLevel = currentSubLevel.xpRequired;

        // Vérifier si on peut passer au sous-niveau suivant
        if (currentLevelXp >= xpForCurrentSubLevel) {
          const nextSubLevel = enrollment.currentSubLevel + 1;
          if (nextSubLevel <= currentLevel.subLevels.length) {
            set((state) => {
              const e = state.enrollments.find((en) => en.id === enrollmentId);
              if (e) {
                e.currentSubLevel = nextSubLevel;
                e.lastPlayedAt = Date.now();
              }
            });
            return true;
          }
        }
        return false;
      },

      // ===== SECTEUR =====

      selectSector: (enrollmentId, sectorId) => {
        set((state) => {
          const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
          if (enrollment) {
            enrollment.selectedSectorId = sectorId;
            enrollment.deliverables.sectorChoice = {
              sectorId,
              completedAt: Date.now(),
            };
            enrollment.lastPlayedAt = Date.now();
          }
        });
      },

      // ===== LIVRABLES =====

      savePitch: (enrollmentId, pitch) => {
        set((state) => {
          const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
          if (enrollment) {
            enrollment.deliverables.pitch = pitch;
            enrollment.lastPlayedAt = Date.now();
          }
        });
      },

      saveBusinessPlan: (enrollmentId, type, content, document) => {
        set((state) => {
          const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
          if (enrollment) {
            if (type === 'simple') {
              enrollment.deliverables.businessPlanSimple = {
                content,
                generatedDocument: document,
                completedAt: Date.now(),
              };
            } else {
              enrollment.deliverables.businessPlanFull = {
                content,
                generatedDocument: document,
                certificate: '', // À générer séparément
                completedAt: Date.now(),
              };
            }
            enrollment.lastPlayedAt = Date.now();
          }
        });
      },

      setChampionStatus: (enrollmentId, status) => {
        set((state) => {
          const enrollment = state.enrollments.find((e) => e.id === enrollmentId);
          if (enrollment) {
            enrollment.championStatus = status;
          }
        });
      },

      // ===== UTILS =====

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      reset: () => {
        set(initialState);
      },
    })),
    {
      name: 'challenge-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enrollments: state.enrollments,
        activeChallengeId: state.activeChallengeId,
      }),
    }
  )
);

// ===== SELECTORS =====

/** Sélecteur pour obtenir le Challenge actif */
export const selectActiveChallenge = (state: ChallengeStoreState & ChallengeStoreActions) =>
  state.getActiveChallenge();

/** Sélecteur pour obtenir l'inscription active */
export const selectActiveEnrollment = (state: ChallengeStoreState & ChallengeStoreActions) =>
  state.getActiveEnrollment();

/** Sélecteur pour vérifier si l'utilisateur est inscrit à un Challenge */
export const selectIsEnrolled = (challengeId: string) => (state: ChallengeStoreState) =>
  state.enrollments.some((e) => e.challengeId === challengeId);
