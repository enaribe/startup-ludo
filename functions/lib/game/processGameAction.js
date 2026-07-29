"use strict";
/**
 * processGameAction - Cloud Function pour valider et traiter les actions de jeu
 *
 * Valide côté serveur les actions de jeu (lancer de dé, mouvement, réponse quiz)
 * pour éviter la triche en multijoueur.
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
exports.processGameAction = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Valider que c'est bien le tour du joueur
function validatePlayerTurn(gameState, playerId) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return (currentPlayer === null || currentPlayer === void 0 ? void 0 : currentPlayer.id) === playerId;
}
// Générer un lancer de dé aléatoire (1-6)
function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}
// Calculer la nouvelle position
function calculateNewPosition(currentPosition, diceValue, boardSize = 40) {
    return (currentPosition + diceValue) % boardSize;
}
exports.processGameAction = functions.https.onCall(async (request) => {
    const { roomId, playerId, actionType, payload } = request.data;
    // Validation de base
    if (!roomId || !playerId || !actionType) {
        throw new functions.https.HttpsError('invalid-argument', 'roomId, playerId, and actionType are required');
    }
    const db = admin.database();
    const gameRef = db.ref(`games/${roomId}`);
    // Récupérer l'état actuel du jeu
    const gameSnapshot = await gameRef.once('value');
    if (!gameSnapshot.exists()) {
        throw new functions.https.HttpsError('not-found', 'Game not found');
    }
    const gameState = gameSnapshot.val();
    // Vérifier que le jeu est en cours
    if (gameState.status !== 'playing') {
        throw new functions.https.HttpsError('failed-precondition', 'Game is not in playing state');
    }
    // Vérifier que c'est le tour du joueur
    if (!validatePlayerTurn(gameState, playerId)) {
        throw new functions.https.HttpsError('permission-denied', 'It is not your turn');
    }
    // Traiter l'action selon son type
    let updates = {};
    switch (actionType) {
        case 'roll_dice': {
            if (gameState.diceRolled) {
                throw new functions.https.HttpsError('failed-precondition', 'Dice already rolled this turn');
            }
            const diceValue = rollDice();
            updates = {
                diceValue,
                diceRolled: true,
            };
            functions.logger.info(`Player ${playerId} rolled ${diceValue}`);
            break;
        }
        case 'move_pawn': {
            if (!gameState.diceRolled || gameState.diceValue === null) {
                throw new functions.https.HttpsError('failed-precondition', 'Must roll dice first');
            }
            const currentPlayer = gameState.players[gameState.currentPlayerIndex];
            const newPosition = calculateNewPosition(currentPlayer.position, gameState.diceValue);
            // Mettre à jour la position du joueur
            const updatedPlayers = [...gameState.players];
            updatedPlayers[gameState.currentPlayerIndex] = Object.assign(Object.assign({}, currentPlayer), { position: newPosition });
            updates = {
                players: updatedPlayers,
            };
            functions.logger.info(`Player ${playerId} moved to position ${newPosition}`);
            break;
        }
        case 'answer_quiz': {
            if (!(payload === null || payload === void 0 ? void 0 : payload.quizId) || !(payload === null || payload === void 0 ? void 0 : payload.answerId)) {
                throw new functions.https.HttpsError('invalid-argument', 'quizId and answerId are required for quiz answer');
            }
            // TODO: Valider la réponse contre la base de données des quiz
            // Pour l'instant, on fait confiance au client
            // En production, il faudrait vérifier la réponse ici
            functions.logger.info(`Player ${playerId} answered quiz ${payload.quizId}`);
            break;
        }
        case 'end_turn': {
            // Passer au joueur suivant
            const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
            const newTurn = nextPlayerIndex === 0 ? gameState.turn + 1 : gameState.turn;
            updates = {
                currentPlayerIndex: nextPlayerIndex,
                turn: newTurn,
                diceValue: null,
                diceRolled: false,
            };
            functions.logger.info(`Turn ended. Next player: ${gameState.players[nextPlayerIndex].id}`);
            break;
        }
        default:
            throw new functions.https.HttpsError('invalid-argument', `Unknown action type: ${actionType}`);
    }
    // Appliquer les mises à jour
    await gameRef.update(updates);
    return {
        success: true,
        actionType,
        updates,
    };
});
//# sourceMappingURL=processGameAction.js.map