import React, { useState } from 'react';
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
  yellow: '#FFE44D', // Plus clair que FFD700
  blue: '#7B9EF3',   // Plus clair que 4169E1  
  green: '#90EE90',  // Plus clair que 32CD32
  red: '#FF7F7F',    // Plus clair que DC143C
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

// Emoji ou cercle pour représenter un pion
const pawnEmojis: Record<string, string> = {
  yellow: '🟡',
  blue: '🔵',
  green: '🟢',
  red: '🔴',
};

const BOARD_SIZE = 15;

const diceDots = [
  [],
  [[1, 1]],
  [[0, 0], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 0], [0, 2], [2, 0], [2, 2]],
  [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
];

const DiceFace = ({ value, size = 60 }: { value: number, size?: number }) => {
  // Grille 3x3
  return (
    <View style={{
      width: size,
      height: size,
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#333',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 6,
    }}>
      {[0, 1, 2].map(row =>
        <View key={row} style={{ flexDirection: 'row', flex: 1, width: '100%' }}>
          {[0, 1, 2].map(col => {
            const isDot = diceDots[value]?.some(([r, c]) => r === row && c === col);
            return (
              <View
                key={col}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDot ? (
                  <View style={{
                    width: size * 0.16,
                    height: size * 0.16,
                    borderRadius: size * 0.08,
                    backgroundColor: '#222',
                  }} />
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const LudoBoard: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const boardMaxSize = Math.min(width, height) * 0.95;
  const cellSize = Math.floor(boardMaxSize / BOARD_SIZE);

  // Ordre des joueurs et état du joueur courant
  const playerOrder: Array<'yellow' | 'blue' | 'red' | 'green'> = ['yellow', 'blue', 'red', 'green'];
  const [currentPlayer, setCurrentPlayer] = useState<'yellow' | 'blue' | 'red' | 'green'>('yellow');

  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const [pawns, setPawns] = useState({
    yellow: 3, // index de {row:6, col:4} dans paths.yellow
    blue: 'home' as 'home' | number,
    red: 'home' as 'home' | number,
    green: 'home' as 'home' | number,
  });

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
      const isCurrent = cell.color === currentPlayer;
      // Couleur de halo lumineuse pour chaque joueur
      const glowColors: Record<string, string> = {
        yellow: '#fffbe0',
        blue: '#e0ecff',
        green: '#e0ffe0',
        red: '#ffe0e0',
      };
      cellStyle = {
        ...cellStyle,
        width: cellSize * 6,
        height: cellSize * 6,
        backgroundColor: homeColors[cell.color],
        overflow: 'hidden',
        zIndex: 10,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        opacity: isCurrent ? 1 : 0.9,
        borderColor: isCurrent ? glowColors[cell.color] : '#333',
        borderWidth: isCurrent ? 6 : 1,
        // Effet lumineux (iOS + Android)
        ...(isCurrent
          ? {
              shadowColor: glowColors[cell.color],
              shadowOpacity: 0.9,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
              elevation: 16,
            }
          : {}),
      };
      return (
        <View key={cell.id} style={cellStyle}>
          {renderPawn(cell.color, cellSize * 0.8)}
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

  const renderPawn = (color: string, size: number) => (
    <Text style={{ fontSize: size, textAlign: 'center' }}>
      {pawnEmojis[color]}
    </Text>
  );

  // Lancer de dé et passage au joueur suivant
  const rollDice = () => {
    setRolling(true);
    let rolls = 0;
    const maxRolls = 12; // nombre de faces simulées
    const interval = setInterval(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      setDiceValue(value);
      rolls++;
      if (rolls >= maxRolls) {
        clearInterval(interval);
        setTimeout(() => {
          setRolling(false);
          setCurrentPlayer(prev => {
            const idx = playerOrder.indexOf(prev);
            return playerOrder[(idx + 1) % playerOrder.length];
          });
        }, 200);
      }
    }, 60);
  };

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
    <View style={styles.container}>
      {/* Plateau centré absolument au milieu de l'écran */}
      <View style={boardAbsoluteWrapper}>
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
      {/* Dé en bas de l'écran */}
      <View style={styles.diceContainer}>
        <View
          style={styles.diceTouchable}
          onTouchEnd={() => !rolling && rollDice()}
        >
          <DiceFace value={diceValue ?? 1} size={60} />
        </View>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  board: {
    position: 'relative',
  },
  diceContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  diceTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 10,
  },
});

export default LudoBoard;