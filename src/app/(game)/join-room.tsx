/**
 * join-room - Rejoindre un salon
 *
 * Phase 1: Saisie du code (8 caracteres)
 * Phase 2: Salle d'attente avec liste joueurs, bouton Pret
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
        {/* Room info */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <DynamicGradientBorder
            borderRadius={16}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={contentWidth}
          >
            <View style={styles.roomInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="game-controller" size={20} color="#FFBC40" />
                <Text style={styles.roomCode}>
                  {room?.code ? formatRoomCode(room.code) : joinedRoomCode || code}
                </Text>
              </View>
              <Text style={styles.roomDetails}>
                {room?.edition || 'Classic'} - {room?.maxPlayers || 4} joueurs max
              </Text>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Players list */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: SPACING[5] }}>
          <Text style={styles.playersLabel}>
            JOUEURS ({playersList.length}/{room?.maxPlayers || 4})
          </Text>

          <View style={{ gap: SPACING[3] }}>
            {playersList.map((player, index) => (
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
            ))}
          </View>
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
  roomInfo: {
    padding: SPACING[4],
    minWidth: 280,
    alignSelf: 'stretch',
    marginHorizontal: -SPACING[4],
  },
  roomCode: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFBC40',
    marginLeft: SPACING[2],
  },
  roomDetails: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: SPACING[1],
  },
  playersLabel: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: 'white',
    marginBottom: SPACING[3],
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
