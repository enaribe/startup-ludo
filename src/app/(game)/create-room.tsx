/**
 * create-room - Créer un salon
 *
 * Phase 1: Formulaire de configuration (nom, joueurs, édition, mise)
 * Phase 2: Salle d'attente avec code, liste joueurs, bouton démarrer
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Share, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore } from '@/stores';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { Avatar } from '@/components/ui/Avatar';

// Éditions disponibles
const EDITIONS = [
  { id: 'classic', name: 'Classic', icon: 'rocket', color: '#FFBC40' },
  { id: 'agriculture', name: 'Agriculture', icon: 'leaf', color: '#4CAF50' },
  { id: 'education', name: 'Éducation', icon: 'school', color: '#1F91D0' },
  { id: 'sante', name: 'Santé', icon: 'medkit', color: '#FF6B6B' },
];

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
    players,
    isLoading,
    createRoom,
    startGame,
  } = useMultiplayer(user?.id ?? null);

  // Déterminer si on est en mode création ou salle d'attente
  const isWaitingRoom = !!params.roomId;
  const isQuickMatch = params.quickMatch === 'true';

  // États formulaire
  const [roomName, setRoomName] = useState('Ma partie');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [selectedEdition, setSelectedEdition] = useState(params.challenge || 'classic');
  const [betAmount, setBetAmount] = useState(250);

  // États salle d'attente
  const [roomCode, setRoomCode] = useState(params.code || '');
  const [currentRoomId, setCurrentRoomId] = useState(params.roomId || '');

  // Convertir players en liste
  const playersList = useMemo(() => {
    return Object.entries(players).map(([odorId, player]) => ({
      ...player,
      odorId,
    }));
  }, [players]);

  // Vérifier si tous prêts
  const allReady = useMemo(() => {
    if (playersList.length < 2) return false;
    return playersList.every((p) => p.isReady || p.isHost);
  }, [playersList]);

  // Auto-démarrage en mode quick match
  useEffect(() => {
    if (isQuickMatch && playersList.length >= 2 && allReady) {
      const timer = setTimeout(() => {
        handleStartGame();
      }, 10000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isQuickMatch, playersList.length, allReady]);

  const handleBack = () => {
    router.back();
  };

  const handleCreateRoom = useCallback(async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await createRoom({
      edition: selectedEdition,
      maxPlayers,
      hostName: user.displayName ?? 'Hôte',
      roomName,
      betAmount,
    });

    if (result) {
      setRoomCode(result.code);
      setCurrentRoomId(result.roomId);
    }
  }, [user, selectedEdition, maxPlayers, roomName, betAmount, createRoom]);

  const handleCopyCode = useCallback(async () => {
    if (roomCode) {
      await Clipboard.setStringAsync(roomCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copié !', 'Le code a été copié');
    }
  }, [roomCode]);

  const handleShareCode = useCallback(async () => {
    if (roomCode) {
      try {
        await Share.share({
          message: `Rejoins ma partie Startup Ludo ! Code: ${roomCode}`,
        });
      } catch {
        // Partage annulé
      }
    }
  }, [roomCode]);

  const handleStartGame = useCallback(async () => {
    if (!allReady && playersList.length >= 2) {
      Alert.alert('Attention', 'Tous les joueurs doivent être prêts');
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

  // Mode formulaire de configuration
  if (!isWaitingRoom && !roomCode) {
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
            Configuration du salon
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Nom du salon */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.label}>Nom du salon</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={roomName}
                onChangeText={setRoomName}
                placeholder="Ma partie"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
              />
            </View>
          </Animated.View>

          {/* Nombre de joueurs */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={styles.label}>Nombre de joueurs</Text>
            <View style={{ flexDirection: 'row', gap: SPACING[2] }}>
              {[2, 3, 4].map((count) => (
                <Pressable
                  key={count}
                  style={{ flex: 1 }}
                  onPress={() => setMaxPlayers(count as 2 | 3 | 4)}
                >
                  <View
                    style={[
                      styles.optionCard,
                      maxPlayers === count && styles.optionCardSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        maxPlayers === count && styles.optionTextSelected,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Édition */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={styles.label}>Édition</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: SPACING[3] }}
            >
              {EDITIONS.map((edition) => {
                const isSelected = selectedEdition === edition.id;
                return (
                  <Pressable key={edition.id} onPress={() => setSelectedEdition(edition.id)}>
                    <View
                      style={[
                        styles.editionCard,
                        isSelected && { borderColor: edition.color },
                      ]}
                    >
                      <View
                        style={[
                          styles.editionIcon,
                          { backgroundColor: `${edition.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={edition.icon as keyof typeof Ionicons.glyphMap}
                          size={24}
                          color={edition.color}
                        />
                      </View>
                      <Text style={[styles.editionName, isSelected && { color: edition.color }]}>
                        {edition.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Mise */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Text style={styles.label}>Mise (jetons)</Text>
            <View style={{ flexDirection: 'row', gap: SPACING[2] }}>
              {[100, 250, 500, 1000].map((amount) => (
                <Pressable
                  key={amount}
                  style={{ flex: 1 }}
                  onPress={() => setBetAmount(amount)}
                >
                  <View
                    style={[
                      styles.optionCard,
                      betAmount === amount && styles.optionCardSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { fontSize: 14 },
                        betAmount === amount && styles.optionTextSelected,
                      ]}
                    >
                      {amount}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bouton créer */}
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
          <Pressable onPress={handleCreateRoom} disabled={isLoading}>
            <LinearGradient
              colors={['#FFBC40', '#F5A623']}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Création...' : 'Créer le salon'}
              </Text>
            </LinearGradient>
          </Pressable>
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
          {roomName || 'Salon'}
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
        {/* Code du salon */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Code du salon</Text>
            <Text style={styles.codeText}>{roomCode}</Text>
            <View style={{ flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[3] }}>
              <Pressable onPress={handleCopyCode} style={styles.codeAction}>
                <Ionicons name="copy-outline" size={20} color="#FFBC40" />
                <Text style={styles.codeActionText}>Copier</Text>
              </Pressable>
              <Pressable onPress={handleShareCode} style={styles.codeAction}>
                <Ionicons name="share-outline" size={20} color="#FFBC40" />
                <Text style={styles.codeActionText}>Partager</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Liste des joueurs */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.label}>
            Joueurs ({playersList.length}/{maxPlayers})
          </Text>
          <View style={{ gap: SPACING[3] }}>
            {playersList.length === 0 ? (
              <View style={styles.emptyPlayers}>
                <Text style={styles.emptyText}>En attente de joueurs...</Text>
              </View>
            ) : (
              playersList.map((player, index) => (
                <Animated.View
                  key={player.odorId}
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
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bouton démarrer */}
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
        <Pressable
          onPress={handleStartGame}
          disabled={isLoading || playersList.length < 2}
        >
          <LinearGradient
            colors={playersList.length >= 2 ? ['#FFBC40', '#F5A623'] : ['#666', '#444']}
            style={styles.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Chargement...' : 'Démarrer la partie'}
            </Text>
          </LinearGradient>
        </Pressable>
        {playersList.length < 2 && (
          <Text style={styles.waitingText}>Minimum 2 joueurs requis</Text>
        )}
        {playersList.length >= 2 && !allReady && (
          <Text style={styles.waitingText}>En attente que tous soient prêts...</Text>
        )}
      </View>
    </View>
  );
}

const styles = {
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING[3],
    marginTop: SPACING[5],
  } as const,
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as const,
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    padding: SPACING[4],
  } as const,
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: SPACING[3],
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center' as const,
  },
  optionCardSelected: {
    borderColor: '#FFBC40',
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
  } as const,
  optionText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  } as const,
  optionTextSelected: {
    color: '#FFBC40',
  } as const,
  editionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: SPACING[4],
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center' as const,
    width: 100,
  },
  editionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING[2],
  },
  editionName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  } as const,
  primaryButton: {
    paddingVertical: SPACING[4],
    borderRadius: 16,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#0C243E',
  } as const,
  codeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: SPACING[5],
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.2)',
  },
  codeLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
  } as const,
  codeText: {
    fontFamily: FONTS.title,
    fontSize: 32,
    color: '#FFBC40',
    letterSpacing: 4,
  } as const,
  codeAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
  } as const,
  emptyPlayers: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: SPACING[4],
    alignItems: 'center' as const,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
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
  waitingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginTop: SPACING[2],
  },
};
