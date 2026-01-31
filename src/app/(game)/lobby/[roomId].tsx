/**
 * LobbyScreen - Salle d'attente multijoueur (redesign)
 *
 * Affiche les joueurs connectes dans une grille 2x2,
 * le code de la salle, et permet a l'hote de lancer la partie.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  Share,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { EmojiChat } from '@/components/game/EmojiChat';
import { Avatar } from '@/components/ui/Avatar';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import type { PlayerColor } from '@/types';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

// Color order for the 4 slots (matches the board layout)
const SLOT_COLORS: PlayerColor[] = ['green', 'yellow', 'blue', 'red'];

export default function LobbyScreen() {
  const { roomId, code, isHost } = useLocalSearchParams<{
    roomId: string;
    code: string;
    isHost: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useAuthStore();
  const {
    room,
    players,
    chatMessages,
    isLoading,
    leaveRoom,
    setReady,
    startGame,
    sendEmoji,
  } = useMultiplayer(user?.id ?? null);

  const [isReady, setIsReady] = useState(false);
  const isHostPlayer = isHost === 'true';

  // Pulse animation for the waiting indicator
  const pulseOpacity = useSharedValue(0.4);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Listen for game start (non-host players)
  useEffect(() => {
    if (room?.status === 'playing' && room.gameId) {
      router.replace({
        pathname: '/(game)/play/[gameId]',
        params: { gameId: room.gameId, mode: 'online', roomId: roomId ?? '' },
      });
    }
  }, [room?.status, room?.gameId, roomId, router]);

  const playersList = useMemo(() => {
    return Object.entries(players).map(([playerId, player]) => ({
      ...player,
      playerId,
    }));
  }, [players]);

  const maxPlayers = room?.maxPlayers ?? 4;
  const readyCount = useMemo(
    () => playersList.filter((p) => p.isReady || p.isHost).length,
    [playersList]
  );

  const allReady = useMemo(() => {
    if (playersList.length < 2) return false;
    return playersList.every((p) => p.isReady || p.isHost);
  }, [playersList]);

  const handleToggleReady = useCallback(async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setReady(newReady);
  }, [isReady, setReady]);

  const handleCopyCode = useCallback(async () => {
    if (code) {
      await Clipboard.setStringAsync(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [code]);

  const handleShareCode = useCallback(async () => {
    if (code) {
      try {
        await Share.share({
          message: `Rejoins ma partie Startup Ludo avec le code: ${code}`,
        });
      } catch {
        // Share cancelled
      }
    }
  }, [code]);

  const handleLeave = useCallback(async () => {
    Alert.alert(
      'Quitter la salle',
      'Es-tu sur de vouloir quitter la salle ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            await leaveRoom();
            router.replace('/(game)/online-hub');
          },
        },
      ]
    );
  }, [leaveRoom, router]);

  const handleStartGame = useCallback(async () => {
    if (!allReady) {
      Alert.alert('Attention', 'Tous les joueurs doivent etre prets');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const gameId = await startGame();

    if (gameId) {
      router.replace({
        pathname: '/(game)/play/[gameId]',
        params: { gameId, mode: 'online', roomId },
      });
    }
  }, [allReady, startGame, router, roomId]);

  const playersForChat = useMemo(() => {
    const result: Record<string, { name: string; color: PlayerColor }> = {};
    playersList.forEach((p) => {
      result[p.playerId] = { name: p.displayName ?? p.name ?? 'Joueur', color: p.color };
    });
    return result;
  }, [playersList]);

  // Build the slots: each slot is either a player or empty
  const slots = useMemo(() => {
    return SLOT_COLORS.slice(0, maxPlayers).map((slotColor) => {
      const player = playersList.find((p) => p.color === slotColor);
      return { color: slotColor, player: player ?? null };
    });
  }, [playersList, maxPlayers]);

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={handleLeave} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>SALLE D'ATTENTE</Text>
        <Pressable onPress={handleShareCode} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="share-outline" size={22} color="white" />
        </Pressable>
      </View>

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top + 72 }]}>
        {/* Room Code Chip */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.codeChipWrapper}>
          <Pressable onPress={handleCopyCode} style={styles.codeChip}>
            <Text style={styles.codeChipLabel}>CODE</Text>
            <Text style={styles.codeChipValue}>{code}</Text>
            <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
          </Pressable>
        </Animated.View>

        {/* Players Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.3)"
            boxWidth={contentWidth}
          >
            <View style={styles.gridContainer}>
              {/* Section Title */}
              <View style={styles.gridHeader}>
                <Text style={styles.gridTitle}>JOUEURS</Text>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>
                    {playersList.length}/{maxPlayers}
                  </Text>
                </View>
              </View>

              {/* 2-column grid of player slots */}
              <View style={styles.grid}>
                {slots.map((slot, index) => {
                  const playerColor = COLORS.players[slot.color];
                  const isOccupied = !!slot.player;
                  const isPlayerReady = slot.player?.isReady || slot.player?.isHost;

                  return (
                    <Animated.View
                      key={slot.color}
                      entering={FadeIn.delay(300 + index * 100).duration(400)}
                      style={styles.slotWrapper}
                    >
                      {isOccupied ? (
                        /* Occupied slot */
                        <View
                          style={[
                            styles.playerSlot,
                            {
                              borderColor: isPlayerReady
                                ? playerColor
                                : 'rgba(255, 255, 255, 0.1)',
                            },
                          ]}
                        >
                          {/* Color indicator bar */}
                          <View style={[styles.colorBar, { backgroundColor: playerColor }]} />

                          {/* Player info */}
                          <View style={styles.slotContent}>
                            <Avatar
                              name={slot.player!.displayName ?? slot.player!.name ?? 'Joueur'}
                              playerColor={slot.color}
                              size="md"
                            />
                            <Text style={styles.playerName} numberOfLines={1}>
                              {slot.player!.displayName ?? slot.player!.name ?? 'Joueur'}
                            </Text>

                            {/* Role tag */}
                            {slot.player!.isHost && (
                              <View style={[styles.roleTag, { backgroundColor: 'rgba(255, 188, 64, 0.15)' }]}>
                                <Ionicons name="star" size={10} color={COLORS.primary} />
                                <Text style={[styles.roleTagText, { color: COLORS.primary }]}>Hote</Text>
                              </View>
                            )}

                            {/* Ready status */}
                            <View style={styles.statusRow}>
                              {!slot.player!.isConnected ? (
                                <View style={[styles.statusDot, { backgroundColor: COLORS.error }]} />
                              ) : isPlayerReady ? (
                                <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                              ) : (
                                <Animated.View style={[styles.statusDot, { backgroundColor: COLORS.warning }, pulseStyle]} />
                              )}
                              <Text style={[
                                styles.statusText,
                                !slot.player!.isConnected && { color: COLORS.error },
                                isPlayerReady && { color: COLORS.success },
                              ]}>
                                {!slot.player!.isConnected
                                  ? 'Deconnecte'
                                  : isPlayerReady
                                    ? 'Pret'
                                    : 'En attente'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : (
                        /* Empty slot */
                        <View style={styles.emptySlot}>
                          <View style={[styles.emptySlotInner, { borderColor: `${playerColor}30` }]}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: `${playerColor}15` }]}>
                              <Ionicons name="person-add-outline" size={20} color={`${playerColor}60`} />
                            </View>
                            <Text style={[styles.emptySlotText, { color: `${playerColor}50` }]}>
                              En attente...
                            </Text>
                          </View>
                        </View>
                      )}
                    </Animated.View>
                  );
                })}
              </View>

              {/* Ready progress bar */}
              <View style={styles.readyBarContainer}>
                <View style={styles.readyBarTrack}>
                  <Animated.View
                    style={[
                      styles.readyBarFill,
                      {
                        width: playersList.length > 0
                          ? `${(readyCount / playersList.length) * 100}%`
                          : '0%',
                        backgroundColor: allReady ? COLORS.success : COLORS.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.readyBarText}>
                  {readyCount}/{playersList.length} prets
                </Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Spacer pushes bottom bar down */}
        <View style={{ flex: 1 }} />

        {/* Bottom Actions */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[3] }]}>
          {isHostPlayer ? (
            <GameButton
              variant="yellow"
              fullWidth
              title={isLoading ? 'CHARGEMENT...' : 'LANCER LA PARTIE'}
              loading={isLoading}
              disabled={!allReady || playersList.length < 2}
              onPress={handleStartGame}
            />
          ) : (
            <GameButton
              variant={isReady ? 'blue' : 'green'}
              fullWidth
              title={isReady ? 'ANNULER' : 'JE SUIS PRET !'}
              loading={isLoading}
              onPress={handleToggleReady}
            />
          )}

          {playersList.length < 2 && (
            <Text style={styles.hintText}>
              Minimum 2 joueurs requis pour commencer
            </Text>
          )}
          {!allReady && playersList.length >= 2 && (
            <Text style={styles.hintText}>
              En attente que tous les joueurs soient prets...
            </Text>
          )}
        </View>
      </View>

      {/* Emoji Chat */}
      <EmojiChat
        messages={chatMessages}
        players={playersForChat}
        onSendEmoji={sendEmoji}
        disabled={isLoading}
      />
    </View>
  );
}

// ===== STYLES =====

const SLOT_WIDTH = (contentWidth - SPACING[3] * 3) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── Header ───
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    letterSpacing: 0.5,
  },

  // ─── Content ───
  content: {
    flex: 1,
    paddingHorizontal: SPACING[4],
  },

  // ─── Code Chip ───
  codeChipWrapper: {
    alignItems: 'center',
    marginBottom: SPACING[4],
    marginTop: SPACING[2],
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 188, 64, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.25)',
    borderRadius: 24,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    gap: SPACING[2],
  },
  codeChipLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  codeChipValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    letterSpacing: 3,
  },

  // ─── Players Grid ───
  gridContainer: {
    padding: SPACING[3],
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  gridTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  counterBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
  },
  counterText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  slotWrapper: {
    width: SLOT_WIDTH,
  },

  // ─── Occupied Player Slot ───
  playerSlot: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    minHeight: 160,
  },
  colorBar: {
    height: 3,
    width: '100%',
  },
  slotContent: {
    alignItems: 'center',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[2],
    gap: SPACING[1],
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING[1],
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  roleTagText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    marginTop: SPACING[1],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },

  // ─── Empty Slot ───
  emptySlot: {
    minHeight: 160,
  },
  emptySlotInner: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
  },

  // ─── Ready Bar ───
  readyBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING[4],
    gap: SPACING[2],
  },
  readyBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  readyBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  readyBarText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },

  // ─── Bottom ───
  bottomBar: {
    paddingTop: SPACING[3],
  },
  hintText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING[2],
  },
});
