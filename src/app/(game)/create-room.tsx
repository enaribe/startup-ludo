/**
 * create-room - Creer un salon
 *
 * Phase 1: Formulaire de configuration (nom, joueurs)
 * Phase 2: Salle d'attente (lobby) avec code, liste joueurs, bouton demarrer
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
import { StartupSelectionModal } from '@/components/game/StartupSelectionModal';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useAuthStore, useUserStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { getDefaultProjectsForEdition, getMatchingUserStartups } from '@/data/defaultProjects';

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
  const profile = useUserStore((state) => state.profile);
  const {
    room,
    players,
    isLoading,
    createRoom,
    leaveRoom,
    setStartupSelection,
    startGame,
  } = useMultiplayer(user?.id ?? null);

  const isWaitingRoom = !!params.roomId;
  const isQuickMatch = params.quickMatch === 'true';
  const [showLobby, setShowLobby] = useState(isWaitingRoom);
  const [showStartupModal, setShowStartupModal] = useState(false);

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

  // Edition et projets
  const edition = room?.edition ?? selectedEdition;
  const defaultProjects = useMemo(
    () => getDefaultProjectsForEdition(edition),
    [edition]
  );
  const userStartups = useMemo(
    () => getMatchingUserStartups(profile?.startups ?? [], edition),
    [profile?.startups, edition]
  );

  // Le joueur courant (host)
  const myPlayer = useMemo(
    () => (user?.id ? players[user.id] : null),
    [players, user?.id]
  );
  const hasSelectedStartup = !!myPlayer?.startupId;

  const handleStartupSelected = useCallback(async (startupId: string, startupName: string, isDefault: boolean) => {
    setShowStartupModal(false);
    await setStartupSelection(startupId, startupName, isDefault);
  }, [setStartupSelection]);

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
    } else {
      router.back();
    }
  }, [showLobby, leaveRoom, router]);

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
      setShowLobby(true);
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

  // Configuration form
  if (!showLobby) {
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
        {/* Room Code — design system: fill rgba(0,0,0,0.35) */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
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

        {/* Liste des joueurs — même design que local-setup (CONFIGURATION DES JOUEURS) */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.lobbySectionWrapper}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
            style={styles.lobbyPlayersBlock}
          >
            <Text style={styles.lobbySectionTitle}>
              JOUEURS ({playersList.length}/{maxPlayers})
            </Text>
            {playersList.length === 0 ? (
              <View style={styles.emptyPlayers}>
                <Ionicons name="hourglass-outline" size={24} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>En attente de joueurs...</Text>
              </View>
            ) : (
              <View style={styles.playersList}>
                {playersList.map((player, index) => (
                  <Animated.View
                    key={player.playerId}
                    entering={FadeIn.delay(280 + index * 80).duration(400)}
                    style={styles.playerCardWrapper}
                  >
                    <DynamicGradientBorder
                      borderRadius={14}
                      fill="rgba(0, 0, 0, 0.35)"
                      boxWidth={contentWidth - 24}
                      style={styles.lobbyPlayerCardBorder}
                    >
                      <View style={styles.lobbyPlayerCard}>
                        <View style={styles.lobbyPlayerAvatar}>
                          <Avatar
                            name={player.displayName ?? player.name ?? 'Joueur'}
                            playerColor={player.color}
                            size="sm"
                          />
                        </View>
                        <View style={styles.lobbyPlayerInfo}>
                          <Text style={styles.lobbyPlayerName} numberOfLines={1}>
                            {player.displayName ?? player.name ?? 'Joueur'}
                          </Text>
                          {player.startupName ? (
                            <Text style={styles.lobbyStartupName} numberOfLines={1}>
                              {player.startupName}
                            </Text>
                          ) : (
                            <Text style={styles.lobbyPlayerStatus}>
                              {player.isHost ? 'Hôte' : player.isReady ? 'Prêt' : 'En attente'}
                            </Text>
                          )}
                        </View>
                        <View style={[
                          styles.lobbyReadyBadge,
                          (player.isReady || player.isHost) && styles.lobbyReadyBadgeActive,
                        ]}>
                          <Ionicons
                            name={player.isReady || player.isHost ? 'checkmark' : 'time'}
                            size={14}
                            color={player.isReady || player.isHost ? '#4CAF50' : 'rgba(255,255,255,0.5)'}
                          />
                        </View>
                      </View>
                    </DynamicGradientBorder>
                  </Animated.View>
                ))}
              </View>
            )}
          </DynamicGradientBorder>
        </Animated.View>

        {/* Startup Selection Button for host */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.startupBtnWrapper}>
          <Pressable
            style={[styles.startupSelectBtn, hasSelectedStartup && styles.startupSelectBtnDone]}
            onPress={() => setShowStartupModal(true)}
          >
            <Ionicons
              name={hasSelectedStartup ? 'checkmark-circle' : 'rocket-outline'}
              size={20}
              color={hasSelectedStartup ? '#4CAF50' : '#FFBC40'}
            />
            <Text style={[styles.startupSelectText, hasSelectedStartup && styles.startupSelectTextDone]}>
              {hasSelectedStartup ? myPlayer?.startupName ?? 'Projet choisi' : 'Choisir mon projet'}
            </Text>
            {!hasSelectedStartup && (
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Startup Selection Modal */}
      <StartupSelectionModal
        visible={showStartupModal}
        edition={edition}
        userStartups={userStartups}
        defaultProjects={defaultProjects}
        playerName={user?.displayName}
        onSelect={handleStartupSelected}
        onClose={() => setShowStartupModal(false)}
      />

      {/* Bottom button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
        <GameButton
          variant="yellow"
          fullWidth
          title={isLoading ? 'CHARGEMENT...' : 'DEMARRER LA PARTIE'}
          loading={isLoading}
          disabled={playersList.length < 2 || !hasSelectedStartup}
          onPress={handleStartGame}
        />
        {!hasSelectedStartup && (
          <Text style={styles.waitingText}>Choisis un projet avant de demarrer</Text>
        )}
        {playersList.length < 2 && (
          <Text style={styles.waitingText}>Minimum 2 joueurs requis</Text>
        )}
        {playersList.length >= 2 && !allReady && hasSelectedStartup && (
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
  // Salle d'attente — même design que local-setup (liste joueurs)
  lobbySectionWrapper: {
    marginTop: SPACING[5],
  },
  lobbyPlayersBlock: {
    width: '100%',
    overflow: 'hidden',
    padding: SPACING[3],
  },
  lobbySectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    marginBottom: SPACING[4],
  },
  playersList: {
    gap: 0,
  },
  playerCardWrapper: {
    marginBottom: 8,
  },
  lobbyPlayerCardBorder: {
    width: '100%',
    overflow: 'hidden',
  },
  lobbyPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  lobbyPlayerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  lobbyPlayerInfo: {
    flex: 1,
  },
  lobbyPlayerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  lobbyPlayerStatus: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  lobbyStartupName: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#FFBC40',
    marginTop: 2,
  },
  lobbyReadyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lobbyReadyBadgeActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
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
  startupBtnWrapper: {
    marginTop: SPACING[4],
  },
  startupSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 188, 64, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.25)',
    borderRadius: 14,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  startupSelectBtnDone: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  startupSelectText: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFBC40',
  },
  startupSelectTextDone: {
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
