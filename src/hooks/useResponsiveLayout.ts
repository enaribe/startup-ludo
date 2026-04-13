/**
 * useResponsiveLayout - Hook pour layout responsive téléphone/tablette
 *
 * Centralise tous les calculs de dimensions pour adapter le plateau
 * de jeu aux différentes tailles d'écran.
 */

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

interface ResponsiveLayout {
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
  boardSize: number;
  cellSize: number;
  boardPadding: number;
  scale: number;
  spacing: {
    screen: number;
    board: number;
  };
  sizes: {
    dice: number;
    diceWrapper: number;
    header: number;
    footer: number;
    playerCardHeight: number;
  };
}

const BOARD_GRID = 13; // Grille 13x13
const TABLET_BREAKPOINT = 600;
// Totem / grand écran portrait (>= 900px de large)
const LARGE_BREAKPOINT = 900;

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= TABLET_BREAKPOINT;
    const isLarge = width >= LARGE_BREAKPOINT;
    const scale = isLarge ? 1.8 : isTablet ? 1.4 : 1.0;

    // Board sizing — sur totem 1080px on laisse monter jusqu'à 880px
    const maxBoardSize = isLarge ? 880 : isTablet ? 650 : 400;
    const screenPadding = isLarge ? 48 : isTablet ? 32 : 16;
    const availableWidth = width - screenPadding;
    const boardSize = Math.min(availableWidth, maxBoardSize);
    const boardPadding = isTablet ? 6 : 4;
    const cellSize = (boardSize - boardPadding * 2) / BOARD_GRID;

    return {
      isTablet,
      screenWidth: width,
      screenHeight: height,
      boardSize,
      cellSize,
      boardPadding,
      scale,
      spacing: {
        screen: isLarge ? 40 : isTablet ? 24 : 8,
        board: isTablet ? 8 : 4,
      },
      sizes: {
        dice: isLarge ? 56 : isTablet ? 40 : 28,
        diceWrapper: isLarge ? 72 : isTablet ? 52 : 36,
        header: isLarge ? 120 : isTablet ? 84 : 72,
        footer: isLarge ? 112 : isTablet ? 80 : 70,
        playerCardHeight: isLarge ? 140 : isTablet ? 100 : 80,
      },
    };
  }, [width, height]);
}
