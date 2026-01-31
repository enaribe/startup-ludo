/**
 * join-room - Rejoindre un salon
 *
 * Phase 1: Saisie du code (8 caracteres)
 * Phase 2: Salle d'attente avec liste joueurs, bouton Pret
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, Dimensions, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore } from '@/stores';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { Avatar } from '@/components/ui/Avatar';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

export default function JoinRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLocalSearchParams<{ challenge?: string }>();

  const user = useAuthStore((state) => state.user);
  const {
    room,
    players,
    isLoading,
    joinRoom,
    setReady,
    leaveRoom,
  } = useMultiplayer(user?.id ?? null);

  const [code, setCode] = useState('');
  const [playerName] = useState(user?.displayName ?? 'Joueur');
  const [hasJoined, setHasJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [joinedRoomCode, setJoinedRoomCode] = useState('');
  const [showLobby, setShowLobby] = useState(false);

  // Helper function to format room code
  const formatRoomCode = (codeStr: string) => {
    if (codeStr.length >= 8) {
      return `${codeStr.slice(0, 4)}-${codeStr.slice(4, 8)}`;
    }
    return codeStr;
  };

  const playersList = useMemo(() => {
    return Object.entries(players).map(([playerId, player]) => ({
      ...player,
      playerId,
    }));
  }, [players]);

  // Listen for game start
  useEffect(() => {
    if (room?.status === 'playing' && room.gameId) {
      router.replace({
        pathname: '/(game)/game-preparation',
        params: { gameId: room.gameId, roomId: room.id, mode: 'online' },
      });
    }
  }, [room?.status, room?.gameId, room?.id, router]);

  const handleBack = useCallback(async () => {
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
    } else if (hasJoined) {
      // In confirmation: go back (leave room)
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
              setHasJoined(false);
              setJoinedRoomCode('');
              setCode('');
            },
          },
        ]
      );
    } else {
      router.back();
    }
  }, [showLobby, hasJoined, leaveRoom, router]);

  const handleJoinRoom = useCallback(async () => {
    const cleanCode = code.replace(/-/g, '').trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 6) {
      Alert.alert('Code invalide', 'Veuillez entrer un code valide');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez etre connecte');
      return;
    }

    setJoiningRoom(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await joinRoom(cleanCode, playerName);

      setJoiningRoom(false);

      if (result) {
        setJoinedRoomCode(formatRoomCode(cleanCode));
        setHasJoined(true);
      } else {
        Alert.alert('Erreur', 'Impossible de rejoindre le salon. Verifie le code et reessaye.');
      }
    } catch (error) {
      setJoiningRoom(false);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur', message);
    }
  }, [code, user, playerName, joinRoom]);

  const handleContinueToLobby = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLobby(true);
  }, []);

  const handleToggleReady = useCallback(async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setReady(newReady);
  }, [isReady, setReady]);

  // Code entry phase
  if (!hasJoined) {
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
            <Text style={styles.configTitle}>REJOINDRE UN SALON</Text>
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
                {/* Code du Salon */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Code du Salon</Text>
                  <DynamicGradientBorder
                    borderRadius={14}
                    fill="rgba(0, 0, 0, 0.35)"
                    style={styles.inputBorderWrapper}
                  >
                    <View style={styles.inputInner}>
                      <TextInput
                        value={code}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/-/g, '').toUpperCase();
                          if (cleaned.length <= 8) {
                            setCode(cleaned.length > 4 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}` : cleaned);
                          }
                        }}
                        placeholder="UPM7-T94Z"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        style={styles.configInput}
                        autoCapitalize="characters"
                        maxLength={9}
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
            title={joiningRoom ? 'CONNEXION...' : 'REJOINDRE'}
            loading={joiningRoom}
            disabled={!code.replace(/-/g, '').trim() || code.replace(/-/g, '').length < 6}
            onPress={handleJoinRoom}
          />
        </View>
      </View>
    );
  }

  // Confirmation (après avoir rejoint, avant lobby)
  if (hasJoined && joinedRoomCode && !showLobby) {
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
          {/* Carte de confirmation */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <DynamicGradientBorder
              borderRadius={24}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={contentWidth}
            >
              <View style={styles.confirmationCard}>
                {/* Icône globe */}
                <View style={styles.globeIconContainer}>
                  <Ionicons name="globe" size={48} color="#FFFFFF" />
                </View>

                {/* Message de confirmation */}
                <Text style={styles.confirmationTitle}>
                  SALON REJOINT !
                </Text>

                {/* Code */}
                <DynamicGradientBorder
                  borderRadius={14}
                  fill="rgba(0, 0, 0, 0.35)"
                  style={styles.codeBoxWrapper}
                >
                  <View style={styles.codeBox}>
                    <Text style={styles.codeLabelText}>Code:</Text>
                    <Text style={styles.codeValue}>{joinedRoomCode}</Text>
                  </View>
                </DynamicGradientBorder>
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

  // Waiting room phase
  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={handleBack} hitSlop={8}>
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
        {/* Code du salon — même design que salle d'attente hôte (create-room) */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
          >
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>CODE DU SALON</Text>
              <Text style={styles.codeText}>
                {room?.code ? formatRoomCode(room.code) : joinedRoomCode || code}
              </Text>
              <Text style={styles.roomDetails}>
                {room?.edition || 'Classic'} — {room?.maxPlayers || 4} joueurs max
              </Text>
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
              JOUEURS ({playersList.length}/{room?.maxPlayers || 4})
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
                          <Text style={styles.lobbyPlayerStatus}>
                            {player.isHost ? 'Hôte' : player.isReady ? 'Prêt' : 'En attente'}
                          </Text>
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
      </ScrollView>

      {/* Bottom - Ready button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
        <GameButton
          variant={isReady ? 'blue' : 'green'}
          fullWidth
          title={isReady ? 'ANNULER' : 'JE SUIS PRET !'}
          loading={isLoading}
          onPress={handleToggleReady}
        />
        <Text style={styles.waitingText}>
          En attente que l'hote lance la partie...
        </Text>
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
    letterSpacing: 2,
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
  // Bloc code salle d'attente invité — aligné sur create-room (design system)
  codeSection: {
    alignItems: 'center',
    padding: SPACING[5],
    minWidth: 280,
    alignSelf: 'stretch',
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
  roomDetails: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: SPACING[3],
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
