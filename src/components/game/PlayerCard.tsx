/**
 * PlayerCard - Carte d'information joueur avec dé 3D intégré
 */

import { Dice } from '@/components/game/Dice';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS } from '@/styles/colors';
import { FONTS } from '@/styles/typography';
import type { Player } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  isCompact?: boolean;
  onPress?: () => void;
  diceValue?: number | null;
  isDiceRolling?: boolean;
  isDiceDisabled?: boolean;
  onRollDice?: () => number;
  onDiceComplete?: (value: number) => void;
}

export const PlayerCard = memo(function PlayerCard({
  player,
  isCurrentTurn,
  isCompact = false,
  onPress,
  diceValue = null,
  isDiceRolling = false,
  isDiceDisabled = true,
  onRollDice,
  onDiceComplete,
}: PlayerCardProps) {
  const { sizes } = useResponsiveLayout();
  const animScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // Pulse animation for current turn
  useEffect(() => {
    if (isCurrentTurn) {
      animScale.value = withSequence(
        withTiming(1.05, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      glowOpacity.value = withTiming(1, { duration: 300 });

      // Continuous subtle pulse
      const interval = setInterval(() => {
        animScale.value = withSequence(
          withTiming(1.02, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      }, 2000);

      return () => clearInterval(interval);
    }
    animScale.value = withSpring(1);
    glowOpacity.value = withTiming(0, { duration: 200 });
    return undefined;
  }, [isCurrentTurn, animScale, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animScale.value }],
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
        <View
          style={[
            styles.card,
            {
              borderColor: isCurrentTurn ? playerColor : 'transparent',
              borderWidth: isCurrentTurn ? 1 : 0,
            },
          ]}
        >
          {/* Top Row: User Info + Dice 3D */}
          <View style={styles.topRow}>
            <View style={styles.userInfo}>
              <Avatar
                name={player.name}
                source={player.avatar}
                playerColor={player.color}
                size="sm"
                showBorder={false}
              />
              <View style={styles.textContainer}>
                <Text style={styles.companyName}>concree</Text>
                <Text style={styles.userName} numberOfLines={1}>{player.name}</Text>
              </View>
            </View>

            {/* Dé 3D animé — visible uniquement quand c'est le tour de ce joueur */}
            {isCurrentTurn && (
              <View style={[styles.diceWrapper, { width: sizes.diceWrapper, height: sizes.diceWrapper }]}>
                <Dice
                  value={diceValue}
                  isRolling={isDiceRolling}
                  disabled={isDiceDisabled}
                  size={sizes.dice}
                  onRoll={onRollDice}
                  onRollComplete={onDiceComplete}
                />
              </View>
            )}
          </View>

          {/* Bottom Row: Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDots}>
              {[...Array(8)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: i < player.tokens ? playerColor : 'rgba(255, 255, 255, 0.1)',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressText}>{player.tokens}/8</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: '#1B314A',
    borderRadius: 14,
    padding: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  companyName: {
    fontFamily: FONTS.title,
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  userName: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  diceWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  progressDots: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  compactContainer: {},
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B314A',
    borderRadius: 12,
    padding: 8,
    gap: 6,
  },
  compactName: {
    fontFamily: FONTS.body,
    fontSize: 12,
    flex: 1,
  },
  compactTokens: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  compactTokenText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#FFFFFF',
  },
});
