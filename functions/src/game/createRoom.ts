/**
 * createRoom - Cloud Function pour créer une room multijoueur
 *
 * Crée une nouvelle room de jeu avec un code unique et
 * ajoute le créateur comme premier joueur.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface CreateRoomRequest {
  userId: string;
  displayName: string;
  gameSettings: {
    maxPlayers: number;
    maxTurns: number;
    tokenGoal: number;
  };
}

interface Room {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: {
    id: string;
    displayName: string;
    color: string;
    isReady: boolean;
    joinedAt: number;
  }[];
  gameSettings: {
    maxPlayers: number;
    maxTurns: number;
    tokenGoal: number;
  };
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
}

// Couleurs disponibles pour les joueurs
const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'] as const;

// Génère un code de room à 6 caractères
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createRoom = functions.https.onCall(
  async (request: functions.https.CallableRequest<CreateRoomRequest>) => {
    const { userId, displayName, gameSettings } = request.data;

    // Validation
    if (!userId || !displayName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId and displayName are required'
      );
    }

    if (!gameSettings || gameSettings.maxPlayers < 2 || gameSettings.maxPlayers > 4) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'gameSettings.maxPlayers must be between 2 and 4'
      );
    }

    const db = admin.database();
    const roomsRef = db.ref('rooms');

    // Générer un code unique
    let roomCode = generateRoomCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existingRoom = await roomsRef
        .orderByChild('code')
        .equalTo(roomCode)
        .once('value');

      if (!existingRoom.exists()) {
        break;
      }

      roomCode = generateRoomCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new functions.https.HttpsError(
        'internal',
        'Could not generate unique room code'
      );
    }

    // Créer la room
    const roomId = roomsRef.push().key;
    if (!roomId) {
      throw new functions.https.HttpsError('internal', 'Could not create room');
    }

    const room: Room = {
      id: roomId,
      code: roomCode,
      hostId: userId,
      status: 'waiting',
      players: [
        {
          id: userId,
          displayName,
          color: PLAYER_COLORS[0],
          isReady: false,
          joinedAt: Date.now(),
        },
      ],
      gameSettings: {
        maxPlayers: gameSettings.maxPlayers,
        maxTurns: gameSettings.maxTurns || 20,
        tokenGoal: gameSettings.tokenGoal || 100,
      },
      createdAt: Date.now(),
      startedAt: null,
      finishedAt: null,
    };

    await roomsRef.child(roomId).set(room);

    functions.logger.info(`Room created: ${roomCode} by ${userId}`);

    return {
      success: true,
      roomId,
      roomCode,
    };
  }
);
