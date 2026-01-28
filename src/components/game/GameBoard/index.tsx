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
import { COLORS } from '@/styles/colors';
import type { Player, PlayerColor } from '@/types';
import { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CenterZone } from './CenterZone';
import { HomeZone } from './HomeZone';
import { PathCell } from './PathCell';
import { Pawn } from './Pawn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GameBoardProps {
  players: Player[];
  currentPlayerId: string;
  selectedPawnIndex: number | null;
  highlightedPositions: { type: 'circuit' | 'final'; position: number; color?: PlayerColor }[];
  onPawnPress?: (playerId: string, pawnIndex: number) => void;
  onPawnMoveComplete?: () => void;
}

export const GameBoard = memo(function GameBoard({
  players,
  currentPlayerId,
  selectedPawnIndex,
  highlightedPositions,
  onPawnPress,
  onPawnMoveComplete,
}: GameBoardProps) {
  // Dimensions - le plateau prend presque toute la largeur
  const boardPadding = 4;
  const boardSize = Math.min(SCREEN_WIDTH - 16, 400);
  const cellSize = (boardSize - boardPadding * 2) / BOARD_SIZE;

  // Taille des zones maison (5 cellules pour grille 13x13)
  const homeZoneSize = cellSize * 5;

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
        const coords = GameEngine.getPawnCoordinates(player.color, pawn);
        if (coords) {
          positions.push({
            playerId: player.id,
            playerColor: player.color,
            pawnIndex: index,
            coords,
            isHome: pawn.status === 'home',
            isFinished: pawn.status === 'finished',
            isAI: player.isAI,
          });
        }
      });
    });

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
          isCurrentPlayer={players.find(p => p.color === 'yellow')?.id === currentPlayerId}
        />
        <HomeZone
          color="blue"
          position="top-right"
          size={homeZoneSize}
          boardPadding={boardPadding}
          player={players.find(p => p.color === 'blue')}
          isCurrentPlayer={players.find(p => p.color === 'blue')?.id === currentPlayerId}
        />
        <HomeZone
          color="red"
          position="bottom-right"
          size={homeZoneSize}
          boardPadding={boardPadding}
          player={players.find(p => p.color === 'red')}
          isCurrentPlayer={players.find(p => p.color === 'red')?.id === currentPlayerId}
        />
        <HomeZone
          color="green"
          position="bottom-left"
          size={homeZoneSize}
          boardPadding={boardPadding}
          player={players.find(p => p.color === 'green')}
          isCurrentPlayer={players.find(p => p.color === 'green')?.id === currentPlayerId}
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

            return (
              <Pawn
                key={`${pawn.playerId}-${pawn.pawnIndex}`}
                color={pawn.playerColor}
                targetX={x}
                targetY={y}
                cellSize={cellSize}
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
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
});

export { CenterZone } from './CenterZone';
export { HomeZone } from './HomeZone';
export { PathCell } from './PathCell';
export { Pawn } from './Pawn';

