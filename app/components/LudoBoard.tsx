import React from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

/**
 * Plateau de Ludo : chaque zone de maison (6x6) est une seule grande case (image ou couleur),
 * le reste du plateau est une grille classique. Les cases sont positionnées en absolu.
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

// Configuration des zones de maison (6x6)
const homeZones = {
  yellow: { row: 0, col: 0 },
  blue: { row: 0, col: 9 },
  green: { row: 9, col: 0 },
  red: { row: 9, col: 9 },
};

// Images d'exemple pour chaque maison (à adapter selon vos assets)
const homeImages: Record<string, any> = {
  yellow: require('../../assets/images/ludo.jpeg'),
  blue: require('../../assets/images/ludo.jpeg'),
  green: require('../../assets/images/ludo.jpeg'),
  red: require('../../assets/images/ludo.jpeg'),
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

    // Centre (exemple)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return { type: 'center', color: 'center' };

    // Chemins principaux (croix complète)
    if (
      ((row === 6 || row === 7 || row === 8) && (col >= 0 && col <= 14)) ||
      ((col === 6 || col === 7 || col === 8) && (row >= 0 && row <= 14))
    ) {
      return { type: 'path', color: 'neutral' };
    }

    // Autre : vide
    return { type: 'empty', color: 'empty' };
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
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: '#333',
      backgroundColor: '#E0E0E0',
    };

    // Si c'est une maison, on agrandit la case
    if (cell.type === 'home') {
      cellStyle = {
        ...cellStyle,
        width: cellSize * 6,
        height: cellSize * 6,
        borderRadius: 24,
        borderWidth: 2,
        backgroundColor: undefined,
        overflow: 'hidden',
        zIndex: 10,
      };
      return (
        <View key={cell.id} style={cellStyle}>
          <Image
            source={homeImages[cell.color]}
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
          />
        </View>
      );
    }

    // Centre (exemple)
    if (cell.type === 'center') {
      return (
        <View key={cell.id} style={{ ...cellStyle, backgroundColor: '#FFD700' }}>
          <Text style={{ fontSize: cellSize * 0.7, fontWeight: 'bold', color: '#2c3e50' }}>★</Text>
        </View>
      );
    }

    // Chemin
    if (cell.type === 'path') {
      return (
        <View key={cell.id} style={{ ...cellStyle, backgroundColor: '#E0E0E0' }}>
          {/* Tu peux ajouter des symboles ou couleurs selon la logique de ton chemin */}
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