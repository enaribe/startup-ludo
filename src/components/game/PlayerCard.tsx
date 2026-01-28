/**
 * PlayerCard - Carte d'information joueur
 *
 * Utilise le nouveau système PawnState
 */

import { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { Player } from '@/types';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { Avatar } from '@/components/ui/Avatar';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  isCompact?: boolean;
  onPress?: () => void;
}

export const PlayerCard = memo(function PlayerCard({
  player,
  isCurrentTurn,
  isCompact = false,
  onPress,
}: PlayerCardProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // Compteurs basés sur le nouveau système PawnState
  const pawnsAtHome = player.pawns.filter(p => p.status === 'home').length;
  const pawnsOnBoard = player.pawns.filter(p => p.status === 'circuit' || p.status === 'final').length;
  const pawnsFinished = player.pawns.filter(p => p.status === 'finished').length;

  // Pulse animation for current turn
  useEffect(() => {
    if (isCurrentTurn) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      glowOpacity.value = withTiming(1, { duration: 300 });

      // Continuous subtle pulse
      const interval = setInterval(() => {
        scale.value = withSequence(
          withTiming(1.02, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      }, 2000);

      return () => clearInterval(interval);
    }
    scale.value = withSpring(1);
    glowOpacity.value = withTiming(0, { duration: 200 });
    return undefined;
  }, [isCurrentTurn, scale, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const playerColor = COLORS.players[player.color];

  if (isCompact) {
    return (
      <Animated.View style={[styles.compactContainer, animatedStyle]}>
        <Pressable onPress={onPress} disabled={!onPress}>
          <View
            style={[
              styles.compactCard,
              {
                borderColor: isCurrentTurn ? playerColor : COLORS.border,
                borderWidth: isCurrentTurn ? 2 : 1,
              },
            ]}
          >
            <Avatar
              name={player.name}
              playerColor={player.color}
              size="sm"
            />
            <Text
              style={[styles.compactName, { color: isCurrentTurn ? playerColor : COLORS.text }]}
              numberOfLines={1}
            >
              {player.name}
            </Text>
            <View style={styles.compactTokens}>
              <Ionicons name="cash" size={12} color={COLORS.primary} />
              <Text style={styles.compactTokenText}>{player.tokens}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable onPress={onPress} disabled={!onPress}>
        {/* Glow effect */}
        {isCurrentTurn && (
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: playerColor },
              glowStyle,
            ]}
          />
        )}

        <View
          style={[
            styles.card,
            {
              borderColor: isCurrentTurn ? playerColor : COLORS.border,
              borderWidth: isCurrentTurn ? 2 : 1,
            },
          ]}
        >
          {/* Player Info */}
          <View style={styles.header}>
            <Avatar
              name={player.name}
              source={player.avatar}
              playerColor={player.color}
              size="md"
              showBorder={isCurrentTurn}
            />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {player.name}
                </Text>
                {player.isAI && (
                  <View style={styles.aiBadge}>
                    <Ionicons name="hardware-chip" size={12} color={COLORS.background} />
                  </View>
                )}
              </View>
              {isCurrentTurn && (
                <Text style={[styles.turnIndicator, { color: playerColor }]}>
                  C'est ton tour !
                </Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            {/* Tokens */}
            <View style={styles.stat}>
              <Ionicons name="cash" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{player.tokens}</Text>
              <Text style={styles.statLabel}>Jetons</Text>
            </View>

            {/* Pawns indicator */}
            <View style={styles.stat}>
              <View style={styles.pawnsIndicator}>
                {[0, 1, 2, 3].map((i) => {
                  // Couleur selon l'état du pion
                  let dotColor: string;
                  if (i < pawnsOnBoard) {
                    dotColor = playerColor; // Sur le plateau
                  } else if (i < pawnsOnBoard + pawnsAtHome) {
                    dotColor = 'rgba(255, 255, 255, 0.3)'; // À la maison
                  } else {
                    dotColor = COLORS.success; // Terminé
                  }

                  return (
                    <View
                      key={i}
                      style={[
                        styles.pawnDot,
                        { backgroundColor: dotColor },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.statLabel}>Pions</Text>
            </View>

            {/* Finished */}
            <View style={styles.stat}>
              <Ionicons name="flag" size={16} color={COLORS.success} />
              <Text style={styles.statValue}>{pawnsFinished}</Text>
              <Text style={styles.statLabel}>Arrivés</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING[2],
  },
  compactContainer: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    opacity: 0.2,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING[4],
  },
  compactCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING[2],
    alignItems: 'center',
    gap: SPACING[1],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  info: {
    flex: 1,
    marginLeft: SPACING[3],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  compactName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  aiBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 4,
    marginLeft: SPACING[2],
  },
  turnIndicator: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  compactTokens: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  compactTokenText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  pawnsIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  pawnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
