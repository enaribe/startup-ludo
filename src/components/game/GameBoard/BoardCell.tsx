/**
 * BoardCell - Cellule individuelle du plateau
 *
 * Gère le rendu des différents types de cellules :
 * - home: Zone maison (rendu par HomeZone séparément)
 * - path: Circuit principal avec événements
 * - final: Chemin final coloré
 * - center: Zone centrale (rendu par CenterZone)
 * - empty: Cellule vide (non rendue)
 */

import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlayerColor } from '@/types';
import { COLORS } from '@/styles/colors';
import type { CellEventType } from '@/config/boardConfig';

interface BoardCellProps {
  row: number;
  col: number;
  cellSize: number;
  type: 'home' | 'path' | 'final' | 'center' | 'empty';
  eventType?: string;
  homeColor?: PlayerColor;
  finalColor?: PlayerColor;
  isHighlighted?: boolean;
}

// Icônes pour les types d'événements
const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  quiz: 'help-circle',
  funding: 'cash',
  duel: 'flash',
  opportunity: 'trending-up',
  challenge: 'warning',
  start: 'flag',
  safe: 'star',
};

// Couleurs pour les types d'événements
const EVENT_COLORS: Record<string, string> = {
  quiz: '#4A90E2',
  funding: '#50C878',
  duel: '#FF6B6B',
  opportunity: '#FFB347',
  challenge: '#9B59B6',
  start: '#2ECC71',
  safe: '#FFD700',
  normal: 'rgba(255, 255, 255, 0.15)',
};

export const BoardCell = memo(function BoardCell({
  row: _row,
  col: _col,
  cellSize,
  type,
  eventType,
  homeColor: _homeColor,
  finalColor,
  isHighlighted = false,
}: BoardCellProps) {
  // Ne pas rendre les cellules vides, home ou center (gérées séparément)
  if (type === 'empty' || type === 'home' || type === 'center') {
    return (
      <View
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
          },
        ]}
      />
    );
  }

  // Cellule du chemin final
  if (type === 'final' && finalColor) {
    return (
      <View
        style={[
          styles.cell,
          styles.finalCell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: COLORS.players[finalColor],
            borderColor: isHighlighted ? COLORS.white : 'rgba(255, 255, 255, 0.3)',
            borderWidth: isHighlighted ? 2 : 1,
          },
        ]}
      >
        {isHighlighted && <View style={styles.highlightGlow} />}
      </View>
    );
  }

  // Cellule du circuit principal
  const cellEventType = eventType as CellEventType | undefined;
  const backgroundColor = cellEventType
    ? EVENT_COLORS[cellEventType] ?? EVENT_COLORS.normal
    : EVENT_COLORS.normal;

  const icon = cellEventType ? EVENT_ICONS[cellEventType] : undefined;
  const isStartCell = cellEventType === 'start';
  const isSafeCell = cellEventType === 'safe';

  return (
    <View
      style={[
        styles.cell,
        styles.pathCell,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor,
          borderColor: isHighlighted ? COLORS.white : 'rgba(255, 255, 255, 0.2)',
          borderWidth: isHighlighted ? 2 : 1,
        },
        (isStartCell || isSafeCell) && styles.specialCell,
      ]}
    >
      {/* Icône d'événement */}
      {icon && (
        <Ionicons
          name={icon}
          size={cellSize * 0.45}
          color="rgba(255, 255, 255, 0.9)"
        />
      )}

      {/* Effet de surbrillance */}
      {isHighlighted && <View style={styles.highlightGlow} />}
    </View>
  );
});

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
  },
  pathCell: {
    borderRadius: 4,
  },
  finalCell: {
    opacity: 0.8,
  },
  specialCell: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  highlightGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
  },
});
