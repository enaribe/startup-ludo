/**
 * LobbyScreen - Salle d'attente multijoueur
 *
 * Affiche les joueurs connectés, leur statut "prêt",
 * et permet à l'hôte de lancer la partie.
 */

import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, Alert, Share, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { EmojiChat } from '@/components/game/EmojiChat';
import type { PlayerColor } from '@/types';

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

  // Convertir players en array pour l'affichage
  const playersList = useMemo(() => {
    return Object.entries(players).map(([playerId, player]) => ({
      ...player,
      playerId,
    }));
  }, [players]);

  // Vérifier si tous les joueurs sont prêts
  const allReady = useMemo(() => {
    if (playersList.length < 2) return false;
    return playersList.every((p) => p.isReady || p.isHost);
  }, [playersList]);

  // Gérer le statut prêt
  const handleToggleReady = useCallback(async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setReady(newReady);
  }, [isReady, setReady]);

  // Copier le code
  const handleCopyCode = useCallback(async () => {
    if (code) {
      await Clipboard.setStringAsync(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copié !', 'Le code a été copié dans le presse-papiers');
    }
  }, [code]);

  // Partager le code
  const handleShareCode = useCallback(async () => {
    if (code) {
      try {
        await Share.share({
          message: `Rejoins ma partie Startup Ludo avec le code: ${code}`,
        });
      } catch {
        // Partage annulé
      }
    }
  }, [code]);

  // Quitter la room
  const handleLeave = useCallback(async () => {
    Alert.alert(
      'Quitter la salle',
      'Es-tu sûr de vouloir quitter la salle ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            await leaveRoom();
            router.replace('/(game)/online-setup');
          },
        },
      ]
    );
  }, [leaveRoom, router]);

  // Lancer la partie (hôte uniquement)
  const handleStartGame = useCallback(async () => {
    if (!allReady) {
      Alert.alert('Attention', 'Tous les joueurs doivent être prêts');
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

  // Convertir les players pour EmojiChat
  const playersForChat = useMemo(() => {
    const result: Record<string, { name: string; color: PlayerColor }> = {};
    playersList.forEach((p) => {
      result[p.playerId] = { name: p.displayName ?? p.name ?? 'Joueur', color: p.color };
    });
    return result;
  }, [playersList]);

  // Obtenir la couleur du joueur
  const getPlayerColorHex = (color: PlayerColor): string => {
    return COLORS.players[color] ?? COLORS.primary;
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
        }}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.header}
        >
          <Pressable onPress={handleLeave} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>

          <Text style={styles.title}>Salle d'attente</Text>

          <View style={{ width: 24 }} />
        </Animated.View>

        {/* Code de la salle */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.codeSection}
        >
          <Card variant="elevated" padding={4}>
            <Text style={styles.codeLabel}>Code de la salle</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{code}</Text>
              <View style={styles.codeActions}>
                <Pressable onPress={handleCopyCode} style={styles.codeButton}>
                  <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                </Pressable>
                <Pressable onPress={handleShareCode} style={styles.codeButton}>
                  <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                </Pressable>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Liste des joueurs */}
        <ScrollView
          style={styles.playersScrollView}
          contentContainerStyle={styles.playersContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={styles.sectionTitle}>
              Joueurs ({playersList.length}/{room?.maxPlayers ?? 4})
            </Text>

            {playersList.length === 0 ? (
              <Card variant="default" padding={4}>
                <Text style={styles.emptyText}>En attente de joueurs...</Text>
              </Card>
            ) : (
              playersList.map((player, index) => (
                <Animated.View
                  key={player.playerId}
                  entering={FadeIn.delay(400 + index * 100).duration(300)}
                >
                  <Card variant="default" padding={4} style={styles.playerCard}>
                    <View style={styles.playerRow}>
                      {/* Indicateur de couleur */}
                      <View
                        style={[
                          styles.colorIndicator,
                          { backgroundColor: getPlayerColorHex(player.color) },
                        ]}
                      />

                      {/* Info joueur */}
                      <View style={styles.playerInfo}>
                        <View style={styles.playerNameRow}>
                          <Text style={styles.playerName}>{player.name}</Text>
                          {player.isHost && (
                            <View style={styles.hostBadge}>
                              <Ionicons name="star" size={12} color={COLORS.warning} />
                              <Text style={styles.hostText}>Hôte</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.playerStatus}>
                          {player.isConnected ? 'Connecté' : 'Déconnecté'}
                        </Text>
                      </View>

                      {/* Statut prêt */}
                      <View
                        style={[
                          styles.readyBadge,
                          player.isReady || player.isHost
                            ? styles.readyBadgeActive
                            : styles.readyBadgeInactive,
                        ]}
                      >
                        <Ionicons
                          name={player.isReady || player.isHost ? 'checkmark' : 'time'}
                          size={16}
                          color={
                            player.isReady || player.isHost
                              ? COLORS.success
                              : COLORS.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.readyText,
                            player.isReady || player.isHost
                              ? styles.readyTextActive
                              : styles.readyTextInactive,
                          ]}
                        >
                          {player.isHost ? 'Hôte' : player.isReady ? 'Prêt' : 'En attente'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              ))
            )}
          </Animated.View>
        </ScrollView>

        {/* Actions */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.actions}
        >
          {isHostPlayer ? (
            <Button
              title="Lancer la partie"
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={!allReady || playersList.length < 2}
              onPress={handleStartGame}
              leftIcon={<Ionicons name="play" size={20} color={COLORS.white} />}
            />
          ) : (
            <Button
              title={isReady ? 'Annuler' : 'Je suis prêt !'}
              variant={isReady ? 'outline' : 'primary'}
              fullWidth
              loading={isLoading}
              onPress={handleToggleReady}
              leftIcon={
                <Ionicons
                  name={isReady ? 'close' : 'checkmark'}
                  size={20}
                  color={isReady ? COLORS.primary : COLORS.white}
                />
              }
            />
          )}

          {!allReady && playersList.length >= 2 && (
            <Text style={styles.waitingText}>
              En attente que tous les joueurs soient prêts...
            </Text>
          )}

          {playersList.length < 2 && (
            <Text style={styles.waitingText}>
              Minimum 2 joueurs requis pour commencer
            </Text>
          )}
        </Animated.View>

        {/* Chat Emojis */}
        <EmojiChat
          messages={chatMessages}
          players={playersForChat}
          onSendEmoji={sendEmoji}
          disabled={isLoading}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[4],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  codeSection: {
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[4],
  },
  codeLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  codeButton: {
    padding: SPACING[2],
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  playersScrollView: {
    flex: 1,
  },
  playersContent: {
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[4],
  },
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  playerCard: {
    marginBottom: SPACING[3],
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING[3],
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
  },
  playerStatus: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
  },
  readyBadgeActive: {
    backgroundColor: COLORS.successLight,
  },
  readyBadgeInactive: {
    backgroundColor: COLORS.surfaceVariant,
  },
  readyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
  },
  readyTextActive: {
    color: COLORS.success,
  },
  readyTextInactive: {
    color: COLORS.textSecondary,
  },
  actions: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  waitingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING[3],
  },
});
