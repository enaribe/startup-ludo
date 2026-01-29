/**
 * join-room - Rejoindre un salon
 *
 * Phase 1: Saisie du code (8 caractères)
 * Phase 2: Salle d'attente avec liste joueurs, bouton Prêt
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore } from '@/stores';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingIndicator } from '@/components/common';

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
  const [playerName, setPlayerName] = useState(user?.displayName ?? 'Joueur');
  const [hasJoined, setHasJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);

  // Convertir players en liste
  const playersList = useMemo(() => {
    return Object.entries(players).map(([playerId, player]) => ({
      ...player,
      playerId,
    }));
  }, [players]);

  // Écouter le démarrage de la partie
  useEffect(() => {
    if (room?.status === 'playing' && room.gameId) {
      router.replace({
        pathname: '/(game)/game-preparation',
        params: { gameId: room.gameId, roomId: room.id, mode: 'online' },
      });
    }
  }, [room?.status, room?.gameId, room?.id, router]);

  const handleBack = useCallback(async () => {
    if (hasJoined) {
      Alert.alert(
        'Quitter le salon',
        'Es-tu sûr de vouloir quitter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Quitter',
            style: 'destructive',
            onPress: async () => {
              await leaveRoom();
              setHasJoined(false);
              setCode('');
            },
          },
        ]
      );
    } else {
      router.back();
    }
  }, [hasJoined, leaveRoom, router]);

  const handleJoinRoom = useCallback(async () => {
    if (!code.trim() || code.length < 6) {
      Alert.alert('Code invalide', 'Veuillez entrer un code valide');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setJoiningRoom(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await joinRoom(code.toUpperCase(), playerName);

    setJoiningRoom(false);

    if (result) {
      setHasJoined(true);
    }
  }, [code, user, playerName, joinRoom]);

  const handleToggleReady = useCallback(async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setReady(newReady);
  }, [isReady, setReady]);

  // Mode saisie du code
  if (!hasJoined) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0C243E' }}>
        <LinearGradient
          colors={['#194F8A', '#0C243E']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Header */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            paddingTop: insets.top + SPACING[2],
            paddingBottom: SPACING[3],
            paddingHorizontal: SPACING[4],
            backgroundColor: 'rgba(12, 36, 62, 0.85)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 188, 64, 0.1)',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES.xl,
              color: COLORS.text,
              textAlign: 'center',
            }}
          >
            Rejoindre un salon
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + SPACING[4],
            paddingHorizontal: SPACING[4],
            justifyContent: 'center',
          }}
        >
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 24,
              padding: SPACING[6],
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Icône */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(31, 145, 208, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
                marginBottom: SPACING[5],
              }}
            >
              <Ionicons name="enter" size={40} color="#1F91D0" />
            </View>

            {/* Pseudo */}
            <Text style={styles.label}>Ton pseudo</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="Ton pseudo"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
                maxLength={20}
              />
            </View>

            {/* Code */}
            <Text style={[styles.label, { marginTop: SPACING[4] }]}>Code du salon</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                placeholder="XXXXXXXX"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={[styles.input, { textAlign: 'center', letterSpacing: 4, fontSize: 24 }]}
                autoCapitalize="characters"
                maxLength={8}
              />
            </View>

            {/* Bouton rejoindre */}
            <Pressable
              onPress={handleJoinRoom}
              disabled={joiningRoom || !code.trim() || !playerName.trim()}
              style={{ marginTop: SPACING[5] }}
            >
              <LinearGradient
                colors={
                  code.trim() && playerName.trim()
                    ? ['#FFBC40', '#F5A623']
                    : ['#666', '#444']
                }
                style={styles.primaryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {joiningRoom ? (
                  <LoadingIndicator size="small" color="#0C243E" />
                ) : (
                  <Text style={styles.primaryButtonText}>Rejoindre</Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Mode salle d'attente
  return (
    <View style={{ flex: 1, backgroundColor: '#0C243E' }}>
      <LinearGradient
        colors={['#194F8A', '#0C243E']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: insets.top + SPACING[2],
          paddingBottom: SPACING[3],
          paddingHorizontal: SPACING[4],
          backgroundColor: 'rgba(12, 36, 62, 0.85)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 188, 64, 0.1)',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES.xl,
            color: COLORS.text,
            textAlign: 'center',
          }}
        >
          Salle d'attente
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info salon */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.infoCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="game-controller" size={20} color="#FFBC40" />
              <Text style={styles.infoTitle}>{room?.code || code}</Text>
            </View>
            <Text style={styles.infoSubtitle}>
              {room?.edition || 'Classic'} • {room?.maxPlayers || 4} joueurs max
            </Text>
          </View>
        </Animated.View>

        {/* Liste des joueurs */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.sectionTitle}>
            Joueurs ({playersList.length}/{room?.maxPlayers || 4})
          </Text>
          <View style={{ gap: SPACING[3] }}>
            {playersList.map((player, index) => (
              <Animated.View
                key={player.playerId}
                entering={FadeIn.delay(300 + index * 100).duration(300)}
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
                        <Text style={styles.hostText}>Hôte</Text>
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.readyBadge,
                      (player.isReady || player.isHost) && styles.readyBadgeActive,
                    ]}
                  >
                    <Ionicons
                      name={player.isReady || player.isHost ? 'checkmark' : 'time'}
                      size={14}
                      color={player.isReady || player.isHost ? '#4CAF50' : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.readyText,
                        (player.isReady || player.isHost) && styles.readyTextActive,
                      ]}
                    >
                      {player.isHost ? 'Hôte' : player.isReady ? 'Prêt' : 'En attente'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bouton Prêt */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingTop: SPACING[3],
          backgroundColor: 'rgba(12, 36, 62, 0.95)',
        }}
      >
        <Pressable onPress={handleToggleReady} disabled={isLoading}>
          <View
            style={[
              styles.readyButton,
              isReady && styles.readyButtonActive,
            ]}
          >
            <Ionicons
              name={isReady ? 'close' : 'checkmark'}
              size={20}
              color={isReady ? '#FF6B6B' : '#4CAF50'}
            />
            <Text
              style={[
                styles.readyButtonText,
                isReady && styles.readyButtonTextActive,
              ]}
            >
              {isReady ? 'Annuler' : 'Je suis prêt !'}
            </Text>
          </View>
        </Pressable>
        <Text style={styles.waitingText}>
          En attente que l'hôte lance la partie...
        </Text>
      </View>
    </View>
  );
}

const styles = {
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
  } as const,
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as const,
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    padding: SPACING[4],
  } as const,
  primaryButton: {
    paddingVertical: SPACING[4],
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 56,
  },
  primaryButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#0C243E',
  } as const,
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: SPACING[4],
    marginBottom: SPACING[5],
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.2)',
  } as const,
  infoTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFBC40',
    marginLeft: SPACING[2],
  } as const,
  infoSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING[1],
  } as const,
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING[3],
  } as const,
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: SPACING[4],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  } as const,
  hostBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
    marginTop: 2,
  },
  hostText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#FFBC40',
  } as const,
  readyBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING[1],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
  },
  readyBadgeActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  } as const,
  readyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  } as const,
  readyTextActive: {
    color: '#4CAF50',
  } as const,
  readyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: SPACING[2],
    paddingVertical: SPACING[4],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  readyButtonActive: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  } as const,
  readyButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#4CAF50',
  } as const,
  readyButtonTextActive: {
    color: '#FF6B6B',
  } as const,
  waitingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginTop: SPACING[3],
  },
};
