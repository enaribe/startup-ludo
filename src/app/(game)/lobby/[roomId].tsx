/**
 * LobbyScreen - Salle d'attente multijoueur
 *
 * Affiche les joueurs connectes, leur statut "pret",
 * et permet a l'hote de lancer la partie.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmojiChat } from '@/components/game/EmojiChat';
import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useAuthStore } from '@/stores/useAuthStore';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { PlayerColor } from '@/types';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

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
      Alert.alert('Copie !', 'Le code a ete copie');
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

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={handleLeave} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>SALLE D'ATTENTE</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Code */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={contentWidth}
          >
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>CODE DE LA SALLE</Text>
              <Text style={styles.codeText}>{code}</Text>
              <View style={styles.codeActions}>
                <Pressable onPress={handleCopyCode} style={styles.codeAction}>
                  <Ionicons name="copy-outline" size={18} color="#FFBC40" />
                  <Text style={styles.codeActionText}>Copier</Text>
                </Pressable>
                <Pressable onPress={handleShareCode} style={styles.codeAction}>
                  <Ionicons name="share-outline" size={18} color="#FFBC40" />
                  <Text style={styles.codeActionText}>Partager</Text>
                </Pressable>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Players list */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: SPACING[5] }}>
          <Text style={styles.playersLabel}>
            JOUEURS ({playersList.length}/{room?.maxPlayers ?? 4})
          </Text>

          <View style={{ gap: SPACING[3] }}>
            {playersList.length === 0 ? (
              <DynamicGradientBorder
                borderRadius={16}
                fill="rgba(10, 25, 41, 0.6)"
                boxWidth={contentWidth}
              >
                <View style={styles.emptyPlayers}>
                  <Ionicons name="hourglass-outline" size={24} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>En attente de joueurs...</Text>
                </View>
              </DynamicGradientBorder>
            ) : (
              playersList.map((player, index) => (
                <Animated.View
                  key={player.playerId}
                  entering={FadeIn.delay(300 + index * 100).duration(300)}
                >
                  <DynamicGradientBorder
                    borderRadius={16}
                    fill={player.isHost ? 'rgba(255, 188, 64, 0.08)' : 'rgba(10, 25, 41, 0.6)'}
                    boxWidth={contentWidth}
                  >
                    <View style={styles.playerCard}>
                      <Avatar
                        name={player.displayName ?? player.name ?? 'Joueur'}
                        playerColor={player.color}
                        size="md"
                      />
                      <View style={{ flex: 1, marginLeft: SPACING[3] }}>
                        <Text style={styles.playerName}>
                          {player.displayName ?? player.name ?? 'Joueur'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1] }}>
                          {player.isHost && (
                            <View style={styles.hostBadge}>
                              <Ionicons name="star" size={10} color="#FFBC40" />
                              <Text style={styles.hostText}>Hote</Text>
                            </View>
                          )}
                          <Text style={styles.connectionStatus}>
                            {player.isConnected ? 'Connecte' : 'Deconnecte'}
                          </Text>
                        </View>
                      </View>

                      <View style={[
                        styles.readyBadge,
                        (player.isReady || player.isHost) && styles.readyBadgeActive,
                      ]}>
                        <Ionicons
                          name={player.isReady || player.isHost ? 'checkmark' : 'time'}
                          size={14}
                          color={player.isReady || player.isHost ? '#4CAF50' : 'rgba(255,255,255,0.5)'}
                        />
                        <Text style={[
                          styles.readyText,
                          (player.isReady || player.isHost) && styles.readyTextActive,
                        ]}>
                          {player.isHost ? 'Hote' : player.isReady ? 'Pret' : 'En attente'}
                        </Text>
                      </View>
                    </View>
                  </DynamicGradientBorder>
                </Animated.View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
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

        {!allReady && playersList.length >= 2 && (
          <Text style={styles.waitingText}>
            En attente que tous les joueurs soient prets...
          </Text>
        )}

        {playersList.length < 2 && (
          <Text style={styles.waitingText}>
            Minimum 2 joueurs requis pour commencer
          </Text>
        )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
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
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: 'white',
    letterSpacing: 0.5,
  },
  codeSection: {
    alignItems: 'center',
    padding: SPACING[5],
    minWidth: 280,
    alignSelf: 'stretch',
    marginHorizontal: -SPACING[4],
  },
  codeLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: SPACING[2],
  },
  codeText: {
    fontFamily: FONTS.title,
    fontSize: 32,
    color: '#FFBC40',
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[3],
  },
  codeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: 20,
    gap: SPACING[1],
  },
  codeActionText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFBC40',
  },
  playersLabel: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: 'white',
    marginBottom: SPACING[3],
  },
  emptyPlayers: {
    alignItems: 'center',
    padding: SPACING[5],
    gap: SPACING[2],
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
  },
  playerName: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: 'white',
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  hostText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#FFBC40',
  },
  connectionStatus: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
  },
  readyBadgeActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  readyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  readyTextActive: {
    color: '#4CAF50',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
  },
  waitingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: SPACING[2],
  },
});
