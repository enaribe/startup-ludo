/**
 * PathCell - Case du chemin (circuit ou chemin final)
 *
 * Design basé sur l'image :
 * - Cases blanches par défaut
 * - Cases de sortie colorées par joueur (sans icône)
 * - Icônes pour les événements
 * - Icônes distribuées sur les cases normales vides
 * - Couleur du joueur pour les chemins finaux
 */

import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { PlayerColor } from '@/types';
import { COLORS } from '@/styles/colors';
import { QuizIcon, EventIcon, DuelIcon, FundingIcon } from './BoardIcons';

// Cases de départ → couleur du joueur
const START_COLOR: Record<number, PlayerColor> = {
  1: 'yellow',
  12: 'blue',
  23: 'red',
  34: 'green',
};

// Cycle d'icônes pour les cases normales (sans événement assigné)
const NORMAL_ICONS = ['quiz', 'funding', 'duel', 'event'] as const;

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
  // Position absolue de la case (centrée dans la cellule avec gap)
  const left = boardPadding + col * cellSize + 2;
  const top = boardPadding + row * cellSize + 2;

  // Cases finales adjacentes au centre (index 4) : invisibles
  const isHiddenFinal = finalInfo !== null && finalInfo.index === 4;
  if (isHiddenFinal) return null;

  // Déterminer si c'est une case de départ
  const isStart = eventType === 'start' && circuitIndex !== null;
  const startColor = isStart ? START_COLOR[circuitIndex] : null;

  // Déterminer la couleur de fond
  let backgroundColor = '#FFFFFF';
  let borderColor = 'rgba(0, 0, 0, 0.1)';

  if (startColor) {
    // Case de sortie — couleur du joueur
    backgroundColor = COLORS.players[startColor];
    borderColor = 'rgba(255, 255, 255, 0.3)';
  } else if (finalInfo) {
    // Chemin final — couleur du joueur
    backgroundColor = COLORS.players[finalInfo.color];
    borderColor = 'rgba(255, 255, 255, 0.3)';
  }

  if (isHighlighted) {
    borderColor = COLORS.primary;
  }

  // Rendu de l'icône selon le type
  const renderIcon = () => {
    if (circuitIndex === null) return null;
    // Pas d'icône sur les cases de départ
    if (isStart) return null;

    const iconSize = cellSize * 0.45;
    const iconStyle = { width: iconSize, height: iconSize, opacity: 0.65 };

    // Déterminer l'icône — cases avec événement assigné ou cases normales
    let iconType = eventType;
    if (eventType === 'normal') {
      // Distribuer une icône basée sur l'index du circuit
      iconType = NORMAL_ICONS[circuitIndex % NORMAL_ICONS.length] ?? 'event';
    }

    switch (iconType) {
      case 'quiz':
        return <View style={iconStyle}><QuizIcon /></View>;
      case 'funding':
        return <View style={iconStyle}><FundingIcon /></View>;
      case 'duel':
        return <View style={iconStyle}><DuelIcon /></View>;
      case 'opportunity':
      case 'challenge':
      case 'event':
        return <View style={iconStyle}><EventIcon /></View>;
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.cell,
        {
          left,
          top,
          width: cellSize - 4,
          height: cellSize - 4,
          backgroundColor,
          borderColor,
          borderWidth: isHighlighted ? 2 : 1,
        },
      ]}
    >
      {/* Icône d'événement */}
      {renderIcon()}

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
