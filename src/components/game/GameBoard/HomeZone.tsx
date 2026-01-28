/**
 * HomeZone - Zone maison du joueur avec PlayerCard intégrée
 *
 * Design basé sur l'image de référence :
 * - Zone colorée (6x6 cellules)
 * - Illustration de startup
 * - Informations du joueur (nom, avatar, jetons)
 * - Bordure verte si joueur actif
 */

import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Player, PlayerColor } from '@/types';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { BOARD_SIZE } from '@/config/boardConfig';

interface HomeZoneProps {
  color: PlayerColor;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: number;
  boardPadding: number;
  player?: Player;
  isCurrentPlayer?: boolean;
}

// Icônes de fallback par couleur
const STARTUP_ICONS: Record<PlayerColor, keyof typeof Ionicons.glyphMap> = {
  yellow: 'cube-outline',
  blue: 'phone-portrait-outline',
  red: 'flask-outline',
  green: 'leaf-outline',
};

export const HomeZone = memo(function HomeZone({
  color,
  position,
  size,
  boardPadding,
  player,
  isCurrentPlayer = false,
}: HomeZoneProps) {
  const playerColor = COLORS.players[color];
  const cellSize = size / 5; // 5 cellules pour zone maison

  // Position absolue selon le coin (grille 13x13, zones 5x5)
  let top = boardPadding;
  let left = boardPadding;

  switch (position) {
    case 'top-left':
      top = boardPadding;
      left = boardPadding;
      break;
    case 'top-right':
      top = boardPadding;
      left = boardPadding + cellSize * (BOARD_SIZE - 5);
      break;
    case 'bottom-left':
      top = boardPadding + cellSize * (BOARD_SIZE - 5);
      left = boardPadding;
      break;
    case 'bottom-right':
      top = boardPadding + cellSize * (BOARD_SIZE - 5);
      left = boardPadding + cellSize * (BOARD_SIZE - 5);
      break;
  }

  // Texte de phase (basé sur les tokens)
  const getPhaseText = () => {
    if (!player) return 'STARTUP';
    if (player.tokens >= 7) return 'SCALE-UP';
    if (player.tokens >= 4) return 'CROISSANCE';
    if (player.tokens >= 2) return 'VALIDATION';
    return 'IDÉATION';
  };

  return (
    <View
      style={[
        styles.container,
        {
          top,
          left,
          width: size,
          height: size,
          backgroundColor: playerColor,
          borderColor: isCurrentPlayer ? COLORS.success : 'transparent',
          borderWidth: isCurrentPlayer ? 3 : 0,
        },
      ]}
    >
      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Illustration (icône) */}
        <View style={styles.illustrationContainer}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={STARTUP_ICONS[color]}
              size={size * 0.25}
              color="rgba(255, 255, 255, 0.7)"
            />
          </View>
        </View>

        {/* Label "PRODUIT PHYSIQUE" ou similaire en vertical */}
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>PRODUIT</Text>
          <Text style={styles.labelText}>PHYSIQUE</Text>
        </View>
      </View>

      {/* PlayerCard en bas */}
      {player && (
        <View style={[styles.playerCard, { borderColor: playerColor }]}>
          {/* Avatar et nom */}
          <View style={styles.playerInfo}>
            <View style={[styles.avatar, { backgroundColor: playerColor }]}>
              {player.isAI ? (
                <Ionicons name="hardware-chip" size={16} color={COLORS.white} />
              ) : (
                <Ionicons name="person" size={16} color={COLORS.white} />
              )}
            </View>
            <View style={styles.playerDetails}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name.toUpperCase()}
              </Text>
              <Text style={styles.playerType}>
                {player.isAI ? 'Ordinateur' : 'Vous'}
              </Text>
            </View>
          </View>

          {/* Tokens */}
          <View style={styles.tokensContainer}>
            <View style={styles.tokensRow}>
              {[...Array(7)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.tokenDot,
                    {
                      backgroundColor: i < player.tokens ? playerColor : 'rgba(255, 255, 255, 0.2)',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.tokensText}>{player.tokens}/7</Text>
          </View>

          {/* Badge de phase */}
          <View style={[styles.phaseBadge, { backgroundColor: playerColor }]}>
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
          </View>
        </View>
      )}

      {/* Zone vide si pas de joueur */}
      {!player && (
        <View style={styles.emptyCard}>
          <Ionicons name="person-add" size={24} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.emptyText}>En attente</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: 8,
    position: 'relative',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  labelContainer: {
    position: 'absolute',
    right: 4,
    top: '15%',
    bottom: '15%',
    justifyContent: 'center',
  },
  labelText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs - 2,
    color: 'rgba(255, 255, 255, 0.9)',
    transform: [{ rotate: '90deg' }],
    width: 50,
    textAlign: 'center',
  },
  playerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 8,
    margin: 4,
    borderWidth: 2,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
  },
  playerType: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs - 2,
    color: COLORS.textMuted,
  },
  tokensContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tokensRow: {
    flexDirection: 'row',
    gap: 3,
  },
  tokenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tokensText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  phaseText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.white,
  },
  emptyCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
});
