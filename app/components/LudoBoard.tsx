import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

/**
 * Composant LudoBoard
 * -------------------
 * Affiche un plateau de jeu de Ludo (ou "petits chevaux") sous forme de grille 15x15.
 * Les zones de maison sont dans les coins, le centre est une croix, et les chemins sont colorés.
 * Les cases de départ, les cases sûres et les chemins finaux sont gérés dynamiquement.
 */

// ===================== TYPES =====================

/**
 * Représente une cellule du plateau
 */
interface Cell {
  id: string; // identifiant unique (row-col)
  row: number;
  col: number;
  type: 'home' | 'center' | 'path' | 'empty'; // type de case
  color: string; // couleur principale de la case
  isStart?: boolean; // true si case de départ
  isSafe?: boolean;  // true si case sûre
}

/**
 * Représente une zone rectangulaire (utilisée pour les maisons)
 */
interface Zone {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/**
 * Configuration générale du plateau (zones, chemins, cases spéciales...)
 */
interface BoardConfig {
  size: number; // taille de la grille (15)
  homeZones: {
    yellow: Zone;
    blue: Zone;
    green: Zone;
    red: Zone;
  };
  center: {
    rows: number[];
    cols: number[];
  };
  mainPaths: {
    horizontal: { row: number; startCol: number; endCol: number };
    vertical: { col: number; startRow: number; endRow: number };
  };
  startingSquares: {
    yellow: { row: number; col: number };
    blue: { row: number; col: number };
    green: { row: number; col: number };
    red: { row: number; col: number };
  };
  safeCells: Array<{ row: number; col: number }>;
}

// ===================== CONFIGURATION DU PLATEAU =====================

/**
 * Configuration statique du plateau (zones, chemins, cases spéciales)
 */
const BOARD_CONFIG: BoardConfig = {
  size: 15,
  homeZones: {
    yellow: { startRow: 0, startCol: 0, endRow: 5, endCol: 5 },
    blue: { startRow: 0, startCol: 9, endRow: 5, endCol: 14 },
    green: { startRow: 9, startCol: 0, endRow: 14, endCol: 5 },
    red: { startRow: 9, startCol: 9, endRow: 14, endCol: 14 }
  },
  center: { rows: [6, 7, 8], cols: [6, 7, 8] },
  mainPaths: {
    horizontal: { row: 7, startCol: 0, endCol: 14 },
    vertical: { col: 7, startRow: 0, endRow: 14 }
  },
  // Cases de départ (une par couleur)
  startingSquares: {
    yellow: { row: 6, col: 1 },
    blue: { row: 1, col: 8 },
    green: { row: 13, col: 6 },
    red: { row: 8, col: 13 }
  },
  // Cases sûres (une par "bras" de la croix)
  safeCells: [
    { row: 2, col: 6 },
    { row: 6, col: 12 },
    { row: 12, col: 8 },
    { row: 8, col: 2 }
  ]
};

// ===================== COMPOSANT PRINCIPAL =====================

const LudoBoard: React.FC = () => {
  // Récupère la taille de l'écran pour adapter dynamiquement la taille du plateau
  const { width, height } = useWindowDimensions();

  // Calcul de la taille maximale du plateau (95% de la plus petite dimension)
  const boardMaxSize = Math.min(width, height) * 0.95;
  // Taille d'une case (en pixels)
  const cellSize = Math.floor(boardMaxSize / BOARD_CONFIG.size);

  /**
   * Génère la grille complète du plateau (15x15)
   * Retourne un tableau de lignes, chaque ligne étant un tableau de cellules
   */
  const generateBoard = () => {
    const cells: Cell[][] = [];
    for (let row = 0; row < 15; row++) {
      const rowCells: Cell[] = [];
      for (let col = 0; col < 15; col++) {
        const cellInfo = analyzeCellPosition(row, col);
        rowCells.push({ id: `${row}-${col}`, row, col, ...cellInfo });
      }
      cells.push(rowCells);
    }
    return cells;
  };

  /**
   * Détermine le type et la couleur d'une cellule selon sa position
   * @param row Ligne de la cellule
   * @param col Colonne de la cellule
   */
  const analyzeCellPosition = (row: number, col: number): Omit<Cell, 'id' | 'row' | 'col'> => {
    // Zones de maison
    if (isInYellowHome(row, col)) return { type: 'home', color: 'yellow' };
    if (isInBlueHome(row, col)) return { type: 'home', color: 'blue' };
    if (isInGreenHome(row, col)) return { type: 'home', color: 'green' };
    if (isInRedHome(row, col)) return { type: 'home', color: 'red' };
    // Centre
    if (isInCenter(row, col)) return { type: 'center', color: 'center' };
    // Chemins principaux et chemins finaux
    if (isMainPath(row, col)) {
      const pathInfo = getPathInfo(row, col);
      return { type: 'path', ...pathInfo };
    }
    // Case vide (hors plateau)
    return { type: 'empty', color: 'empty' };
  };

  // ===================== FONCTIONS DE VÉRIFICATION DE ZONE =====================

  /**
   * Vérifie si la cellule est dans la zone de maison jaune
   */
  const isInYellowHome = (row: number, col: number) => row <= 5 && col <= 5;
  /**
   * Vérifie si la cellule est dans la zone de maison bleue
   */
  const isInBlueHome = (row: number, col: number) => row <= 5 && col >= 9;
  /**
   * Vérifie si la cellule est dans la zone de maison verte
   */
  const isInGreenHome = (row: number, col: number) => row >= 9 && col <= 5;
  /**
   * Vérifie si la cellule est dans la zone de maison rouge
   */
  const isInRedHome = (row: number, col: number) => row >= 9 && col >= 9;
  /**
   * Vérifie si la cellule est dans le centre du plateau
   */
  const isInCenter = (row: number, col: number) => row >= 6 && row <= 8 && col >= 6 && col <= 8;
  /**
   * Vérifie si la cellule est sur un des bras de la croix (chemin principal ou final)
   */
  const isMainPath = (row: number, col: number) => {
    if (row === 6 || row === 7 || row === 8) return (col >= 0 && col <= 5) || (col >= 9 && col <= 14);
    if (col === 6 || col === 7 || col === 8) return (row >= 0 && row <= 5) || (row >= 9 && row <= 14);
    return false;
  };

  // ===================== CHEMINS SPÉCIAUX ET CASES SPÉCIALES =====================

  /**
   * Retourne les infos de chemin pour une cellule (couleur, départ, case sûre...)
   * @returns couleur, isStart, isSafe
   */
  const getPathInfo = (row: number, col: number): { color: string; isStart?: boolean; isSafe?: boolean } => {
    // Cases de départ (une par couleur)
    if (row === 6 && col === 1) return { color: 'yellow', isStart: true, isSafe: false };
    if (row === 1 && col === 8) return { color: 'blue', isStart: true, isSafe: false };
    if (row === 13 && col === 6) return { color: 'green', isStart: true, isSafe: false };
    if (row === 8 && col === 13) return { color: 'red', isStart: true, isSafe: false };
    if (row === 7 && col === 1) return { color: 'yellow', isStart: false, isSafe: false };
    if (row === 1 && col === 7) return { color: 'blue', isStart: false, isSafe: false };
    if (row === 7 && col === 13) return { color: 'red', isStart: false, isSafe: false };
    if (row === 13 && col === 7) return { color: 'green', isStart: false, isSafe: false };
    // Cases sûres (une par "bras")
    const isSafeCell = BOARD_CONFIG.safeCells.some(safe => safe.row === row && safe.col === col);
    if (isSafeCell) return { color: 'safe', isStart: false, isSafe: true };
    // Chemins finaux (5 cases avant le centre)
    if (row === 7 && col >= 2 && col <= 6) return { color: 'yellow', isStart: false, isSafe: false };
    if (col === 7 && row >= 2 && row <= 6) return { color: 'blue', isStart: false, isSafe: false };
    if (row === 7 && col >= 8 && col <= 12) return { color: 'red', isStart: false, isSafe: false };
    if (col === 7 && row >= 8 && row <= 12) return { color: 'green', isStart: false, isSafe: false };
    // Chemin principal (neutre)
    return { color: 'neutral', isStart: false, isSafe: false };
  };

  // ===================== RENDU D'UNE CELLULE =====================

  /**
   * Rendu visuel d'une cellule du plateau
   */
  const renderCell = (cell: Cell) => {
    const backgroundColor = getCellColor(cell);
    const symbol = getCellSymbol(cell);
    return (
      <View
        key={cell.id}
        style={[
          styles.cell,
          { backgroundColor, width: cellSize, height: cellSize }
        ]}
      >
        <Text style={[styles.cellText, { fontSize: cellSize * 0.5 }]}>{symbol}</Text>
      </View>
    );
  };

  /**
   * Retourne la couleur de fond d'une cellule selon son type et sa couleur
   */
  const getCellColor = (cell: Cell): string => {
    const colors: Record<string, string> = {
      yellow: '#FFD700',
      blue: '#4169E1',
      green: '#32CD32',
      red: '#DC143C',
      safe: '#90EE90',
      neutral: '#E0E0E0',
      center: '#FFD700',
      empty: '#F5F5F5'
    };
    if (cell.type === 'home') return colors[cell.color];
    if (cell.type === 'center') return colors.center;
    if (cell.isSafe) return colors.safe;
    if (cell.isStart) return colors[cell.color];
    if (cell.type === 'path') return cell.color !== 'neutral' ? colors[cell.color] : colors.neutral;
    return colors.empty;
  };

  /**
   * Retourne le symbole à afficher dans la cellule (optionnel)
   */
  const getCellSymbol = (cell: Cell): string => {
    if (cell.type === 'center') return '★';
    if (cell.isSafe) return '△';
    if (cell.isStart) return '●';
    if (cell.type === 'home') return '♦';
    return '';
  };

  // ===================== RENDU DU PLATEAU =====================

  const board = generateBoard();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.board,
          {
            width: cellSize * BOARD_CONFIG.size,
            height: cellSize * BOARD_CONFIG.size
          }
        ]}
      >
        {board.map((rowCells, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {rowCells.map(cell => renderCell(cell))}
          </View>
        ))}
      </View>
    </View>
  );
};

// ===================== STYLES =====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  board: {
    // plus de padding, tout est géré par la taille dynamique
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontWeight: 'bold',
  },
});

export default LudoBoard;