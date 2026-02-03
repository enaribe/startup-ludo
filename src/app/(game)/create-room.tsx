/**
 * create-room - Creer un salon
 *
 * Phase 1: Formulaire de configuration (nom, joueurs, edition, mise)
 * Phase 2: Salle d'attente avec code, liste joueurs, bouton demarrer
 */

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useAuthStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

export default function CreateRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    challenge?: string;
    roomId?: string;
    code?: string;
    isHost?: string;
    quickMatch?: string;
  }>();

  const user = useAuthStore((state) => state.user);
  const {
    room,
    players,
    isLoading,
    createRoom,
    leaveRoom,
    startGame,
  } = useMultiplayer(user?.id ?? null);

  const isWaitingRoom = !!params.roomId;
  const isQuickMatch = params.quickMatch === 'true';
  const [showLobby, setShowLobby] = useState(isWaitingRoom);

  // Helper function to format room code
  const formatRoomCode = (code: string) => {
    if (code.length >= 8) {
      return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    }
    return code;
  };

  // Form states
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  const [selectedEdition] = useState(params.challenge || 'classic');
  const [betAmount] = useState(250);

  // Waiting room states
  const [roomCode, setRoomCode] = useState(params.code ? formatRoomCode(params.code) : '');
  const [currentRoomId, setCurrentRoomId] = useState(params.roomId || '');

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

  // Listen for game start (room status change to 'playing')
  useEffect(() => {
    if (room?.status === 'playing' && room.gameId) {
      router.replace({
        pathname: '/(game)/game-preparation',
        params: { gameId: room.gameId, roomId: currentRoomId, mode: 'online' },
      });
    }
  }, [room?.status, room?.gameId, currentRoomId, router]);

  // Auto-start for quick match
  useEffect(() => {
    if (isQuickMatch && playersList.length >= 2 && allReady) {
      const timer = setTimeout(() => {
        handleStartGame();
      }, 10000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isQuickMatch, playersList.length, allReady]);

  const handleBack = useCallback(() => {
    if (showLobby) {
      // In lobby: confirm leave
      Alert.alert(
        'Quitter le salon',
        'Es-tu sur de vouloir quitter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Quitter',
            style: 'destructive',
            onPress: async () => {
              await leaveRoom();
              router.back();
            },
          },
        ]
      );
    } else if (roomCode) {
      // In confirmation: go back to config (leave room too)
      Alert.alert(
        'Annuler',
        'Cela supprimera le salon cree.',
        [
          { text: 'Non', style: 'cancel' },
          {
            text: 'Oui',
            style: 'destructive',
            onPress: async () => {
              await leaveRoom();
              setRoomCode('');
              setCurrentRoomId('');
            },
          },
        ]
      );
    } else {
      router.back();
    }
  }, [showLobby, roomCode, leaveRoom, router]);

  const handleCreateRoom = useCallback(async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez etre connecte');
      return;
    }

    const playersCount = parseInt(maxPlayers, 10);
    if (isNaN(playersCount) || playersCount < 2 || playersCount > 4) {
      Alert.alert('Erreur', 'Le nombre de joueurs doit être entre 2 et 4');
      return;
    }

    if (!roomName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de salon');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await createRoom({
      edition: selectedEdition,
      maxPlayers: playersCount as 2 | 3 | 4,
      hostName: user.displayName ?? 'Hote',
      roomName: roomName.trim(),
      betAmount,
    });

    if (result) {
      setRoomCode(formatRoomCode(result.code));
      setCurrentRoomId(result.roomId);
    }
  }, [user, selectedEdition, maxPlayers, roomName, betAmount, createRoom]);

  const handleCopyCode = useCallback(async () => {
    if (roomCode) {
      const codeWithoutDash = roomCode.replace('-', '');
      await Clipboard.setStringAsync(codeWithoutDash);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copie !', 'Le code a ete copie');
    }
  }, [roomCode]);

  const handleShareCode = useCallback(async () => {
    if (roomCode) {
      try {
        const codeWithoutDash = roomCode.replace('-', '');
        await Share.share({
          message: `Rejoins ma partie Startup Ludo ! Code: ${codeWithoutDash}`,
        });
      } catch {
        // Share cancelled
      }
    }
  }, [roomCode]);

  const handleStartGame = useCallback(async () => {
    if (!allReady && playersList.length >= 2) {
      Alert.alert('Attention', 'Tous les joueurs doivent etre prets');
      return;
    }

    if (playersList.length < 2) {
      Alert.alert('Attention', 'Il faut au moins 2 joueurs');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const gameId = await startGame();

    if (gameId) {
      router.replace({
        pathname: '/(game)/game-preparation',
        params: { gameId, roomId: currentRoomId, mode: 'online' },
      });
    }
  }, [allReady, playersList.length, startGame, router, currentRoomId]);

  const handleContinueToLobby = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLobby(true);
  }, []);

  // Configuration form
  if (!showLobby && !roomCode) {
    return (
      <View style={styles.container}>
        <RadialBackground />

        {/* Fixed Header avec bouton retour */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: SPACING[4],
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Titre centré */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.configTitle}>CONFIGURATION DU SALON</Text>
          </Animated.View>

          {/* Carte centrale avec configuration */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <DynamicGradientBorder
              borderRadius={24}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={contentWidth}
              style={{ marginTop: SPACING[5] }}
            >
              <View style={styles.configCard}>
                {/* Nom du Salon */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nom du Salon</Text>
                  <DynamicGradientBorder
                    borderRadius={14}
                    fill="rgba(0, 0, 0, 0.35)"
                    style={styles.inputBorderWrapper}
                  >
                    <View style={styles.inputInner}>
                      <TextInput
                        value={roomName}
                        onChangeText={setRoomName}
                        placeholder="Ex. Salon de Abdoulaye"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        style={styles.configInput}
                        autoCapitalize="words"
                      />
                    </View>
                  </DynamicGradientBorder>
                </View>

                {/* Nombre de joueur */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nombre de joueur</Text>
                  <DynamicGradientBorder
                    borderRadius={14}
                    fill="rgba(0, 0, 0, 0.35)"
                    style={styles.inputBorderWrapper}
                  >
                    <View style={styles.inputInner}>
                      <TextInput
                        value={maxPlayers}
                        onChangeText={setMaxPlayers}
                        placeholder="2-4"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        style={styles.configInput}
                        keyboardType="number-pad"
                        maxLength={1}
                      />
                    </View>
                  </DynamicGradientBorder>
                </View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        </ScrollView>

        {/* Bottom button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
          <GameButton
            variant="yellow"
            fullWidth
            title={isLoading ? 'CREATION...' : 'CREER LE SALON'}
            loading={isLoading}
            onPress={handleCreateRoom}
            disabled={!roomName.trim() || !maxPlayers}
          />
        </View>
      </View>
    );
  }

  // Confirmation (après création, avant lobby)
  if (roomCode && !showLobby) {
    return (
      <View style={styles.container}>
        <RadialBackground />

        {/* Fixed Header avec bouton retour */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: SPACING[4],
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Carte de confirmation — même largeur que les autres vues (code, etc.) */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={styles.confirmationCardWrapper}
          >
            <DynamicGradientBorder
              borderRadius={24}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={screenWidth}
              style={styles.confirmationCardBorder}
            >
              <View style={styles.confirmationCard}>
                {/* Icône globe */}
                <View style={styles.globeIconContainer}>
                  <Ionicons name="globe" size={48} color="#FFFFFF" />
                </View>

                {/* Message de confirmation */}
                <Text style={styles.confirmationTitle}>
                  SALON '{roomName.toUpperCase()}' CRÉÉ !
                </Text>

                {/* Code */}
                <DynamicGradientBorder
                  borderRadius={14}
                  fill="rgba(0, 0, 0, 0.35)"
                  style={styles.codeBoxWrapper}
                >
                  <View style={styles.codeBox}>
                    <Text style={styles.codeLabelText}>Code:</Text>
                    <Text style={styles.codeValue}>{roomCode}</Text>
                  </View>
                </DynamicGradientBorder>

                {/* Boutons Copier et Partager */}
                <View style={styles.confirmationActions}>
                  <Pressable onPress={handleCopyCode} style={styles.confirmationButton}>
                    <DynamicGradientBorder
                      borderRadius={14}
                      fill="rgba(0, 0, 0, 0.35)"
                      style={styles.actionButtonBorder}
                    >
                      <View style={styles.actionButtonInner}>
                        <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Copier</Text>
                      </View>
                    </DynamicGradientBorder>
                  </Pressable>

                  <Pressable onPress={handleShareCode} style={styles.confirmationButton}>
                    <DynamicGradientBorder
                      borderRadius={14}
                      fill="rgba(0, 0, 0, 0.35)"
                      style={styles.actionButtonBorder}
                    >
                      <View style={styles.actionButtonInner}>
                        <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Partager</Text>
                      </View>
                    </DynamicGradientBorder>
                  </Pressable>
                </View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        </ScrollView>

        {/* Bottom button - Continue to lobby */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
          <GameButton
            variant="green"
            fullWidth
            title="CONTINUER"
            onPress={handleContinueToLobby}
          />
        </View>
      </View>
    );
  }

  // Waiting room (lobby avec joueurs)
  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>{roomName || 'SALON'}</Text>
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
              <Text style={styles.codeLabel}>CODE DU SALON</Text>
              <Text style={styles.codeText}>{roomCode}</Text>
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
            JOUEURS ({playersList.length}/{maxPlayers})
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
                          {player.displayName ?? player.name}
                        </Text>
                        {player.isHost && (
                          <View style={styles.hostBadge}>
                            <Ionicons name="star" size={10} color="#FFBC40" />
                            <Text style={styles.hostText}>Hote</Text>
                          </View>
                        )}
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

      {/* Bottom button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
        <GameButton
          variant="yellow"
          fullWidth
          title={isLoading ? 'CHARGEMENT...' : 'DEMARRER LA PARTIE'}
          loading={isLoading}
          disabled={playersList.length < 2}
          onPress={handleStartGame}
        />
        {playersList.length < 2 && (
          <Text style={styles.waitingText}>Minimum 2 joueurs requis</Text>
        )}
        {playersList.length >= 2 && !allReady && (
          <Text style={styles.waitingText}>En attente que tous soient prets...</Text>
        )}
      </View>
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
  configTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  configCard: {
    padding: SPACING[5],
    gap: SPACING[5],
  },
  fieldGroup: {
    gap: SPACING[2],
  },
  fieldLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputBorderWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  inputInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  configInput: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
  },
  confirmationCardWrapper: {
    alignSelf: 'stretch',
    minWidth: 280,
    marginHorizontal: -SPACING[4],
  },
  confirmationCardBorder: {
    width: '100%',
  },
  confirmationCard: {
    padding: SPACING[6],
    alignItems: 'center',
    gap: SPACING[5],
  },
  globeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFBC40',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeBoxWrapper: {
    width: '100%',
    minWidth: 280,
    alignSelf: 'stretch',
    marginHorizontal: -SPACING[4],
    overflow: 'hidden',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: SPACING[2],
  },
  codeLabelText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: '#4CAF50',
  },
  codeValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#4CAF50',
    letterSpacing: 2,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: SPACING[3],
    width: '100%',
  },
  confirmationButton: {
    flex: 1,
  },
  actionButtonBorder: {
    width: '100%',
    overflow: 'hidden',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: 12,
  },
  actionButtonText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
  },
  label: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING[2],
    marginTop: SPACING[5],
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: 'white',
    padding: SPACING[4],
  },
  optionCard: {
    paddingVertical: SPACING[3],
    alignItems: 'center',
  },
  optionText: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: 'white',
  },
  betText: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: 'white',
  },
  editionCard: {
    padding: SPACING[3],
    alignItems: 'center',
    width: 100,
  },
  editionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  editionName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'white',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
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
    marginTop: 2,
  },
  hostText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#FFBC40',
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
  waitingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: SPACING[2],
  },
});
