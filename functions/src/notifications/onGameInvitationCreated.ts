/**
 * onGameInvitationCreated — Notification push DIRECTE (FCM pur, sans Customer.io)
 * envoyée au destinataire quand une invitation de partie est créée.
 *
 * L'app affiche déjà un popup in-app quand elle est ouverte (listener Firestore) :
 * cette notification couvre le cas app fermée / en arrière-plan. Le tap ouvre
 * l'app, et le popup d'invitation existant prend le relais automatiquement.
 *
 * Tokens : lus dans `pushTokens/{userId}` (écrits par l'app mobile).
 * Les tokens invalides (app désinstallée) sont nettoyés après envoi.
 *
 * API v2 (2nd Gen) : la création de fonctions 1st Gen est bloquée par Google
 * pour les projets qui n'en ont jamais déployé.
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

interface GameInvitation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  roomId: string;
  roomCode: string;
  status: string;
  createdAt: number;
  expiresAt: number;
}

interface PushTokensDoc {
  userId: string;
  tokens?: Record<string, { platform: string; updatedAt: number }>;
}

export const onGameInvitationCreated = onDocumentCreated(
  'gameInvitations/{invitationId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const invitation = snapshot.data() as GameInvitation;
    if (invitation.status !== 'pending') return;
    // Invitation déjà expirée (écriture tardive) → inutile de notifier
    if (invitation.expiresAt && invitation.expiresAt < Date.now()) return;

    // Tokens du destinataire
    const tokensSnap = await admin
      .firestore()
      .doc(`pushTokens/${invitation.toUserId}`)
      .get();
    const tokensMap = (tokensSnap.data() as PushTokensDoc | undefined)?.tokens ?? {};
    const tokens = Object.keys(tokensMap);
    if (tokens.length === 0) {
      logger.info('Aucun token push pour le destinataire', {
        toUserId: invitation.toUserId,
      });
      return;
    }

    const fromName = invitation.fromUserName || 'Un joueur';

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: '⚔️ On te cherche !',
        body: `${fromName} t'invite à rejoindre sa partie. Tu réponds ou tu déclares forfait ?`,
      },
      data: {
        type: 'game_invitation',
        invitationId: invitation.id ?? snapshot.id,
        roomCode: invitation.roomCode ?? '',
      },
      android: {
        priority: 'high',
        // TTL aligné sur l'expiration de l'invitation (10 min) : inutile de
        // livrer une invitation périmée si le téléphone était hors ligne.
        ttl: Math.max(0, (invitation.expiresAt ?? Date.now()) - Date.now()),
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
    });

    logger.info('Invitation push envoyée', {
      toUserId: invitation.toUserId,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    // Nettoyage des tokens invalides (app désinstallée, token expiré)
    const invalidTokens: string[] = [];
    response.responses.forEach((result, index) => {
      const code = result.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        const token = tokens[index];
        if (token) invalidTokens.push(token);
      }
    });

    if (invalidTokens.length > 0) {
      const updates: Record<string, admin.firestore.FieldValue> = {};
      for (const token of invalidTokens) {
        updates[`tokens.${token}`] = admin.firestore.FieldValue.delete();
      }
      await tokensSnap.ref.update(updates).catch(() => undefined);
      logger.info('Tokens invalides nettoyés', { count: invalidTokens.length });
    }
  }
);
