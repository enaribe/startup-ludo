/**
 * processGameAction - Cloud Function pour valider et traiter les actions de jeu
 *
 * Valide côté serveur les actions de jeu (lancer de dé, mouvement, réponse quiz)
 * pour éviter la triche en multijoueur.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

type ActionType = 'roll_dice' | 'move_pawn' | 'answer_quiz' | 'end_turn';

interface GameActionRequest {
  roomId: string;
  playerId: string;
  actionType: ActionType;
  payload?: {
    diceValue?: number;
    targetPosition?: number;
    quizId?: string;
    answerId?: string;
  };
}

interface GameState {
  currentPlayerIndex: number;
  players: Array<{
    id: string;
    position: number;
    tokens: number;
  }>;
  diceValue: number | null;
  diceRolled: boolean;
  turn: number;
  status: 'playing' | 'finished';
}

// Valider que c'est bien le tour du joueur
function validatePlayerTurn(
  gameState: GameState,
  playerId: string
): boolean {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  return currentPlayer?.id === playerId;
}

// Générer un lancer de dé aléatoire (1-6)
function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// Calculer la nouvelle position
function calculateNewPosition(currentPosition: number, diceValue: number, boardSize = 40): number {
  return (currentPosition + diceValue) % boardSize;
}

export const processGameAction = functions.https.onCall(
  async (request: functions.https.CallableRequest<GameActionRequest>) => {
    const { roomId, playerId, actionType, payload } = request.data;

    // Validation de base
    if (!roomId || !playerId || !actionType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'roomId, playerId, and actionType are required'
      );
    }

    const db = admin.database();
    const gameRef = db.ref(`games/${roomId}`);

    // Récupérer l'état actuel du jeu
    const gameSnapshot = await gameRef.once('value');
    if (!gameSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'Game not found');
    }

    const gameState = gameSnapshot.val() as GameState;

    // Vérifier que le jeu est en cours
    if (gameState.status !== 'playing') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Game is not in playing state'
      );
    }

    // Vérifier que c'est le tour du joueur
    if (!validatePlayerTurn(gameState, playerId)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'It is not your turn'
      );
    }

    // Traiter l'action selon son type
    let updates: Partial<GameState> = {};

    switch (actionType) {
      case 'roll_dice': {
        if (gameState.diceRolled) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Dice already rolled this turn'
          );
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
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Must roll dice first'
          );
        }

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const newPosition = calculateNewPosition(
          currentPlayer.position,
          gameState.diceValue
        );

        // Mettre à jour la position du joueur
        const updatedPlayers = [...gameState.players];
        updatedPlayers[gameState.currentPlayerIndex] = {
          ...currentPlayer,
          position: newPosition,
        };

        updates = {
          players: updatedPlayers,
        };

        functions.logger.info(
          `Player ${playerId} moved to position ${newPosition}`
        );
        break;
      }

      case 'answer_quiz': {
        if (!payload?.quizId || !payload?.answerId) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'quizId and answerId are required for quiz answer'
          );
        }

        // TODO: Valider la réponse contre la base de données des quiz
        // Pour l'instant, on fait confiance au client
        // En production, il faudrait vérifier la réponse ici

        functions.logger.info(
          `Player ${playerId} answered quiz ${payload.quizId}`
        );
        break;
      }

      case 'end_turn': {
        // Passer au joueur suivant
        const nextPlayerIndex =
          (gameState.currentPlayerIndex + 1) % gameState.players.length;
        const newTurn =
          nextPlayerIndex === 0 ? gameState.turn + 1 : gameState.turn;

        updates = {
          currentPlayerIndex: nextPlayerIndex,
          turn: newTurn,
          diceValue: null,
          diceRolled: false,
        };

        functions.logger.info(
          `Turn ended. Next player: ${gameState.players[nextPlayerIndex].id}`
        );
        break;
      }

      default:
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Unknown action type: ${actionType}`
        );
    }

    // Appliquer les mises à jour
    await gameRef.update(updates);

    return {
      success: true,
      actionType,
      updates,
    };
  }
);
