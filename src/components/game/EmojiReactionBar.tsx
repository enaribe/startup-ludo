/**
 * EmojiReactionBar - Barre de reactions emoji pour le jeu
 *
 * Affiche 5 emojis en bas de l'ecran pour reagir pendant la partie.
 * Design compact et non intrusif.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';

// ===== EMOJIS DISPONIBLES =====

export const GAME_EMOJIS = ['👍', '👏', '😂', '😱', '🔥'] as const;
export type GameEmoji = (typeof GAME_EMOJIS)[number];

// ===== PROPS =====

interface EmojiReactionBarProps {
  onEmojiPress: (emoji: GameEmoji) => void;
  disabled?: boolean;
  /** Masquer/Afficher la barre */
  visible?: boolean;
}

// ===== COMPOSANT PRINCIPAL =====

export const EmojiReactionBar = memo(function EmojiReactionBar({
  onEmojiPress,
  disabled = false,
  visible = true,
}: EmojiReactionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded((prev) => !prev);
  }, []);

  const handlePress = useCallback(
    (emoji: GameEmoji) => {
      if (disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onEmojiPress(emoji);
      // Fermer apres envoi
      setIsExpanded(false);
    },
    [onEmojiPress, disabled]
  );

  if (!visible) return null;

  return (
    <View style={styles.wrapper}>
      {isExpanded ? (
        <Animated.View style={styles.container}>
          <Pressable onPress={handleToggle} style={styles.closeButton} hitSlop={8}>
            <Ionicons name="close" size={18} color={COLORS.textSecondary} />
          </Pressable>

          {GAME_EMOJIS.map((emoji) => (
            <EmojiButton
              key={emoji}
              emoji={emoji}
              onPress={handlePress}
              disabled={disabled}
            />
          ))}
        </Animated.View>
      ) : (
        <Pressable
          onPress={handleToggle}
          style={[styles.toggleButton, disabled && styles.toggleButtonDisabled]}
          disabled={disabled}
        >
          <Text style={styles.toggleEmoji}>😊</Text>
        </Pressable>
      )}
    </View>
  );
});

// ===== BOUTON EMOJI INDIVIDUEL =====

interface EmojiButtonProps {
  emoji: GameEmoji;
  onPress: (emoji: GameEmoji) => void;
  disabled?: boolean;
}

const EmojiButton = memo(function EmojiButton({ emoji, onPress, disabled }: EmojiButtonProps) {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSequence(withSpring(0.7), withSpring(1.1), withSpring(1));
    onPress(emoji);
  }, [emoji, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [styles.emojiButton, pressed && styles.emojiButtonPressed]}
    >
      <Animated.Text style={[styles.emoji, animatedStyle]}>{emoji}</Animated.Text>
    </Pressable>
  );
});

// ===== STYLES =====

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    backgroundColor: 'rgba(10, 25, 41, 0.95)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.2)',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: SPACING[1],
  },
  emojiButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  emojiButtonPressed: {
    backgroundColor: 'rgba(255, 188, 64, 0.25)',
  },
  emoji: {
    fontSize: 26,
  },
  toggleButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(10, 25, 41, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.3)',
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  toggleEmoji: {
    fontSize: 24,
  },
});
