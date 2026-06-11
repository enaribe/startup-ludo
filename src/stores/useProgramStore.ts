import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import {
  PARTNER_PROGRAMS,
  PROGRAM_PARTNERS,
  getPartnerById,
  getProgramById,
} from '@/data/programs';
import {
  getProgramEnrollmentsForUser,
  getProgramSessionsForUser,
  getRemotePartners,
  getRemotePrograms,
  setProgramEnrollment,
  setProgramSession,
} from '@/services/firebase/programService';
import type {
  PartnerProgram,
  ProgramEnrollment,
  ProgramEnrollmentFormData,
  ProgramPartner,
  ProgramPlayAccess,
  ProgramSession,
} from '@/types/program';
import { createProgramSessionId } from '@/types/program';

interface ProgramStoreState {
  partners: ProgramPartner[];
  programs: PartnerProgram[];
  enrollments: ProgramEnrollment[];
  sessions: ProgramSession[];
  activeProgramId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ProgramStoreActions {
  setPartners: (partners: ProgramPartner[]) => void;
  setPrograms: (programs: PartnerProgram[]) => void;
  loadCatalog: () => Promise<void>;
  loadUserProgramData: (userId: string) => Promise<void>;
  getPartnerById: (partnerId: string) => ProgramPartner | undefined;
  getProgramById: (programId: string) => PartnerProgram | undefined;
  getProgramsByPartner: (partnerId: string) => PartnerProgram[];
  getActivePrograms: () => PartnerProgram[];
  setActiveProgram: (programId: string | null) => void;
  getEnrollmentForProgram: (programId: string, userId?: string) => ProgramEnrollment | undefined;
  enrollInProgram: (programId: string, userId: string, formData?: ProgramEnrollmentFormData) => ProgramEnrollment | null;
  getProgramSessions: (programId: string, userId?: string) => ProgramSession[];
  getProgramPlayAccess: (programId: string, userId?: string, isGuest?: boolean) => ProgramPlayAccess;
  createProgramSession: (programId: string, userId: string, isTrial: boolean, gameId: string) => ProgramSession | null;
  completeProgramSession: (sessionId: string, result: { won: boolean | null; xpGained: number; tokensEarned: number }) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: ProgramStoreState = {
  partners: PROGRAM_PARTNERS,
  programs: PARTNER_PROGRAMS,
  enrollments: [],
  sessions: [],
  activeProgramId: null,
  isLoading: false,
  error: null,
};

export const useProgramStore = create<ProgramStoreState & ProgramStoreActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setPartners: (partners) =>
        set((state) => {
          state.partners = partners;
        }),

      setPrograms: (programs) =>
        set((state) => {
          state.programs = programs;
        }),

      loadCatalog: async () => {
        try {
          const [remotePartners, remotePrograms] = await Promise.all([
            getRemotePartners(),
            getRemotePrograms(),
          ]);
          set((state) => {
            // On ne remplace que si le remote a du contenu — sinon on garde le fallback local.
            if (remotePartners.length > 0) state.partners = remotePartners;
            if (remotePrograms.length > 0) state.programs = remotePrograms;
          });
        } catch {
          // Hors-ligne ou erreur réseau : on garde le catalogue local/persisté.
        }
      },

      loadUserProgramData: async (userId) => {
        if (!userId) return;
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        // Rafraîchit le catalogue partenaires/programmes en parallèle (non bloquant).
        void get().loadCatalog();
        try {
          const [remoteEnrollments, remoteSessions] = await Promise.all([
            getProgramEnrollmentsForUser(userId),
            getProgramSessionsForUser(userId),
          ]);
          set((state) => {
            const otherEnrollments = state.enrollments.filter((item) => item.userId !== userId);
            const otherSessions = state.sessions.filter((item) => item.userId !== userId);
            state.enrollments = [...otherEnrollments, ...remoteEnrollments];
            state.sessions = [...otherSessions, ...remoteSessions];
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = error instanceof Error ? error.message : 'Impossible de charger les programmes.';
          });
        }
      },

      getPartnerById: (partnerId) =>
        get().partners.find((partner) => partner.id === partnerId) ?? getPartnerById(partnerId),

      getProgramById: (programId) =>
        get().programs.find((program) => program.id === programId) ?? getProgramById(programId),

      getProgramsByPartner: (partnerId) =>
        get().programs
          .filter(
            (program) =>
              program.isActive &&
              (program.partnerId === partnerId || program.coPartnerIds?.includes(partnerId))
          )
          .sort((a, b) => a.sortOrder - b.sortOrder),

      getActivePrograms: () =>
        get().programs.filter((program) => program.isActive).sort((a, b) => a.sortOrder - b.sortOrder),

      setActiveProgram: (programId) =>
        set((state) => {
          state.activeProgramId = programId;
        }),

      getEnrollmentForProgram: (programId, userId) => {
        const enrollments = get().enrollments;
        if (userId) {
          return enrollments.find((enrollment) => enrollment.programId === programId && enrollment.userId === userId);
        }
        return enrollments.find((enrollment) => enrollment.programId === programId);
      },

      enrollInProgram: (programId, userId, formData) => {
        const program = get().getProgramById(programId);
        if (!program || !userId) return null;

        const existing = get().getEnrollmentForProgram(programId, userId);
        if (existing) {
          let updatedEnrollment: ProgramEnrollment | null = null;
          set((state) => {
            const enrollment = state.enrollments.find((item) => item.id === existing.id);
            if (enrollment && formData) {
              enrollment.formData = formData;
              updatedEnrollment = { ...enrollment };
            }
          });
          if (updatedEnrollment) {
            setProgramEnrollment(updatedEnrollment).catch(() => {
              get().setError("Impossible de synchroniser l'inscription au programme.");
            });
          }
          return get().getEnrollmentForProgram(programId, userId) ?? existing;
        }

        const now = Date.now();
        const enrollment: ProgramEnrollment = {
          id: `program_enrollment_${now}_${Math.random().toString(36).slice(2, 9)}`,
          userId,
          partnerId: program.partnerId,
          programId,
          status: 'active',
          formData: formData ?? null,
          totalSessions: 0,
          totalWins: 0,
          totalXp: 0,
          enrolledAt: now,
          lastPlayedAt: null,
          completedAt: null,
        };

        set((state) => {
          state.enrollments.push(enrollment);
          state.activeProgramId = programId;
        });

        setProgramEnrollment(enrollment).catch(() => {
          get().setError("Impossible de synchroniser l'inscription au programme.");
        });

        return enrollment;
      },

      getProgramSessions: (programId, userId) => {
        const sessions = get().sessions.filter((session) => session.programId === programId);
        return userId ? sessions.filter((session) => session.userId === userId) : sessions;
      },

      getProgramPlayAccess: (programId, userId, isGuest = false) => {
        const program = get().getProgramById(programId);
        if (!program || !program.isActive) {
          return { canPlay: false, reason: 'program_not_found', requiresEnrollment: false, isTrial: false };
        }

        if (!userId || isGuest) {
          return { canPlay: false, reason: 'guest_blocked', requiresEnrollment: true, isTrial: false };
        }

        const enrollment = get().getEnrollmentForProgram(programId, userId);
        if (enrollment?.formData) {
          return { canPlay: true, reason: 'enrolled', requiresEnrollment: false, isTrial: false };
        }

        const hasPlayed = get().sessions.some((session) => session.programId === programId && session.userId === userId);
        if (!hasPlayed) {
          return { canPlay: true, reason: 'trial_available', requiresEnrollment: false, isTrial: true };
        }

        return { canPlay: false, reason: 'trial_used', requiresEnrollment: true, isTrial: false };
      },

      createProgramSession: (programId, userId, isTrial, gameId) => {
        const program = get().getProgramById(programId);
        if (!program || !userId) return null;

        const session: ProgramSession = {
          id: createProgramSessionId(),
          userId,
          partnerId: program.partnerId,
          programId,
          gameId,
          isTrial,
          won: null,
          xpGained: 0,
          tokensEarned: 0,
          startedAt: Date.now(),
          completedAt: null,
        };

        set((state) => {
          state.sessions.push(session);
          state.activeProgramId = programId;
        });

        setProgramSession(session).catch(() => {
          get().setError('Impossible de synchroniser la session programme.');
        });

        return session;
      },

      completeProgramSession: (sessionId, result) => {
        let updatedSession: ProgramSession | null = null;
        set((state) => {
          const session = state.sessions.find((item) => item.id === sessionId);
          if (!session || session.completedAt) return;

          session.won = result.won;
          session.xpGained = result.xpGained;
          session.tokensEarned = result.tokensEarned;
          session.completedAt = Date.now();
          updatedSession = { ...session };

          const enrollment = state.enrollments.find(
            (item) => item.programId === session.programId && item.userId === session.userId
          );
          if (enrollment) {
            enrollment.totalSessions += 1;
            enrollment.totalWins += result.won ? 1 : 0;
            enrollment.totalXp += result.xpGained;
            enrollment.lastPlayedAt = Date.now();
          }
        });
        if (updatedSession) {
          setProgramSession(updatedSession).catch(() => {
            get().setError('Impossible de synchroniser le résultat du programme.');
          });
        }
      },

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      reset: () =>
        set((state) => {
          state.partners = PROGRAM_PARTNERS;
          state.programs = PARTNER_PROGRAMS;
          state.enrollments = [];
          state.sessions = [];
          state.activeProgramId = null;
          state.isLoading = false;
          state.error = null;
        }),
    })),
    {
      name: 'startup-ludo-programs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        partners: state.partners,
        programs: state.programs,
        enrollments: state.enrollments,
        sessions: state.sessions,
        activeProgramId: state.activeProgramId,
      }),
    }
  )
);
