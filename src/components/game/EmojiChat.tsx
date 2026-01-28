/**
 * EmojiChat - Composant de chat par emojis pour le multijoueur
 *
 * Affiche les emojis reçus et permet d'en envoyer pendant la partie.
 * Optimisé pour ne pas distraire du gameplay.
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ChatMessage } from '@/services/multiplayer';
import type { PlayerColor } from '@/types';

// ===== EMOJIS DISPONIBLES =====

const EMOJI_CATEGORIES = {
  reactions: ['👍', '👏', '🎉', '😄', '😮', '😅'],
  emotions: ['🔥', '💪', '🤔', '😎', '🙈', '😤'],
  game: ['🎲', '🏆', '💰', '🚀', '⭐', '💡'],
} as const;

const ALL_EMOJIS = [
  ...EMOJI_CATEGORIES.reactions,
  ...EMOJI_CATEGORIES.emotions,
  ...EMOJI_CATEGORIES.game,
];

// ===== PROPS =====

interface EmojiChatProps {
  messages: ChatMessage[];
  players: Record<string, { name: string; color: PlayerColor }>;
  onSendEmoji: (emoji: string) => void;
  disabled?: boolean;
}

// ===== COMPOSANT PRINCIPAL =====

export const EmojiChat = memo(function EmojiChat({
  messages,
  players,
  onSendEmoji,
  disabled = false,
}: EmojiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentMessages, setRecentMessages] = useState<(ChatMessage & { key: string })[]>([]);

  const buttonScale = useSharedValue(1);

  // Ajouter les nouveaux messages avec animation
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // Éviter les doublons
    const exists = recentMessages.some((m) => m.id === lastMessage.id);
    if (exists) return;

    const newMessage = { ...lastMessage, key: `${lastMessage.id}_${Date.now()}` };

    setRecentMessages((prev) => [...prev.slice(-4), newMessage]);

    // Supprimer après 3 secondes
    setTimeout(() => {
      setRecentMessages((prev) => prev.filter((m) => m.key !== newMessage.key));
    }, 3000);
  }, [messages]);

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen((prev) => !prev);

    buttonScale.value = withSequence(
      withSpring(0.8),
      withSpring(1)
    );
  }, []);

  const handleSelectEmoji = useCallback(
    (emoji: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSendEmoji(emoji);
      setIsOpen(false);

      buttonScale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
    },
    [onSendEmoji]
  );

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Messages flottants */}
      <View style={styles.messagesContainer}>
        {recentMessages.map((message) => (
          <FloatingEmoji
            key={message.key}
            message={message}
            playerName={players[message.playerId]?.name ?? 'Joueur'}
            playerColor={players[message.playerId]?.color ?? 'yellow'}
          />
        ))}
      </View>

      {/* Sélecteur d'emojis */}
      {isOpen && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.picker}
        >
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Envoyer un emoji</Text>
            <Pressable onPress={handleToggle} hitSlop={8}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.emojiGrid}>
            {ALL_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.emojiButton}
                onPress={() => handleSelectEmoji(emoji)}
                disabled={disabled}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Bouton principal */}
      <Animated.View style={buttonAnimatedStyle}>
        <Pressable
          style={[
            styles.mainButton,
            isOpen && styles.mainButtonActive,
            disabled && styles.mainButtonDisabled,
          ]}
          onPress={handleToggle}
          disabled={disabled}
        >
          <Ionicons
            name={isOpen ? 'close' : 'chatbubble-ellipses'}
            size={24}
            color={isOpen ? COLORS.text : COLORS.primary}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
});

// ===== EMOJI FLOTTANT =====

interface FloatingEmojiProps {
  message: ChatMessage;
  playerName: string;
  playerColor: PlayerColor;
}

const FloatingEmoji = memo(function FloatingEmoji({
  message,
  playerName,
  playerColor,
}: FloatingEmojiProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Animation d'entrée puis fade out
    translateY.value = withSequence(
      withSpring(-10),
      withTiming(0, { duration: 200 })
    );

    // Fade out avant suppression
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const playerColorHex = COLORS.players[playerColor];

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      style={[styles.floatingEmoji, animatedStyle]}
    >
      <View style={[styles.playerIndicator, { backgroundColor: playerColorHex }]} />
      <Text style={styles.playerName}>{playerName}</Text>
      <Text style={styles.floatingEmojiText}>{message.emoji}</Text>
    </Animated.View>
  );
});

// ===== STYLES =====

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: SPACING[4],
    bottom: SPACING[4],
    alignItems: 'flex-end',
  },

  messagesContainer: {
    position: 'absolute',
    right: 0,
    bottom: 60,
    width: SCREEN_WIDTH * 0.5,
    maxWidth: 200,
  },

  floatingEmoji: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[2],
    alignSelf: 'flex-end',
  },

  playerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING[2],
  },

  playerName: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginRight: SPACING[2],
    maxWidth: 80,
  },

  floatingEmojiText: {
    fontSize: 20,
  },

  picker: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING[3],
    marginBottom: SPACING[3],
    width: SCREEN_WIDTH * 0.7,
    maxWidth: 280,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },

  pickerTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },

  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  emojiButton: {
    width: '16.66%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[1],
  },

  emojiText: {
    fontSize: 28,
  },

  mainButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  mainButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  mainButtonDisabled: {
    opacity: 0.5,
  },
});
