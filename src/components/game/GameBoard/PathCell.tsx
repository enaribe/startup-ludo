/**
 * PathCell - Case du chemin (circuit ou chemin final)
 *
 * Design basé sur l'image :
 * - Cases blanches par défaut
 * - Icônes pour les événements
 * - Couleur du joueur pour les chemins finaux
 */

import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlayerColor } from '@/types';
import { COLORS } from '@/styles/colors';

interface PathCellProps {
  row: number;
  col: number;
  cellSize: number;
  boardPadding: number;
  circuitIndex: number | null;
  finalInfo: { color: PlayerColor; index: number } | null;
  eventType: string;
  isHighlighted?: boolean;
}

// Icônes pour les types d'événements
const EVENT_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  quiz: { name: 'help-circle', color: '#4A90E2' },
  funding: { name: 'cash', color: '#50C878' },
  duel: { name: 'flash', color: '#FF6B6B' },
  opportunity: { name: 'trending-up', color: '#FFB347' },
  challenge: { name: 'warning', color: '#9B59B6' },
  start: { name: 'flag', color: '#2ECC71' },
};

export const PathCell = memo(function PathCell({
  row,
  col,
  cellSize,
  boardPadding,
  circuitIndex,
  finalInfo,
  eventType,
  isHighlighted = false,
}: PathCellProps) {
  // Position absolue de la case
  const left = boardPadding + col * cellSize;
  const top = boardPadding + row * cellSize;

  // Déterminer la couleur de fond
  let backgroundColor = '#FFFFFF'; // Blanc par défaut pour le circuit
  let borderColor = 'rgba(0, 0, 0, 0.1)';

  if (finalInfo) {
    // Chemin final - couleur du joueur
    backgroundColor = COLORS.players[finalInfo.color];
    borderColor = 'rgba(255, 255, 255, 0.3)';
  }

  if (isHighlighted) {
    borderColor = COLORS.primary;
  }

  // Icône de l'événement
  const eventIcon = EVENT_ICONS[eventType];

  return (
    <View
      style={[
        styles.cell,
        {
          left,
          top,
          width: cellSize - 2,
          height: cellSize - 2,
          backgroundColor,
          borderColor,
          borderWidth: isHighlighted ? 2 : 1,
        },
      ]}
    >
      {/* Icône d'événement */}
      {eventIcon && circuitIndex !== null && (
        <Ionicons
          name={eventIcon.name}
          size={cellSize * 0.5}
          color={eventIcon.color}
        />
      )}

      {/* Indicateur de highlight */}
      {isHighlighted && (
        <View style={styles.highlightOverlay} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  cell: {
    position: 'absolute',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  highlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 4,
  },
});
