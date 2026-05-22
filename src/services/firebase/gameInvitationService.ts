/**
 * Game Invitation Service — invitations de partie en ligne entre comptes.
 * Les invités (compte anonyme) ne peuvent ni envoyer ni recevoir d'invitations.
 */
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

import type { GameInvitation, GameInvitationStatus } from '@/types';
import { firebaseLog } from './config';

type QDocSnap = FirebaseFirestoreTypes.QueryDocumentSnapshot;

const COLLECTION = 'gameInvitations';

/** Durée de validité d'une invitation : 10 minutes. */
const INVITATION_TTL_MS = 10 * 60 * 1000;

/**
 * ID déterministe : une seule invitation possible par couple (room, destinataire).
 * Réinviter écrase simplement le document — pas besoin de query anti-doublon.
 */
function buildInvitationId(roomId: string, toUserId: string): string {
  const safeRoom = roomId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeUser = toUserId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `inv_${safeRoom}_${safeUser}`;
}

interface SendInvitationParams {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  roomId: string;
  roomCode: string;
}

/**
 * Envoie une invitation de partie. L'ID est déterministe (room + destinataire),
 * donc réinviter le même joueur dans le même salon écrase l'invitation précédente.
 */
export const sendGameInvitation = async (params: SendInvitationParams): Promise<void> => {
  console.log('[INVITE] sendGameInvitation START', params);
  const db = getFirestore();

  try {
    const now = Date.now();
    const id = buildInvitationId(params.roomId, params.toUserId);
    const invitation: GameInvitation = {
      id,
      fromUserId: params.fromUserId,
      fromUserName: params.fromUserName,
      toUserId: params.toUserId,
      roomId: params.roomId,
      roomCode: params.roomCode,
      status: 'pending',
      createdAt: now,
      expiresAt: now + INVITATION_TTL_MS,
    };

    console.log('[INVITE] writing invitation to Firestore...', { id, collection: COLLECTION });
    await setDoc(doc(db, COLLECTION, id), invitation);
    console.log('[INVITE] ✅ invitation WRITTEN successfully', { id, toUserId: params.toUserId });
    firebaseLog('sendGameInvitation sent', { id, toUserId: params.toUserId });
  } catch (error) {
    console.log('[INVITE] ❌ sendGameInvitation FAILED:', error);
    firebaseLog('sendGameInvitation error', error);
    throw error;
  }
};

/**
 * Met à jour le statut d'une invitation (accepted / declined / expired).
 */
export const updateInvitationStatus = async (
  invitationId: string,
  status: GameInvitationStatus
): Promise<void> => {
  const db = getFirestore();
  await updateDoc(doc(db, COLLECTION, invitationId), { status });
};

/**
 * Listener temps réel des invitations pending reçues par un utilisateur.
 * Filtre côté client les invitations expirées.
 */
export const subscribeToInvitations = (
  userId: string,
  callback: (invitations: GameInvitation[]) => void
): (() => void) => {
  console.log('[INVITE] subscribeToInvitations START for userId =', userId);
  firebaseLog('Subscribing to game invitations', { userId });
  const db = getFirestore();

  const unsubscribe = onSnapshot(
    query(
      collection(db, COLLECTION),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    ),
    (snapshot) => {
      const now = Date.now();
      const rawCount = snapshot.size;
      const all = snapshot.docs.map((d: QDocSnap) => d.data() as GameInvitation);
      const invitations = all
        .filter((inv: GameInvitation) => inv.expiresAt > now)
        .sort((a: GameInvitation, b: GameInvitation) => b.createdAt - a.createdAt);
      console.log('[INVITE] snapshot reçu —', {
        userId,
        docsBruts: rawCount,
        apresFiltreExpiration: invitations.length,
        expirees: rawCount - invitations.length,
      });
      callback(invitations);
    },
    (error) => {
      console.log('[INVITE] ❌ subscription ERROR:', error);
      firebaseLog('Game invitations subscription error', error);
    }
  );

  return unsubscribe;
};
