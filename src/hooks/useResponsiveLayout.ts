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

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= TABLET_BREAKPOINT;
    const scale = isTablet ? 1.4 : 1.0;

    // Board sizing
    const maxBoardSize = isTablet ? 650 : 400;
    const screenPadding = isTablet ? 32 : 16;
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
        screen: isTablet ? 24 : 8,
        board: isTablet ? 8 : 4,
      },
      sizes: {
        dice: isTablet ? 40 : 28,
        diceWrapper: isTablet ? 52 : 36,
        header: isTablet ? 84 : 72,
        footer: isTablet ? 80 : 70,
        playerCardHeight: isTablet ? 100 : 80,
      },
    };
  }, [width, height]);
}
