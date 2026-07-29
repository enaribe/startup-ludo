"use strict";
/**
 * joinRoom - Cloud Function pour rejoindre une room multijoueur
 *
 * Permet à un joueur de rejoindre une room existante
 * en utilisant le code de la room.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRoom = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Couleurs disponibles pour les joueurs
const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'];
exports.joinRoom = functions.https.onCall(async (request) => {
    const { userId, displayName, roomCode } = request.data;
    // Validation
    if (!userId || !displayName || !roomCode) {
        throw new functions.https.HttpsError('invalid-argument', 'userId, displayName, and roomCode are required');
    }
    const db = admin.database();
    const roomsRef = db.ref('rooms');
    // Trouver la room par son code
    const roomsSnapshot = await roomsRef
        .orderByChild('code')
        .equalTo(roomCode.toUpperCase())
        .once('value');
    if (!roomsSnapshot.exists()) {
        throw new functions.https.HttpsError('not-found', 'Room not found with this code');
    }
    // Récupérer la première (et unique) room avec ce code
    let roomId = null;
    let roomData = null;
    roomsSnapshot.forEach((childSnapshot) => {
        roomId = childSnapshot.key;
        roomData = childSnapshot.val();
        return true; // Stop iteration
    });
    if (!roomId || !roomData) {
        throw new functions.https.HttpsError('not-found', 'Room data not found');
    }
    // Vérifier le statut de la room
    if (roomData.status !== 'waiting') {
        throw new functions.https.HttpsError('failed-precondition', 'Game has already started or finished');
    }
    // Vérifier le nombre de joueurs
    const players = roomData.players || [];
    const maxPlayers = roomData.gameSettings.maxPlayers || 4;
    if (players.length >= maxPlayers) {
        throw new functions.https.HttpsError('failed-precondition', 'Room is full');
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
        throw new functions.https.HttpsError('failed-precondition', 'No available colors');
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
});
//# sourceMappingURL=joinRoom.js.map