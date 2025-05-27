import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import LudoCell from './LudoCell';
import LudoPawn from './LudoPawn';

// Types
interface Cell {
  id: string;
  row: number;
  col: number;
  type: 'home' | 'center' | 'path' | 'empty';
  color: string;
  isStart?: boolean;
  homeNumber?: number;
  eventType?: 'quiz' | 'financement' | 'duel' | 'evenement';
}

interface GameBoardProps {
  cellSize: number;
  currentPlayer: 'yellow' | 'blue' | 'red' | 'green';
  pawns: Record<'yellow' | 'blue' | 'red' | 'green', 'home' | number>;
  activePlayers: Array<'yellow' | 'blue' | 'red' | 'green'>;
  pawnAnim: Record<'yellow' | 'blue' | 'red' | 'green', any>;
  paths: Record<string, Array<{ row: number; col: number }>>;
  onCellPress: (cell: Cell) => void;
}

// Couleurs des maisons
const homeColors: Record<string, string> = {
  yellow: '#FFC966',
  blue: '#7B9EF3',
  green: '#90EE90',
  red: '#FF7F7F',
};

// Couleurs des chemins
const pathColors: Record<string, string> = {
  yellow: '#FFFACD',
  blue: '#B0C4DE',
  green: '#90EE90',
  red: '#FFC0CB',
  neutral: '#fff',
  center: '#FFD700',
  empty: '#F5F5F5',
};

const BOARD_SIZE = 15;

/**
 * Génère une distribution fixe des événements sur le plateau
 * 4 duels, 8 financements, le reste quiz et événements
 */
const createFixedEventDistribution = (): Record<string, 'quiz' | 'financement' | 'duel' | 'evenement'> => {
  // Cases de chemin valides (excluant départ, centre et chemins finaux)
  const pathCells: Array<{row: number, col: number}> = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Vérifier si c'est une case de chemin valide pour un événement
      if (
        ((row === 6 || row === 7 || row === 8) && (col >= 0 && col <= 14)) ||
        ((col === 6 || col === 7 || col === 8) && (row >= 0 && row <= 14))
      ) {
        // Exclure le centre
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) continue;
        
        // Exclure les cases de départ
        if ((row === 6 && col === 1) || (row === 1 && col === 8) || 
            (row === 13 && col === 6) || (row === 8 && col === 13)) continue;
            
        // Exclure les chemins finaux (cases colorées vers le centre)
        if ((row === 7 && col >= 1 && col <= 5) || 
            (col === 7 && row >= 1 && row <= 5) ||
            (row === 7 && col >= 9 && col <= 13) || 
            (col === 7 && row >= 9 && row <= 13)) continue;
            
        pathCells.push({row, col});
      }
    }
  }
  
  // Distribution fixe des événements selon les spécifications
  const eventDistribution: Record<string, 'quiz' | 'financement' | 'duel' | 'evenement'> = {};
  
  // Positions spécifiques pour les duels (4 cases stratégiques)
  const duelPositions = [
    {row: 6, col: 3}, {row: 3, col: 6}, {row: 11, col: 6}, {row: 6, col: 11}
  ];
  
  // Positions spécifiques pour les financements (8 cases bien réparties)
  const financementPositions = [
    {row: 6, col: 0}, {row: 6, col: 2}, {row: 0, col: 6}, {row: 2, col: 6},
    {row: 6, col: 12}, {row: 6, col: 14}, {row: 12, col: 6}, {row: 14, col: 6}
  ];
  
  // Assigner les duels
  duelPositions.forEach(pos => {
    if (pathCells.some(cell => cell.row === pos.row && cell.col === pos.col)) {
      eventDistribution[`${pos.row}-${pos.col}`] = 'duel';
    }
  });
  
  // Assigner les financements
  financementPositions.forEach(pos => {
    if (pathCells.some(cell => cell.row === pos.row && cell.col === pos.col)) {
      eventDistribution[`${pos.row}-${pos.col}`] = 'financement';
    }
  });
  
  // Assigner quiz et événements aux cases restantes
  pathCells.forEach((cell, index) => {
    const cellKey = `${cell.row}-${cell.col}`;
    if (!eventDistribution[cellKey]) {
      eventDistribution[cellKey] = index % 2 === 0 ? 'quiz' : 'evenement';
    }
  });
  
  return eventDistribution;
};

// Distribution fixe des événements (générée une seule fois)
const FIXED_EVENT_DISTRIBUTION = createFixedEventDistribution();

const GameBoard: React.FC<GameBoardProps> = ({
  cellSize,
  currentPlayer,
  pawns,
  activePlayers,
  pawnAnim,
  paths,
  onCellPress,
}) => {

  /**
   * Détermine le type de case à chaque position
   */
  const analyzeCellPosition = (row: number, col: number): Omit<Cell, 'id' | 'row' | 'col'> => {
    // Coin supérieur gauche de chaque maison
    if (row === 0 && col === 0) return { type: 'home', color: 'yellow' };
    if (row === 0 && col === 9) return { type: 'home', color: 'blue' };
    if (row === 9 && col === 0) return { type: 'home', color: 'green' };
    if (row === 9 && col === 9) return { type: 'home', color: 'red' };

    // Si dans une zone de maison mais pas la cellule principale → rien à rendre
    if (
      (row <= 5 && col <= 5) || // jaune
      (row <= 5 && col >= 9) || // bleu
      (row >= 9 && col <= 5) || // vert
      (row >= 9 && col >= 9)    // rouge
    ) {
      return { type: 'empty', color: 'empty' };
    }

    // Centre (3x3) : une seule grande case en (6,6)
    if (row === 6 && col === 6) return { type: 'center', color: 'center' };
    // Les autres cases du centre sont vides
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return { type: 'empty', color: 'empty' };

    // Chemins principaux et chemins spéciaux
    if (
      ((row === 6 || row === 7 || row === 8) && (col >= 0 && col <= 14)) ||
      ((col === 6 || col === 7 || col === 8) && (row >= 0 && row <= 14))
    ) {
      const pathInfo = getPathInfo(row, col);
      const cellKey = `${row}-${col}`;
      const eventType = FIXED_EVENT_DISTRIBUTION[cellKey];
      return { type: 'path', ...pathInfo, eventType };
    }

    // Autre : vide
    return { type: 'empty', color: 'empty' };
  };

  /**
   * Logique des chemins spéciaux, cases de départ, cases sûres, chemins finaux
   */
  const getPathInfo = (row: number, col: number): { color: string; isStart?: boolean; homeNumber?: number } => {
    // Cases de départ
    if (row === 6 && col === 1) return { color: 'yellow', isStart: true };
    if (row === 1 && col === 8) return { color: 'blue', isStart: true };
    if (row === 13 && col === 6) return { color: 'green', isStart: true };
    if (row === 8 && col === 13) return { color: 'red', isStart: true };

    // Chemins finaux (5 cases avant le centre) avec numéros 5 à 1
    // Jaune : row 7, col 1 à 5 → numéros 5, 4, 3, 2, 1
    if (row === 7 && col >= 1 && col <= 5) return { color: 'yellow', homeNumber: 6 - col };
    // Bleu : col 7, row 1 à 5 → numéros 5, 4, 3, 2, 1
    if (col === 7 && row >= 1 && row <= 5) return { color: 'blue', homeNumber: 6 - row };
    // Rouge : row 7, col 9 à 13 → numéros 5, 4, 3, 2, 1
    if (row === 7 && col >= 9 && col <= 13) return { color: 'red', homeNumber: col - 8 };
    // Vert : col 7, row 9 à 13 → numéros 5, 4, 3, 2, 1
    if (col === 7 && row >= 9 && row <= 13) return { color: 'green', homeNumber: row - 8 };

    // Chemin principal (neutre)
    return { color: 'neutral' };
  };

  /**
   * Génère la liste des cases à afficher (une par case visible)
   */
  const generateBoard = () => {
    const cells: Cell[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cellInfo = analyzeCellPosition(row, col);
        cells.push({ id: `${row}-${col}`, row, col, ...cellInfo });
      }
    }
    return cells;
  };

  const pawnImages: Record<string, any> = {
    yellow: require('../../assets/images/yellowpawn.png'),
    blue: require('../../assets/images/bluepawn.png'),
    green: require('../../assets/images/greenpawn.png'),
    red: require('../../assets/images/redpawn.png'),
  };

  const renderPawn = (color: string, size: number) => (
    <Image 
      source={pawnImages[color]} 
      style={{ width: size, height: size }} 
      resizeMode="contain"
    />
  );

  // Génère le plateau
  const board = generateBoard();

  // Style dynamique pour centrer le plateau
  const boardAbsoluteWrapper = {
    position: 'absolute' as const,
    top: '50%' as const,
    left: '50%' as const,
    transform: [
      { translateX: -0.5 * BOARD_SIZE * cellSize },
      { translateY: -0.5 * BOARD_SIZE * cellSize },
    ],
    zIndex: 5,
  };

  return (
    <View style={boardAbsoluteWrapper}>
      <View
        style={[
          styles.board,
          {
            width: cellSize * BOARD_SIZE,
            height: cellSize * BOARD_SIZE,
            borderWidth: 6,
            borderColor: '#fff',
            borderRadius: 10,
            overflow: 'hidden',
          },
        ]}
      >
        {board.map(cell => {
          // Pour chaque case, on cherche les pions à afficher
          const pionsSurCase: Array<'yellow' | 'blue' | 'red' | 'green'> = [];
          (['yellow', 'blue', 'red', 'green'] as const).forEach(color => {
            const pos = pawns[color];
            if (cell.type === 'home' && cell.color === color && pos === 'home') {
              pionsSurCase.push(color);
            } else if (cell.type === 'path' && typeof pos === 'number') {
              const posCoord = paths[color][pos];
              if (posCoord && cell.row === posCoord.row && cell.col === posCoord.col) {
                pionsSurCase.push(color);
              }
            }
          });
          return (
            <LudoCell
              key={cell.id}
              cell={cell}
              cellSize={cellSize}
              pions={pionsSurCase}
              currentPlayer={currentPlayer}
              onPress={() => onCellPress(cell)}
            />
          );
        })}
      </View>
      
      {/* Pions animés par-dessus le plateau */}
      <View 
        style={{ 
          position: 'absolute', 
          left: 0, 
          top: 0, 
          width: cellSize * BOARD_SIZE, 
          height: cellSize * BOARD_SIZE, 
          zIndex: 100 
        }} 
        pointerEvents="none"
      >
        {activePlayers.includes('yellow') && (
          <LudoPawn 
            color="yellow" 
            size={pawns.yellow === 'home' ? cellSize * 2.0 : cellSize * 1.0} 
            animatedPosition={pawnAnim.yellow} 
          />
        )}
        {activePlayers.includes('blue') && (
          <LudoPawn 
            color="blue" 
            size={pawns.blue === 'home' ? cellSize * 2.0 : cellSize * 1.0} 
            animatedPosition={pawnAnim.blue} 
          />
        )}
        {activePlayers.includes('red') && (
          <LudoPawn 
            color="red" 
            size={pawns.red === 'home' ? cellSize * 2.0 : cellSize * 1.0} 
            animatedPosition={pawnAnim.red} 
          />
        )}
        {activePlayers.includes('green') && (
          <LudoPawn 
            color="green" 
            size={pawns.green === 'home' ? cellSize * 2.0 : cellSize * 1.0} 
            animatedPosition={pawnAnim.green} 
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    position: 'relative',
  },
});

export default GameBoard;
export type { Cell };
