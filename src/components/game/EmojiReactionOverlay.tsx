/**
 * EmojiReactionOverlay - Overlay d'animation pour les reactions emoji
 *
 * Affiche les emojis envoyes avec une animation expressive:
 * - L'emoji apparait en grand au centre
 * - Animation de scale puis montee avec fade out
 * - Nom du joueur affiche sous l'emoji
 */

import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import type { GameEmoji } from './EmojiReactionBar';

// ===== TYPES =====

export interface EmojiReaction {
  id: string;
  playerId: string;
  playerName: string;
  emoji: GameEmoji;
  timestamp: number;
}

// ===== PROPS =====

interface EmojiReactionOverlayProps {
  reactions: EmojiReaction[];
  onAnimationComplete: (reactionId: string) => void;
}

// ===== COMPOSANT PRINCIPAL =====

export const EmojiReactionOverlay = memo(function EmojiReactionOverlay({
  reactions,
  onAnimationComplete,
}: EmojiReactionOverlayProps) {
  if (reactions.length === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {reactions.map((reaction, index) => (
        <AnimatedEmoji
          key={reaction.id}
          reaction={reaction}
          onComplete={() => onAnimationComplete(reaction.id)}
          index={index}
        />
      ))}
    </View>
  );
});

// ===== EMOJI ANIME INDIVIDUEL =====

interface AnimatedEmojiProps {
  reaction: EmojiReaction;
  onComplete: () => void;
  index: number;
}

const AnimatedEmoji = memo(function AnimatedEmoji({
  reaction,
  onComplete,
  index,
}: AnimatedEmojiProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Delai leger pour les emojis multiples
    const delay = index * 100;

    // Animation d'entree: apparition avec rebond
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.4, { damping: 6, stiffness: 200 }),
        withSpring(1.0, { damping: 10 })
      )
    );

    // Legere rotation pour dynamisme
    rotation.value = withDelay(
      delay,
      withSequence(
        withSpring(-5),
        withSpring(5),
        withSpring(0)
      )
    );

    // Animation de sortie apres 1s
    const exitDelay = delay + 1000;

    translateY.value = withDelay(exitDelay, withTiming(-80, { duration: 600 }));

    opacity.value = withDelay(
      exitDelay,
      withTiming(0, { duration: 600 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  // Decalage vertical pour eviter superposition
  const offsetY = index * 60;

  return (
    <Animated.View style={[styles.emojiContainer, animatedStyle, { marginTop: offsetY }]}>
      <Text style={styles.bigEmoji}>{reaction.emoji}</Text>
      <View style={styles.playerNameContainer}>
        <Text style={styles.playerName}>{reaction.playerName}</Text>
      </View>
    </Animated.View>
  );
});

// ===== STYLES =====

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  emojiContainer: {
    alignItems: 'center',
    position: 'absolute',
  },
  bigEmoji: {
    fontSize: 80,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  playerNameContainer: {
    marginTop: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
