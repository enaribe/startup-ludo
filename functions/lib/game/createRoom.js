"use strict";
/**
 * createRoom - Cloud Function pour créer une room multijoueur
 *
 * Crée une nouvelle room de jeu avec un code unique et
 * ajoute le créateur comme premier joueur.
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
exports.createRoom = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Couleurs disponibles pour les joueurs
const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'];
// Génère un code de room à 6 caractères
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
exports.createRoom = functions.https.onCall(async (request) => {
    const { userId, displayName, gameSettings } = request.data;
    // Validation
    if (!userId || !displayName) {
        throw new functions.https.HttpsError('invalid-argument', 'userId and displayName are required');
    }
    if (!gameSettings || gameSettings.maxPlayers < 2 || gameSettings.maxPlayers > 4) {
        throw new functions.https.HttpsError('invalid-argument', 'gameSettings.maxPlayers must be between 2 and 4');
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
        throw new functions.https.HttpsError('internal', 'Could not generate unique room code');
    }
    // Créer la room
    const roomId = roomsRef.push().key;
    if (!roomId) {
        throw new functions.https.HttpsError('internal', 'Could not create room');
    }
    const room = {
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
});
//# sourceMappingURL=createRoom.js.map