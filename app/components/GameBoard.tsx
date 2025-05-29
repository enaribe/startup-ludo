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
  eventType?: 'quiz' | 'financement' | 'duel' | 'opportunite' | 'challenge';
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
 * Distribution identique à celle de useGameLogic.ts
 */
const createFixedEventDistribution = (): Record<string, 'quiz' | 'financement' | 'duel' | 'opportunite' | 'challenge'> => {
  // Distribution fixe et déterministe pour tous les jeux
  const fixedDistribution: Record<string, 'quiz' | 'financement' | 'duel' | 'opportunite' | 'challenge'> = {
    // Ligne horizontale du haut (row 6, de gauche à droite)
    '6-0': 'financement',
    // '6-1': PAS D'ÉVÉNEMENT - case de départ yellow
    '6-2': 'quiz',
    '6-3': 'opportunite', 
    '6-4': 'quiz',
    '6-5': 'challenge',
    '6-9': 'quiz',
    '6-10': 'duel',
    '6-11': 'quiz',
    '6-12': 'opportunite',
    '6-13': 'quiz',  // Nouvelle case avec événement
    '6-14': 'financement',
    
    // Ligne horizontale du bas (row 8, de droite à gauche)
    '8-14': 'quiz',
    // '8-13': PAS D'ÉVÉNEMENT - case de départ red
    '8-12': 'quiz',
    '8-11': 'opportunite',
    '8-10': 'quiz',
    '8-9': 'duel',
    '8-5': 'quiz',
    '8-4': 'challenge',
    '8-3': 'quiz',
    '8-2': 'opportunite',
    '8-1': 'quiz',
    '8-0': 'financement',
    
    // Ligne verticale de gauche (col 6, de haut en bas)
    '0-6': 'quiz',
    '1-6': 'challenge',
    '2-6': 'quiz',
    '3-6': 'duel',
    '4-6': 'quiz',
    '5-6': 'opportunite',
    '9-6': 'quiz',
    '10-6': 'challenge',
    '11-6': 'quiz',
    '12-6': 'opportunite',
    // '13-6': PAS D'ÉVÉNEMENT - case de départ green
    '14-6': 'financement',
    
    // Ligne verticale de droite (col 8, de bas en haut)
    '14-8': 'quiz',
    '13-8': 'opportunite',
    '12-8': 'quiz',
    '11-8': 'challenge',
    '10-8': 'quiz',
    '9-8': 'duel',
    '5-8': 'quiz',
    '4-8': 'opportunite',
    '3-8': 'quiz',
    '2-8': 'challenge',
    // '1-8': PAS D'ÉVÉNEMENT - case de départ blue
    '0-8': 'quiz',
    
    // Angles spéciaux
    '0-7': 'quiz',    // Entre les lignes verticales en haut
    '14-7': 'quiz',   // Entre les lignes verticales en bas  
    '7-0': 'quiz',    // Entre les lignes horizontales à gauche
    '7-14': 'quiz',   // Entre les lignes horizontales à droite
    
    // Cases de transition importantes
    '7-1': 'financement',  // Entrée chemin final yellow
    '1-7': 'financement',  // Entrée chemin final blue
    '7-13': 'financement', // Entrée chemin final red
    '13-7': 'financement', // Entrée chemin final green
  };
  
  console.log('Distribution FIXE GameBoard créée avec répartition équilibrée');
  
  // Compter les types pour vérification
  const counts = { quiz: 0, financement: 0, duel: 0, opportunite: 0, challenge: 0 };
  Object.values(fixedDistribution).forEach(type => counts[type]++);
  console.log('Répartition GameBoard des événements:', counts);
  
  return fixedDistribution;
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
            borderWidth: 1,
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
            size={pawns.yellow === 'home' ? cellSize * 2.0 : cellSize * 1.3} 
            animatedPosition={pawnAnim.yellow} 
          />
        )}
        {activePlayers.includes('blue') && (
          <LudoPawn 
            color="blue" 
            size={pawns.blue === 'home' ? cellSize * 2.0 : cellSize * 1.3} 
            animatedPosition={pawnAnim.blue} 
          />
        )}
        {activePlayers.includes('red') && (
          <LudoPawn 
            color="red" 
            size={pawns.red === 'home' ? cellSize * 2.0 : cellSize * 1.3} 
            animatedPosition={pawnAnim.red} 
          />
        )}
        {activePlayers.includes('green') && (
          <LudoPawn 
            color="green" 
            size={pawns.green === 'home' ? cellSize * 2.0 : cellSize * 1.3} 
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
