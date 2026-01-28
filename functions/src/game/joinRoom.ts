/**
 * joinRoom - Cloud Function pour rejoindre une room multijoueur
 *
 * Permet à un joueur de rejoindre une room existante
 * en utilisant le code de la room.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface JoinRoomRequest {
  userId: string;
  displayName: string;
  roomCode: string;
}

// Couleurs disponibles pour les joueurs
const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'] as const;

export const joinRoom = functions.https.onCall(
  async (request: functions.https.CallableRequest<JoinRoomRequest>) => {
    const { userId, displayName, roomCode } = request.data;

    // Validation
    if (!userId || !displayName || !roomCode) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId, displayName, and roomCode are required'
      );
    }

    const db = admin.database();
    const roomsRef = db.ref('rooms');

    // Trouver la room par son code
    const roomsSnapshot = await roomsRef
      .orderByChild('code')
      .equalTo(roomCode.toUpperCase())
      .once('value');

    if (!roomsSnapshot.exists()) {
      throw new functions.https.HttpsError(
        'not-found',
        'Room not found with this code'
      );
    }

    // Récupérer la première (et unique) room avec ce code
    let roomId: string | null = null;
    let roomData: Record<string, unknown> | null = null;

    roomsSnapshot.forEach((childSnapshot) => {
      roomId = childSnapshot.key;
      roomData = childSnapshot.val() as Record<string, unknown>;
      return true; // Stop iteration
    });

    if (!roomId || !roomData) {
      throw new functions.https.HttpsError('not-found', 'Room data not found');
    }

    // Vérifier le statut de la room
    if (roomData.status !== 'waiting') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Game has already started or finished'
      );
    }

    // Vérifier le nombre de joueurs
    const players = (roomData.players as Array<{ id: string; color: string }>) || [];
    const maxPlayers = (roomData.gameSettings as { maxPlayers: number }).maxPlayers || 4;

    if (players.length >= maxPlayers) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Room is full'
      );
    }

    // Vérifier si le joueur est déjà dans la room
    const existingPlayer = players.find((p) => p.id === userId);
    if (existingPlayer) {
      return {
        success: true,
        roomId,
        alreadyJoined: true,
      };
    }

    // Trouver une couleur disponible
    const usedColors = players.map((p) => p.color);
    const availableColor = PLAYER_COLORS.find((c) => !usedColors.includes(c));

    if (!availableColor) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No available colors'
      );
    }

    // Ajouter le joueur
    const newPlayer = {
      id: userId,
      displayName,
      color: availableColor,
      isReady: false,
      joinedAt: Date.now(),
    };

    await roomsRef.child(`${roomId}/players`).push(newPlayer);

    functions.logger.info(`Player ${userId} joined room ${roomCode}`);

    return {
      success: true,
      roomId,
      alreadyJoined: false,
    };
  }
);
