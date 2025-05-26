import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import LudoCell from './LudoCell';
import LudoDice from './LudoDice';
import LudoPawn from './LudoPawn';

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
    yellow: 'home' as 'home' | number,
    blue: 'home' as 'home' | number,
    red: 'home' as 'home' | number,
    green: 'home' as 'home' | number,
  });

  const [doitDeplacer, setDoitDeplacer] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [isAnimating, setIsAnimating] = useState(false);

  const [pawnAnim, setPawnAnim] = useState({
    yellow: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    blue: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    red: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    green: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
  });

  const [winner, setWinner] = useState<null | 'yellow' | 'blue' | 'red' | 'green'>(null);

  // Fonction utilitaire pour attendre un délai
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Fonction pour animer le déplacement case par case
  const animatePawnMove = async (color: 'yellow' | 'blue' | 'red' | 'green', from: number, to: number) => {
    setIsAnimating(true);
    let current = from;
    const step = from < to ? 1 : -1;
    while (current !== to) {
      current += step;
      await wait(150);
    }
    setIsAnimating(false);
  };

  // Fonction utilitaire pour obtenir la position pixel d'une case
  const getCellPosition = (color: 'yellow' | 'blue' | 'red' | 'green', pos: number | 'home') => {
    if (pos === 'home') {
      if (color === 'yellow') return { x: 0.5 * cellSize * 6, y: 0.5 * cellSize * 6 };
      if (color === 'blue') return { x: 0.5 * cellSize * 6 + cellSize * 9, y: 0.5 * cellSize * 6 };
      if (color === 'red') return { x: 0.5 * cellSize * 6 + cellSize * 9, y: 0.5 * cellSize * 6 + cellSize * 9 };
      if (color === 'green') return { x: 0.5 * cellSize * 6, y: 0.5 * cellSize * 6 + cellSize * 9 };
      return { x: 0, y: 0 };
    } else if (typeof pos === 'number' && paths[color][pos]) {
      const { row, col } = paths[color][pos];
      return { x: col * cellSize, y: row * cellSize };
    }
    return { x: 0, y: 0 };
  };

  // Met à jour la position animée d'un pion
  const movePawnAnimated = async (color: 'yellow' | 'blue' | 'red' | 'green', from: number, to: number) => {
    setIsAnimating(true);
    // Synchronise la position animée avec la position réelle avant de commencer
    const startCoords = getCellPosition(color, from);
    pawnAnim[color].setValue(startCoords);

    const step = from < to ? 1 : -1;
    let current = from;
    while (current !== to) {
      current += step;
      const pos = getCellPosition(color, current);
      await new Promise(resolve => {
        Animated.timing(pawnAnim[color], {
          toValue: { x: pos.x, y: pos.y },
          duration: 220,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }).start(() => resolve(true));
      });
      await wait(30);
    }
    // Met à jour la position logique du pion à la fin de l'animation
    setPawns(prev => ({ ...prev, [color]: to }));
    setIsAnimating(false);
  };

  // À l'initialisation ou quand pawns change, synchronise la position animée
  useEffect(() => {
    (['yellow', 'blue', 'red', 'green'] as const).forEach(color => {
      const pos = pawns[color];
      const coords = getCellPosition(color, pos);
      pawnAnim[color].setValue(coords || { x: 0, y: 0 });
    });
  }, [pawns]);

  // Chemin du pion jaune (parcours classique Ludo)
  const paths: Record<string, Array<{ row: number; col: number }>> = {
    yellow: [
      // Sortie maison jaune
      { row: 6, col: 1 },
      // Tour du plateau (56 cases sens horaire)
      { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
      { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 },
      { row: 1, col: 6 }, { row: 0, col: 6 }, { row: 0, col: 7 }, { row: 0, col: 8 },
      { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 },
      { row: 5, col: 8 }, { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 },
      { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 }, { row: 7, col: 14 },
      { row: 8, col: 14 }, { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 },
      { row: 8, col: 10 }, { row: 8, col: 9 }, { row: 9, col: 8 }, { row: 10, col: 8 },
      { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 }, { row: 14, col: 8 },
      { row: 14, col: 7 }, { row: 14, col: 6 }, { row: 13, col: 6 }, { row: 12, col: 6 },
      { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 5 },
      { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 },
      { row: 8, col: 0 }, { row: 7, col: 0 }, // Boucle complète
      // Chemin final jaune (6 cases)
      { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 },
      { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 },
      // Centre
      { row: 7, col: 7 }
    ],
    blue: [
      // Sortie maison bleue
      { row: 1, col: 8 },
      // Tour du plateau (56 cases sens horaire)
      { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 },
      { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 },
      { row: 6, col: 13 }, { row: 6, col: 14 }, { row: 7, col: 14 }, { row: 8, col: 14 },
      { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 },
      { row: 8, col: 9 }, { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 },
      { row: 12, col: 8 }, { row: 13, col: 8 }, { row: 14, col: 8 }, { row: 14, col: 7 },
      { row: 14, col: 6 }, { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 },
      { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 5 }, { row: 8, col: 4 },
      { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
      { row: 7, col: 0 }, { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 },
      { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 5, col: 6 },
      { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 },
      { row: 0, col: 6 }, { row: 0, col: 7 }, // Boucle complète
      // Chemin final bleu (6 cases)
      { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 },
      { row: 4, col: 7 }, { row: 5, col: 7 }, { row: 6, col: 7 },
      // Centre
      { row: 7, col: 7 }
    ],
    red: [
      // Sortie maison rouge
      { row: 8, col: 13 },
      // Tour du plateau (56 cases sens horaire)
      { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 },
      { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 },
      { row: 13, col: 8 }, { row: 14, col: 8 }, { row: 14, col: 7 }, { row: 14, col: 6 },
      { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 },
      { row: 9, col: 6 }, { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 },
      { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 }, { row: 7, col: 0 },
      { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 },
      { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 5, col: 6 }, { row: 4, col: 6 },
      { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
      { row: 0, col: 7 }, { row: 0, col: 8 }, { row: 1, col: 8 }, { row: 2, col: 8 },
      { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 9 },
      { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 },
      { row: 6, col: 14 }, { row: 7, col: 14 }, // Boucle complète
      // Chemin final rouge (6 cases)
      { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 },
      { row: 7, col: 10 }, { row: 7, col: 9 }, { row: 7, col: 8 },
      // Centre
      { row: 7, col: 7 }
    ],
    green: [
      // Sortie maison verte
      { row: 13, col: 6 },
      // Tour du plateau (56 cases sens horaire)
      { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 },
      { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 },
      { row: 8, col: 1 }, { row: 8, col: 0 }, { row: 7, col: 0 }, { row: 6, col: 0 },
      { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 },
      { row: 6, col: 5 }, { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 },
      { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 }, { row: 0, col: 7 },
      { row: 0, col: 8 }, { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 },
      { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 9 }, { row: 6, col: 10 },
      { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 },
      { row: 7, col: 14 }, { row: 8, col: 14 }, { row: 8, col: 13 }, { row: 8, col: 12 },
      { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 }, { row: 9, col: 8 },
      { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 },
      { row: 14, col: 8 }, { row: 14, col: 7 }, // Boucle complète
      // Chemin final vert (6 cases)
      { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 },
      { row: 10, col: 7 }, { row: 9, col: 7 }, { row: 8, col: 7 },
      // Centre
      { row: 7, col: 7 }
    ]
  };

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

    // Affichage des coordonnées en bas à droite
    const coordonnees = (
      <Text style={{
        position: 'absolute',
        right: 2,
        bottom: 2,
        fontSize: cellSize * 0.22,
        color: '#888',
        opacity: 0.7,
        zIndex: 100,
      }}>
        ({cell.row},{cell.col})
      </Text>
    );

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
          {coordonnees}
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
          {coordonnees}
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
          {coordonnees}
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

  // Fonction utilitaire pour vérifier si une case est sûre
  const isSafeCell = (row: number, col: number) => {
    // On utilise la logique de getPathInfo
    const info = getPathInfo(row, col);
    return info.isSafe === true;
  };

  // Fonction pour gérer la capture d'un pion adverse
  const handleCapture = (color: 'yellow' | 'blue' | 'red' | 'green', pos: number) => {
    const { row, col } = paths[color][pos];
    // Si la case n'est pas sûre ni une maison
    if (!isSafeCell(row, col)) {
      // Cherche s'il y a un pion adverse sur cette case
      const otherColors = playerOrder.filter(c => c !== color);
      let captured = null;
      for (const other of otherColors) {
        const otherPos = pawns[other];
        if (typeof otherPos === 'number') {
          const otherCoord = paths[other][otherPos];
          if (otherCoord && otherCoord.row === row && otherCoord.col === col) {
            captured = other;
            break;
          }
        }
      }
      if (captured) {
        setPawns(prev => ({ ...prev, [captured]: 'home' }));
        setMessage('Le pion ' + captured + ' a été capturé et retourne à la maison !');
      }
    }
  };

  // Fonction pour réinitialiser la partie
  const resetGame = () => {
    setPawns({
      yellow: 'home',
      blue: 'home',
      red: 'home',
      green: 'home',
    });
    setCurrentPlayer('yellow');
    setDiceValue(null);
    setRolling(false);
    setMessage(null);
    setIsAnimating(false);
    setWinner(null);
  };

  // Lancer de dé
  const rollDice = () => {
    if (doitDeplacer || isAnimating || winner) return;
    setRolling(true);
    let rolls = 0;
    const maxRolls = 12;
    let finalValue = 1;
    const interval = setInterval(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      setDiceValue(value);
      finalValue = value;
      rolls++;
      if (rolls >= maxRolls) {
        clearInterval(interval);
        setTimeout(async () => {
          setRolling(false);
          setDiceValue(finalValue);
          const pos = pawns[currentPlayer];
          const path = paths[currentPlayer];
          // Si le pion est à la maison et fait 6, il sort automatiquement
          if (pos === 'home' && finalValue === 6) {
            setMessage('Le pion sort de la maison !');
            setPawns(prev => ({ ...prev, [currentPlayer]: 0 }));
            await wait(200);
            handleCapture(currentPlayer, 0);
            setTimeout(() => {
              setMessage('Tu as fait 6, rejoue !');
            }, 400);
          } else if (typeof pos === 'number') {
            const newPos = pos + finalValue;
            // Vérifie si le pion peut atteindre exactement la case centrale (homer)
            if (newPos === path.length - 1) {
              setMessage('Bravo ! Tu es arrivé au centre !');
              await movePawnAnimated(currentPlayer, pos, newPos);
              setWinner(currentPlayer);
              return;
            } else if (newPos < path.length - 1) {
              setMessage('Le pion avance de ' + finalValue + ' case(s) !');
              await movePawnAnimated(currentPlayer, pos, newPos);
              handleCapture(currentPlayer, newPos);
              if (finalValue === 6) {
                setTimeout(() => {
                  setMessage('Tu as fait 6, rejoue !');
                }, 400);
              } else {
                setTimeout(() => {
                  setMessage(null);
                  setCurrentPlayer(prev => {
                    const idx = playerOrder.indexOf(prev);
                    return playerOrder[(idx + 1) % playerOrder.length];
                  });
                }, 800);
              }
            } else {
              setMessage('Déplacement impossible (fin du chemin), tour suivant.');
              setTimeout(() => {
                setMessage(null);
                setCurrentPlayer(prev => {
                  const idx = playerOrder.indexOf(prev);
                  return playerOrder[(idx + 1) % playerOrder.length];
                });
              }, 1200);
            }
          } else {
            setMessage('Vous devez faire 6 pour sortir de la maison.');
            setTimeout(() => {
              setMessage(null);
              setCurrentPlayer(prev => {
                const idx = playerOrder.indexOf(prev);
                return playerOrder[(idx + 1) % playerOrder.length];
              });
            }, 1200);
          }
        }, 200);
      }
    }, 60);
  };

  // Déplacement du pion (clic sur la case du pion)
  const handleCellPress = (cell: Cell) => {
    if (!doitDeplacer) return;
    const pos = pawns[currentPlayer];
    if (pos === 'home' && cell.type === 'home' && cell.color === currentPlayer && (diceValue ?? 1) === 6) {
      setPawns(prev => ({ ...prev, [currentPlayer]: 0 }));
      setDoitDeplacer(false);
      setMessage(null);
      handleCapture(currentPlayer, 0);
      if ((diceValue ?? 1) === 6) {
        setTimeout(() => {
          setMessage('Tu as fait 6, rejoue !');
        }, 200);
      } else {
        setCurrentPlayer(prev => {
          const idx = playerOrder.indexOf(prev);
          return playerOrder[(idx + 1) % playerOrder.length];
        });
      }
    } else if (typeof pos === 'number') {
      const path = paths[currentPlayer];
      const newPos = pos + (diceValue ?? 1);
      if (cell.type === 'path' && path[newPos] && cell.row === path[pos].row && cell.col === path[pos].col) {
        if (newPos < path.length) {
          setPawns(prev => ({ ...prev, [currentPlayer]: newPos }));
          setDoitDeplacer(false);
          setMessage(null);
          handleCapture(currentPlayer, newPos);
          if ((diceValue ?? 1) === 6) {
            setTimeout(() => {
              setMessage('Tu as fait 6, rejoue !');
            }, 200);
          } else {
            setCurrentPlayer(prev => {
              const idx = playerOrder.indexOf(prev);
              return playerOrder[(idx + 1) % playerOrder.length];
            });
          }
        } else {
          setMessage('Déplacement impossible (fin du chemin)');
        }
      }
    }
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
                onPress={() => handleCellPress(cell)}
              />
            );
          })}
        </View>
        {/* Pions animés par-dessus le plateau */}
        <View style={{ position: 'absolute', left: 0, top: 0, width: cellSize * BOARD_SIZE, height: cellSize * BOARD_SIZE, zIndex: 100 }} pointerEvents="none">
          <LudoPawn color="yellow" size={cellSize * 0.8} animatedPosition={pawnAnim.yellow} />
          <LudoPawn color="blue" size={cellSize * 0.8} animatedPosition={pawnAnim.blue} />
          <LudoPawn color="red" size={cellSize * 0.8} animatedPosition={pawnAnim.red} />
          <LudoPawn color="green" size={cellSize * 0.8} animatedPosition={pawnAnim.green} />
        </View>
      </View>
      {/* Dé en bas de l'écran */}
      <View style={styles.diceContainer}>
        <LudoDice value={diceValue ?? 1} rolling={rolling || isAnimating} onRoll={rollDice} size={60} />
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: homeColors[currentPlayer], marginTop: 4 }}>
          Tour du joueur : {currentPlayer.toUpperCase()}
        </Text>
        {message && (
          <Text style={{ color: '#e67e22', fontWeight: 'bold', marginTop: 8 }}>{message}</Text>
        )}
        {winner && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: homeColors[winner] }}>
              🎉 {winner.toUpperCase()} a gagné la partie ! 🎉
            </Text>
            <Text style={{ marginTop: 8 }} onPress={resetGame}>
              <Text style={{ color: '#2980b9', textDecorationLine: 'underline', fontSize: 16 }}>Rejouer</Text>
            </Text>
          </View>
        )}
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