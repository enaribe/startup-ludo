/**
 * Invitation Store — gère les invitations de partie reçues en temps réel.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import {
  subscribeToInvitations,
  updateInvitationStatus,
} from '@/services/firebase/gameInvitationService';
import type { GameInvitation } from '@/types';

interface InvitationStoreState {
  pendingInvitations: GameInvitation[];
  /** Invitation actuellement affichée dans le popup (la plus récente non vue). */
  activeInvitation: GameInvitation | null;
}

interface InvitationStoreActions {
  startListening: (userId: string) => void;
  stopListening: () => void;
  dismissActive: () => void;
  accept: (invitation: GameInvitation) => Promise<void>;
  decline: (invitation: GameInvitation) => Promise<void>;
}

const initialState: InvitationStoreState = {
  pendingInvitations: [],
  activeInvitation: null,
};

let unsubscribe: (() => void) | null = null;
/** IDs déjà présentés à l'utilisateur (évite de re-popup la même invitation). */
const seenInvitationIds = new Set<string>();

export const useInvitationStore = create<InvitationStoreState & InvitationStoreActions>()(
  immer((set) => ({
    ...initialState,

    startListening: (userId) => {
      console.log('[INVITE] store.startListening pour userId =', userId);
      if (unsubscribe) unsubscribe();
      seenInvitationIds.clear();

      unsubscribe = subscribeToInvitations(userId, (invitations) => {
        set((state) => {
          state.pendingInvitations = invitations;
          // Présenter la plus récente invitation jamais vue
          const fresh = invitations.find((inv) => !seenInvitationIds.has(inv.id));
          if (fresh && !state.activeInvitation) {
            console.log('[INVITE] 🔔 nouvelle invitation à afficher:', fresh.id, 'de', fresh.fromUserName);
            seenInvitationIds.add(fresh.id);
            state.activeInvitation = fresh;
          } else {
            console.log('[INVITE] store: aucune nouvelle invitation à popup', {
              pending: invitations.length,
              activeDejaAffichee: !!state.activeInvitation,
            });
          }
        });
      });
    },

    stopListening: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      seenInvitationIds.clear();
      set(() => ({ ...initialState }));
    },

    dismissActive: () => {
      set((state) => {
        state.activeInvitation = null;
      });
    },

    accept: async (invitation) => {
      set((state) => {
        state.activeInvitation = null;
        state.pendingInvitations = state.pendingInvitations.filter((i) => i.id !== invitation.id);
      });
      try {
        await updateInvitationStatus(invitation.id, 'accepted');
      } catch {
        // Non bloquant : la navigation vers le salon a déjà eu lieu
      }
    },

    decline: async (invitation) => {
      set((state) => {
        state.activeInvitation = null;
        state.pendingInvitations = state.pendingInvitations.filter((i) => i.id !== invitation.id);
      });
      try {
        await updateInvitationStatus(invitation.id, 'declined');
      } catch {
        // Non bloquant
      }
    },
  }))
);
