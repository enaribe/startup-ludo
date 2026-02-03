/**
 * Store Challenge - Programmes d'accompagnement
 * Persist: enrollments + activeChallengeId (AsyncStorage)
 * Challenges chargés depuis les données au mount du layout
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Challenge, ChallengeEnrollment } from '@/types/challenge';

interface PitchData {
  problem: string;
  solution: string;
  target: string;
  viability: string;
  impact: string;
  generatedDocument: string;
}

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
  getActiveChallenge: () => Challenge | undefined;

  enrollInChallenge: (challengeId: string, userId: string) => ChallengeEnrollment;
  getEnrollmentForChallenge: (challengeId: string) => ChallengeEnrollment | undefined;
  getActiveEnrollment: () => ChallengeEnrollment | undefined;
  getUserEnrollments: (userId: string) => ChallengeEnrollment[];
  setActiveChallenge: (challengeId: string | null) => void;
  updateEnrollmentStatus: (enrollmentId: string, status: ChallengeEnrollment['status']) => void;

  addXp: (enrollmentId: string, amount: number) => void;
  setCurrentLevel: (enrollmentId: string, level: number) => void;
  setCurrentSubLevel: (enrollmentId: string, subLevel: number) => void;
  checkAndUnlockNextLevel: (enrollmentId: string) => void;
  checkAndUnlockNextSubLevel: (enrollmentId: string) => void;

  selectSector: (enrollmentId: string, sectorId: string) => void;
  savePitch: (enrollmentId: string, pitch: PitchData) => void;
  saveBusinessPlan: (
    enrollmentId: string,
    type: 'simple' | 'full',
    content: Record<string, string>,
    document: string,
    certificate?: string
  ) => void;
  setChampionStatus: (enrollmentId: string, status: 'local' | 'regional' | 'national') => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type ChallengeStore = ChallengeStoreState & ChallengeStoreActions;

function generateEnrollmentId(): string {
  return `enrollment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const initialState: ChallengeStoreState = {
  challenges: [],
  enrollments: [],
  activeChallengeId: null,
  isLoading: false,
  error: null,
};

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setChallenges: (challenges) => set((state) => { state.challenges = challenges; }),
      addChallenge: (challenge) =>
        set((state) => {
          if (!state.challenges.some((c) => c.id === challenge.id)) {
            state.challenges.push(challenge);
          }
        }),
      getChallengeById: (id) => get().challenges.find((c) => c.id === id),
      getActiveChallenge: () => {
        const id = get().activeChallengeId;
        return id ? get().getChallengeById(id) : undefined;
      },

      enrollInChallenge: (challengeId, userId) => {
        const challenge = get().getChallengeById(challengeId);
        if (!challenge) throw new Error('Challenge not found');
        const existing = get().getEnrollmentForChallenge(challengeId);
        if (existing) return existing;

        const enrollment: ChallengeEnrollment = {
          id: generateEnrollmentId(),
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
        set((state) => { state.enrollments.push(enrollment); });
        return enrollment;
      },
      getEnrollmentForChallenge: (challengeId) =>
        get().enrollments.find((e) => e.challengeId === challengeId),
      getActiveEnrollment: () => {
        const id = get().activeChallengeId;
        return id ? get().getEnrollmentForChallenge(id) : undefined;
      },
      getUserEnrollments: (userId) =>
        get().enrollments.filter((e) => e.userId === userId),
      setActiveChallenge: (challengeId) =>
        set((state) => { state.activeChallengeId = challengeId; }),
      updateEnrollmentStatus: (enrollmentId, status) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) e.status = status;
          if (status === 'completed') {
            const e2 = state.enrollments.find((x) => x.id === enrollmentId);
            if (e2) e2.completedAt = Date.now();
          }
        }),

      addXp: (enrollmentId, amount) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (!e) return;
          e.totalXp += amount;
          const level = e.currentLevel;
          e.xpByLevel[level] = (e.xpByLevel[level] ?? 0) + amount;
          e.lastPlayedAt = Date.now();
        }),
      setCurrentLevel: (enrollmentId, level) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) {
            e.currentLevel = level;
            e.currentSubLevel = 1;
          }
        }),
      setCurrentSubLevel: (enrollmentId, subLevel) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) e.currentSubLevel = subLevel;
        }),
      checkAndUnlockNextSubLevel: (enrollmentId) => {
        const e = get().enrollments.find((x) => x.id === enrollmentId);
        if (!e) return;
        const challenge = get().getChallengeById(e.challengeId);
        if (!challenge) return;
        const level = challenge.levels.find((l) => l.number === e.currentLevel);
        if (!level) return;
        const sub = level.subLevels.find((s) => s.number === e.currentSubLevel);
        if (!sub) return;
        const xpInLevel = e.xpByLevel[e.currentLevel] ?? 0;
        if (xpInLevel >= sub.xpRequired && e.currentSubLevel < level.subLevels.length) {
          get().setCurrentSubLevel(enrollmentId, e.currentSubLevel + 1);
        }
      },
      checkAndUnlockNextLevel: (enrollmentId) => {
        const e = get().enrollments.find((x) => x.id === enrollmentId);
        if (!e) return;
        const challenge = get().getChallengeById(e.challengeId);
        if (!challenge) return;
        const level = challenge.levels.find((l) => l.number === e.currentLevel);
        if (!level) return;
        const xpInLevel = e.xpByLevel[e.currentLevel] ?? 0;
        if (xpInLevel >= level.xpRequired) {
          if (e.currentLevel >= challenge.totalLevels) {
            get().updateEnrollmentStatus(enrollmentId, 'completed');
          } else {
            get().setCurrentLevel(enrollmentId, e.currentLevel + 1);
          }
        }
      },

      selectSector: (enrollmentId, sectorId) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (!e) return;
          e.selectedSectorId = sectorId;
          e.deliverables.sectorChoice = { sectorId, completedAt: Date.now() };
          e.currentLevel = 2;
          e.currentSubLevel = 1;
        }),
      savePitch: (enrollmentId, pitch) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (!e) return;
          e.deliverables.pitch = {
            ...pitch,
            completedAt: Date.now(),
          };
          e.currentLevel = 3;
          e.currentSubLevel = 1;
        }),
      saveBusinessPlan: (enrollmentId, type, content, document, certificate) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (!e) return;
          if (type === 'simple') {
            e.deliverables.businessPlanSimple = {
              content,
              generatedDocument: document,
              completedAt: Date.now(),
            };
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
        }),
      setChampionStatus: (enrollmentId, status) =>
        set((state) => {
          const e = state.enrollments.find((x) => x.id === enrollmentId);
          if (e) e.championStatus = status;
        }),

      setLoading: (isLoading) => set((state) => { state.isLoading = isLoading; }),
      setError: (error) => set((state) => { state.error = error; }),
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

export const selectActiveChallenge = (state: ChallengeStore): Challenge | undefined =>
  state.activeChallengeId ? state.getChallengeById(state.activeChallengeId) : undefined;

export const selectActiveEnrollment = (state: ChallengeStore): ChallengeEnrollment | undefined =>
  state.getActiveEnrollment();

export const selectIsEnrolled = (challengeId: string) => (state: ChallengeStore): boolean =>
  state.enrollments.some((e) => e.challengeId === challengeId);
