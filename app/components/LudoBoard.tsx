import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

/**
 * Plateau de Ludo : chaque zone de maison (6x6) est une seule grande case colorée,
 * le reste du plateau est une grille classique avec chemins colorés, cases de départ, cases sûres, etc.
 */

// Types
interface Cell {
  id: string;
  row: number;
  col: number;
  type: 'home' | 'center' | 'path' | 'empty';
  color: string;
  isStart?: boolean;
  isSafe?: boolean;
}

// Couleurs des maisons
const homeColors: Record<string, string> = {
  yellow: '#FFD700',
  blue: '#4169E1',
  green: '#32CD32',
  red: '#DC143C',
};

// Couleurs des chemins
const pathColors: Record<string, string> = {
  yellow: '#FFFACD',
  blue: '#B0C4DE',
  green: '#90EE90',
  red: '#FFC0CB',
  safe: '#90EE90',
  neutral: '#fff',
  center: '#FFD700',
  empty: '#F5F5F5',
};

const BOARD_SIZE = 15;

const LudoBoard: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const boardMaxSize = Math.min(width, height) * 0.95;
  const cellSize = Math.floor(boardMaxSize / BOARD_SIZE);

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
      return { type: 'path', ...pathInfo };
    }

    // Autre : vide
    return { type: 'empty', color: 'empty' };
  };

  /**
   * Logique des chemins spéciaux, cases de départ, cases sûres, chemins finaux
   */
  const getPathInfo = (row: number, col: number): { color: string; isStart?: boolean; isSafe?: boolean } => {
    // Cases de départ
    if (row === 6 && col === 1) return { color: 'yellow', isStart: true, isSafe: false };
    if (row === 1 && col === 8) return { color: 'blue', isStart: true, isSafe: false };
    if (row === 13 && col === 6) return { color: 'green', isStart: true, isSafe: false };
    if (row === 8 && col === 13) return { color: 'red', isStart: true, isSafe: false };
    

    // Cases sûres (exemple, à adapter selon ton plateau)
    if (
      (row === 2 && col === 6) ||
      (row === 6 && col === 12) ||
      (row === 12 && col === 8) ||
      (row === 8 && col === 2)
    ) {
      return { color: 'safe', isSafe: true };
    }

    // Chemins finaux (5 cases avant le centre)
    if (row === 7 && col >= 1 && col <= 5) return { color: 'yellow' };
    if (col === 7 && row >= 1 && row <= 5) return { color: 'blue' };
    if (row === 7 && col >= 9 && col <= 13) return { color: 'red' };
    if (col === 7 && row >= 9 && row <= 13) return { color: 'green' };
    

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

  /**
   * Rendu d'une case (grande maison ou case normale)
   */
  const renderCell = (cell: Cell) => {
    if (cell.type === 'empty') return null;

    const cellLeft = cell.col * cellSize;
    const cellTop = cell.row * cellSize;

    // Style de base
    let cellStyle: any = {
      left: cellLeft,
      top: cellTop,
      width: cellSize,
      height: cellSize,
      position: 'absolute' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 0.5,
      borderColor: '#333',
      backgroundColor: pathColors.neutral,
    };

    // Si c'est une maison, on agrandit la case et on met la couleur
    if (cell.type === 'home') {
      cellStyle = {
        ...cellStyle,
        width: cellSize * 6,
        height: cellSize * 6,
        // borderRadius: 24,
        borderWidth: 1,
        backgroundColor: homeColors[cell.color],
        overflow: 'hidden',
        zIndex: 10,
      };
      return (
        <View key={cell.id} style={cellStyle}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: cellSize * 1, textShadowColor: '#333', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 }}>
            {cell.color.toUpperCase()}
          </Text>
        </View>
      );
    }

    // Centre
    if (cell.type === 'center') {
      // Grande case centrale 3x3
      const cellStyleCenter = {
        left: cell.col * cellSize,
        top: cell.row * cellSize,
        width: cellSize * 3,
        height: cellSize * 3,
        position: 'absolute' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        backgroundColor: pathColors.center,
        borderWidth: 1,
        borderColor: '#333',
        zIndex: 20,
      };
      return (
        <View key={cell.id} style={cellStyleCenter}>
          <Text style={{ fontSize: cellSize * 1.5, fontWeight: 'bold', color: '#2c3e50' }}>★</Text>
        </View>
      );
    }

    // Chemin
    if (cell.type === 'path') {
      let bg = pathColors[cell.color] || pathColors.neutral;
      let symbol = '';
      if (cell.isStart) symbol = '●';
      if (cell.isSafe) symbol = '△';
      return (
        <View key={cell.id} style={{ ...cellStyle, backgroundColor: bg }}>
          {symbol ? (
            <Text style={{ fontSize: cellSize * 0.5, fontWeight: 'bold', color: '#2c3e50' }}>{symbol}</Text>
          ) : null}
        </View>
      );
    }

    return null;
  };

  // Génère le plateau
  const board = generateBoard();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.board,
          {
            width: cellSize * BOARD_SIZE,
            height: cellSize * BOARD_SIZE,
          },
        ]}
      >
        {board.map(cell => renderCell(cell))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  board: {
    position: 'relative',
  },
});

export default LudoBoard;