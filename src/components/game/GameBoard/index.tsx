/**
 * GameBoard - Plateau de jeu Ludo
 *
 * Design basé sur l'image de référence :
 * - Grille 15x15
 * - 4 zones maison colorées aux coins (6x6) avec PlayerCards intégrées
 * - Chemin de cases blanches formant une croix (3 colonnes)
 * - Cases colorées pour les chemins finaux
 * - Zone centrale 3x3 pour l'arrivée
 */

import {
    BOARD_SIZE,
    coordsToPixels,
    FINAL_PATHS,
    getEventAtCircuitPosition,
    MAIN_CIRCUIT,
    type Coordinate,
} from '@/config/boardConfig';
import { GameEngine } from '@/services/game/GameEngine';
import { useGameStore } from '@/stores';
import type { Player, PlayerColor } from '@/types';
import { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CenterZone } from './CenterZone';
import { HomeZone } from './HomeZone';
import { PathCell } from './PathCell';
import { Pawn } from './Pawn';

interface GameBoardProps {
  players: Player[];
  currentPlayerId: string;
  selectedPawnIndex: number | null;
  highlightedPositions: { type: 'circuit' | 'final'; position: number; color?: PlayerColor }[];
  onPawnPress?: (playerId: string, pawnIndex: number) => void;
  onPawnMoveComplete?: () => void;
  /** External board size (pixels). If omitted, auto-computed from window width. */
  size?: number;
}

export const GameBoard = memo(function GameBoard({
  players,
  currentPlayerId,
  selectedPawnIndex,
  highlightedPositions,
  onPawnPress,
  onPawnMoveComplete,
  size,
}: GameBoardProps) {
  // Dimensions réactives — s'adapte aux tablettes et à la rotation
  const { width: windowWidth } = useWindowDimensions();
  const boardPadding = 4;
  const boardSize = size ?? Math.min(windowWidth - 16, 400);
  const cellSize = (boardSize - boardPadding * 2) / BOARD_SIZE;

  // Taille des zones maison (5 cellules pour grille 13x13)
  const homeZoneSize = cellSize * 5;

  // Dernier résultat de mouvement (pour animation case par case)
  const lastMoveResult = useGameStore((s) => s.lastMoveResult);

  // Convertir le chemin du dernier mouvement en pixels
  const movePathPixels = useMemo(() => {
    if (!lastMoveResult?.path?.length) {
      console.log('[GameBoard] No move path to convert');
      return null;
    }
    
    console.log('[GameBoard] Converting move path:', {
      pathLength: lastMoveResult.path.length,
      path: lastMoveResult.path,
    });
    
    // Filtrer les coordonnées invalides
    const validPath = lastMoveResult.path.filter(
      (coord) => coord && typeof coord.col === 'number' && typeof coord.row === 'number'
    );
    
    if (validPath.length !== lastMoveResult.path.length) {
      console.warn('[GameBoard] Some coords in path were invalid!', {
        original: lastMoveResult.path.length,
        valid: validPath.length,
      });
    }
    
    if (validPath.length === 0) {
      return null;
    }
    
    return validPath.map((coord) => coordsToPixels(coord, cellSize, boardPadding));
  }, [lastMoveResult, cellSize, boardPadding]);

  // Données des cases du circuit
  const pathCells = useMemo(() => {
    const cells: {
      row: number;
      col: number;
      circuitIndex: number | null;
      finalInfo: { color: PlayerColor; index: number } | null;
      eventType: string;
    }[] = [];

    // Cases du circuit principal
    MAIN_CIRCUIT.forEach((coord, index) => {
      cells.push({
        row: coord.row,
        col: coord.col,
        circuitIndex: index,
        finalInfo: null,
        eventType: getEventAtCircuitPosition(index),
      });
    });

    // Cases des chemins finaux
    (['yellow', 'blue', 'red', 'green'] as PlayerColor[]).forEach(color => {
      FINAL_PATHS[color].forEach((coord, index) => {
        // Ne pas ajouter si déjà dans le circuit
        const exists = cells.some(c => c.row === coord.row && c.col === coord.col);
        if (!exists) {
          cells.push({
            row: coord.row,
            col: coord.col,
            circuitIndex: null,
            finalInfo: { color, index },
            eventType: 'normal',
          });
        }
      });
    });

    return cells;
  }, []);

  // Positions des pions
  const pawnPositions = useMemo(() => {
    console.log('[GameBoard] Calculating pawn positions...');
    
    const positions: {
      playerId: string;
      playerColor: PlayerColor;
      pawnIndex: number;
      coords: Coordinate;
      isHome: boolean;
      isFinished: boolean;
      isAI: boolean;
    }[] = [];

    players.forEach(player => {
      player.pawns.forEach((pawn, index) => {
        try {
          const coords = GameEngine.getPawnCoordinates(player.color, pawn);
          
          if (!coords) {
            console.warn(`[GameBoard] No coords for pawn ${index} of ${player.color}`, pawn);
            return;
          }
          
          // Vérifier que les coordonnées sont valides
          if (typeof coords.row !== 'number' || typeof coords.col !== 'number' ||
              isNaN(coords.row) || isNaN(coords.col)) {
            console.error(`[GameBoard] Invalid coords for pawn ${index} of ${player.color}:`, coords, pawn);
            return;
          }
          
          positions.push({
            playerId: player.id,
            playerColor: player.color,
            pawnIndex: index,
            coords,
            isHome: pawn.status === 'home',
            isFinished: pawn.status === 'finished',
            isAI: player.isAI,
          });
        } catch (error) {
          console.error(`[GameBoard] Error getting coords for pawn ${index} of ${player.color}:`, error);
        }
      });
    });

    console.log('[GameBoard] Pawn positions calculated:', positions.length);
    return positions;
  }, [players]);

  // Pions terminés par couleur
  const finishedPawnsByColor = useMemo(() => {
    return players.map(p => ({
      color: p.color,
      count: p.pawns.filter(pawn => pawn.status === 'finished').length,
    }));
  }, [players]);

  // Vérifier si une position est highlightée
  const isHighlighted = (type: 'circuit' | 'final', position: number, color?: PlayerColor) => {
    return highlightedPositions.some(
      hp => hp.type === type && hp.position === position && (!hp.color || hp.color === color)
    );
  };

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[styles.container, { width: boardSize, height: boardSize }]}
    >
      <View style={[styles.board, { padding: boardPadding }]}>

        {/* Zones maison aux 4 coins avec PlayerCards intégrées */}
        <HomeZone
          color="yellow"
          position="top-left"
          size={homeZoneSize}
          boardPadding={boardPadding}
          player={players.find(p => p.color === 'yellow')}
        />
        <HomeZone
          color="blue"
          position="top-right"
          size={homeZoneSize}
          boardPadding={boardPadding}
          player={players.find(p => p.color === 'blue')}
        />
        <HomeZone
          color="red"
          position="bottom-right"
          size={homeZoneSize}
          boardPadding={boardPadding}
          player={players.find(p => p.color === 'red')}
        />
        <HomeZone
          color="green"
          position="bottom-left"
          size={homeZoneSize}
          boardPadding={boardPadding}
          player={players.find(p => p.color === 'green')}
        />

        {/* Cases du chemin (circuit + finaux) */}
        {pathCells.map((cell, index) => (
          <PathCell
            key={`cell-${index}`}
            row={cell.row}
            col={cell.col}
            cellSize={cellSize}
            boardPadding={boardPadding}
            circuitIndex={cell.circuitIndex}
            finalInfo={cell.finalInfo}
            eventType={cell.eventType}
            isHighlighted={
              cell.circuitIndex !== null
                ? isHighlighted('circuit', cell.circuitIndex)
                : cell.finalInfo
                  ? isHighlighted('final', cell.finalInfo.index, cell.finalInfo.color)
                  : false
            }
          />
        ))}

        {/* Zone centrale (position 5-7 pour grille 13x13) */}
        <CenterZone
          size={cellSize * 3}
          left={boardPadding + cellSize * 5}
          top={boardPadding + cellSize * 5}
          finishedPawns={finishedPawnsByColor}
        />

        {/* Pions */}
        {pawnPositions
          .filter(p => !p.isFinished)
          .map(pawn => {
            const isCurrentPlayer = pawn.playerId === currentPlayerId;
            const isSelected = isCurrentPlayer && selectedPawnIndex === pawn.pawnIndex;
            const { x, y } = coordsToPixels(pawn.coords, cellSize, boardPadding);

            // Protection contre coordonnées invalides
            if (isNaN(x) || isNaN(y) || x === 0 && y === 0) {
              console.error('[GameBoard] Skipping pawn with invalid pixel coords:', {
                pawn,
                x,
                y,
              });
              return null;
            }

            // Fournir le chemin d'animation case par case au pion qui vient de bouger
            const isMovingPawn = isCurrentPlayer
              && selectedPawnIndex === pawn.pawnIndex
              && movePathPixels && movePathPixels.length > 0;

            // Log le mouvement
            if (isMovingPawn) {
              console.log('[GameBoard] Pawn is moving:', {
                pawnIndex: pawn.pawnIndex,
                color: pawn.playerColor,
                targetX: x,
                targetY: y,
                pathLength: movePathPixels?.length,
              });
            }

            return (
              <Pawn
                key={`${pawn.playerId}-${pawn.pawnIndex}`}
                color={pawn.playerColor}
                targetX={x}
                targetY={y}
                cellSize={cellSize}
                movePath={isMovingPawn ? movePathPixels : undefined}
                isActive={isCurrentPlayer && !pawn.isHome}
                isSelected={isSelected}
                isInHome={pawn.isHome}
                isAI={pawn.isAI}
                pawnIndex={pawn.pawnIndex}
                onAnimationComplete={onPawnMoveComplete}
                onPress={
                  isCurrentPlayer && onPawnPress
                    ? () => onPawnPress(pawn.playerId, pawn.pawnIndex)
                    : undefined
                }
              />
            );
          })}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  board: {
    flex: 1,
    borderRadius: 16,
    position: 'relative',
  },
});

export { CenterZone } from './CenterZone';
export { HomeZone } from './HomeZone';
export { PathCell } from './PathCell';
export { Pawn } from './Pawn';

