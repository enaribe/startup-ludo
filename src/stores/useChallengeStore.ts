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
import { setChallengeEnrollment } from '@/services/firebase/firestore';
import type {
  Challenge,
  ChallengeEnrollment,
  ChallengeDeliverables,
  EnrollmentFormData,
  EnrollmentStatus,
  ChampionStatus,
} from '@/types/challenge';

interface ChallengeStoreState {
  challenges: Challenge[];
  enrollments: ChallengeEnrollment[];
  activeChallengeId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ChallengeStoreActions {
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
  getChallengeById: (id: string) => Challenge | undefined;
  getActiveChallenge: () => Challenge | null;
  enrollInChallenge: (challengeId: string, userId: string, formData?: EnrollmentFormData) => ChallengeEnrollment;
  submitEnrollmentForm: (enrollmentId: string, formData: EnrollmentFormData) => void;
  getEnrollmentForChallenge: (challengeId: string) => ChallengeEnrollment | undefined;
  getActiveEnrollment: () => ChallengeEnrollment | null;
  getUserEnrollments: (userId: string) => ChallengeEnrollment[];
  setEnrollments: (enrollments: ChallengeEnrollment[]) => void;
  setActiveChallenge: (challengeId: string | null) => void;
  updateEnrollmentStatus: (enrollmentId: string, status: EnrollmentStatus) => void;
  addXp: (enrollmentId: string, amount: number) => void;
  setCurrentLevel: (enrollmentId: string, level: number) => void;
  setCurrentSubLevel: (enrollmentId: string, subLevel: number) => void;
  checkAndUnlockNextLevel: (enrollmentId: string) => boolean;
  checkAndUnlockNextSubLevel: (enrollmentId: string) => boolean;
  selectSector: (enrollmentId: string, sectorId: string) => void;
  savePitch: (enrollmentId: string, pitch: NonNullable<ChallengeDeliverables['pitch']>) => void;
  saveBusinessPlan: (
    enrollmentId: string,
    type: 'simple' | 'full',
    content: Record<string, string>,
    document: string,
    certificate?: string
  ) => void;
  setChampionStatus: (enrollmentId: string, status: ChampionStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: ChallengeStoreState = {
  challenges: [],
  enrollments: [],
  activeChallengeId: null,
  isLoading: false,
  error: null,
};

export const useChallengeStore = create<ChallengeStoreState & ChallengeStoreActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setChallenges: (challenges) => set((state) => { state.challenges = challenges; }),
      addChallenge: (challenge) =>
        set((state) => {
          if (!state.challenges.some((c) => c.id === challenge.id)) state.challenges.push(challenge);
        }),
      getChallengeById: (id) => get().challenges.find((c) => c.id === id),
      getActiveChallenge: () => {
        const id = get().activeChallengeId;
        return id ? get().challenges.find((c) => c.id === id) ?? null : null;
      },

      enrollInChallenge: (challengeId, userId, formData) => {
        const existing = get().enrollments.find((e) => e.challengeId === challengeId && e.userId === userId);
        if (existing) return existing;
        const newEnrollment: ChallengeEnrollment = {
          id: `enrollment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          challengeId,
          userId,
          currentLevel: 1,
          currentSubLevel: 1,
          totalXp: 0,
          xpByLevel: { 1: 0, 2: 0, 3: 0, 4: 0 },
          selectedSectorId: null,
          deliverables: {},
          formData: formData ?? null,
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
        if (userId) {
          setChallengeEnrollment(newEnrollment).catch(() => {
            get().setError('Impossible de synchroniser l\'inscription.');
          });
        }
        return newEnrollment;
      },

      submitEnrollmentForm: (enrollmentId, formData) => {
        const enrollment = get().enrollments.find((e) => e.id === enrollmentId);
        if (!enrollment) return;
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) e.formData = formData;
        });
        const updated = get().enrollments.find((e) => e.id === enrollmentId);
        if (updated && enrollment.userId) {
          setChallengeEnrollment(updated).catch(() => {
            get().setError('Impossible de synchroniser le formulaire.');
          });
        }
      },

      getEnrollmentForChallenge: (challengeId) =>
        get().enrollments.find((e) => e.challengeId === challengeId),
      getActiveEnrollment: () => {
        const id = get().activeChallengeId;
        return id ? get().enrollments.find((e) => e.challengeId === id) ?? null : null;
      },
      getUserEnrollments: (userId) => get().enrollments.filter((e) => e.userId === userId),
      setEnrollments: (enrollments) =>
        set((state) => {
          state.enrollments = enrollments;
        }),
      setActiveChallenge: (challengeId) =>
        set((state) => {
          state.activeChallengeId = challengeId;
          if (challengeId) {
            const e = state.enrollments.find((x) => x.challengeId === challengeId);
            if (e) e.lastPlayedAt = Date.now();
          }
        }),
      updateEnrollmentStatus: (enrollmentId, status) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) {
            e.status = status;
            if (status === 'completed') e.completedAt = Date.now();
          }
        }),

      addXp: (enrollmentId, amount) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) {
            e.totalXp += amount;
            e.xpByLevel[e.currentLevel] = (e.xpByLevel[e.currentLevel] ?? 0) + amount;
            e.lastPlayedAt = Date.now();
          }
        }),
      setCurrentLevel: (enrollmentId, level) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) {
            e.currentLevel = level;
            e.currentSubLevel = 1;
            e.lastPlayedAt = Date.now();
          }
        }),
      setCurrentSubLevel: (enrollmentId, subLevel) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) {
            e.currentSubLevel = subLevel;
            e.lastPlayedAt = Date.now();
          }
        }),

      checkAndUnlockNextLevel: (enrollmentId) => {
        const enrollment = get().enrollments.find((e) => e.id === enrollmentId);
        if (!enrollment) return false;
        const challenge = get().challenges.find((c) => c.id === enrollment.challengeId);
        if (!challenge) return false;
        const level = challenge.levels.find((l) => l.number === enrollment.currentLevel);
        if (!level) return false;
        const xpInLevel = enrollment.xpByLevel[enrollment.currentLevel] ?? 0;
        if (xpInLevel < level.xpRequired || enrollment.currentSubLevel < level.subLevels.length) return false;
        const nextLevel = enrollment.currentLevel + 1;
        if (nextLevel <= challenge.totalLevels) {
          get().setCurrentLevel(enrollmentId, nextLevel);
          return true;
        }
        get().updateEnrollmentStatus(enrollmentId, 'completed');
        return true;
      },

      checkAndUnlockNextSubLevel: (enrollmentId) => {
        const enrollment = get().enrollments.find((e) => e.id === enrollmentId);
        if (!enrollment) return false;
        const challenge = get().challenges.find((c) => c.id === enrollment.challengeId);
        if (!challenge) return false;
        const level = challenge.levels.find((l) => l.number === enrollment.currentLevel);
        if (!level) return false;
        const sub = level.subLevels.find((s) => s.number === enrollment.currentSubLevel);
        if (!sub) return false;
        const xpInLevel = enrollment.xpByLevel[enrollment.currentLevel] ?? 0;
        if (xpInLevel < sub.xpRequired) return false;
        const nextSub = enrollment.currentSubLevel + 1;
        if (nextSub <= level.subLevels.length) {
          get().setCurrentSubLevel(enrollmentId, nextSub);
          return true;
        }
        return false;
      },

      selectSector: (enrollmentId, sectorId) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) {
            e.selectedSectorId = sectorId;
            e.deliverables.sectorChoice = { sectorId, completedAt: Date.now() };
            e.currentLevel = 2;
            e.currentSubLevel = 1;
            e.lastPlayedAt = Date.now();
          }
        }),

      savePitch: (enrollmentId, pitch) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) {
            e.deliverables.pitch = { ...pitch, completedAt: Date.now() };
            e.currentLevel = 3;
            e.currentSubLevel = 1;
            e.lastPlayedAt = Date.now();
          }
        }),

      saveBusinessPlan: (enrollmentId, type, content, document, certificate) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) {
            if (type === 'simple') {
              e.deliverables.businessPlanSimple = { content, generatedDocument: document, completedAt: Date.now() };
              e.currentLevel = 4;
              e.currentSubLevel = 1;
            } else {
              e.deliverables.businessPlanFull = {
                content,
                generatedDocument: document,
                certificate: certificate ?? '',
                completedAt: Date.now(),
              };
            }
            e.lastPlayedAt = Date.now();
          }
        }),

      setChampionStatus: (enrollmentId, status) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) e.championStatus = status;
        }),

      setLoading: (loading) => set((state) => { state.isLoading = loading; }),
      setError: (error) => set((state) => { state.error = error; }),
      reset: () => set(initialState),
    })),
    {
      name: 'challenge-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ challenges: state.challenges, enrollments: state.enrollments, activeChallengeId: state.activeChallengeId }),
    }
  )
);

export const selectActiveChallenge = (state: ChallengeStoreState & ChallengeStoreActions) =>
  state.getActiveChallenge();
export const selectActiveEnrollment = (state: ChallengeStoreState & ChallengeStoreActions) =>
  state.getActiveEnrollment();
export const selectIsEnrolled = (challengeId: string) => (state: ChallengeStoreState) =>
  state.enrollments.some((e) => e.challengeId === challengeId);
