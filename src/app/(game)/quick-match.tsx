/**
 * quick-match - Matchmaking rapide
 *
 * Recherche automatique d'adversaires avec animation,
 * affichage des joueurs trouves, puis redirection vers le salon.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore } from '@/stores';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

type MatchState = 'idle' | 'searching' | 'found' | 'joining';

const SEARCH_MESSAGES = [
  'RECHERCHE D\'ADVERSAIRES...',
  'Elargissement des criteres...',
  'Recherche avancee...',
  'Presque trouve !',
];

// Simulated players for UI demo
const MOCK_FOUND_PLAYERS = [
  { id: '1', name: 'Joueur 1', level: 5, color: 'yellow' as const },
  { id: '2', name: 'Joueur 2', level: 3, color: 'blue' as const },
];

export default function QuickMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const user = useAuthStore((state) => state.user);
  const { createRoom } = useMultiplayer(user?.id ?? null);

  const [matchState, setMatchState] = useState<MatchState>('idle');
  const [searchTime, setSearchTime] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [foundPlayers, setFoundPlayers] = useState<typeof MOCK_FOUND_PLAYERS>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseValue = useSharedValue(1);

  // Pulse animation
  useEffect(() => {
    if (matchState === 'searching') {
      pulseValue.value = withRepeat(withTiming(1.15, { duration: 1000 }), -1, true);
    } else {
      pulseValue.value = 1;
    }
  }, [matchState, pulseValue]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Search timer
  useEffect(() => {
    if (matchState === 'searching') {
      timerRef.current = setInterval(() => {
        setSearchTime((prev) => {
          const newTime = prev + 1;
          if (newTime % 10 === 0 && newTime > 0) {
            setMessageIndex((idx) => Math.min(idx + 1, SEARCH_MESSAGES.length - 1));
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [matchState]);

  // Simulate matchmaking
  useEffect(() => {
    if (matchState === 'searching' && searchTime >= 3 && foundPlayers.length === 0) {
      const firstPlayer = MOCK_FOUND_PLAYERS[0];
      if (firstPlayer) {
        setFoundPlayers([firstPlayer]);
      }
    }
    if (matchState === 'searching' && searchTime >= 5) {
      handleFoundMatch();
    }
  }, [matchState, searchTime]);

  const handleBack = () => {
    if (matchState === 'searching') {
      handleCancelSearch();
    } else {
      router.back();
    }
  };

  const handleStartSearch = useCallback(() => {
    setMatchState('searching');
    setSearchTime(0);
    setMessageIndex(0);
    setFoundPlayers([]);
  }, []);

  const handleCancelSearch = useCallback(() => {
    setMatchState('idle');
    setSearchTime(0);
    setMessageIndex(0);
    setFoundPlayers([]);
  }, []);

  const handleFoundMatch = useCallback(async () => {
    setMatchState('found');
    setFoundPlayers(MOCK_FOUND_PLAYERS);

    if (user) {
      const result = await createRoom({
        edition: challenge || 'classic',
        maxPlayers: 4,
        hostName: user.displayName ?? 'Joueur',
        isQuickMatch: true,
      });

      if (result) {
        setTimeout(() => {
          setMatchState('joining');
          router.replace({
            pathname: '/(game)/create-room',
            params: {
              roomId: result.roomId,
              code: result.code,
              isHost: 'true',
              quickMatch: 'true',
            },
          });
        }, 2000);
      }
    }
  }, [user, createRoom, challenge, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playersOnline = matchState === 'searching'
    ? foundPlayers.length + 1
    : matchState === 'found'
      ? MOCK_FOUND_PLAYERS.length + 1
      : 0;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>MATCH RAPIDE</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={{
          flex: 1,
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + (matchState === 'idle' ? 120 : 40),
          paddingHorizontal: SPACING[4],
        }}>
          {/* Search Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ marginBottom: SPACING[5] }}>
            <DynamicGradientBorder
              borderRadius={20}
              fill="rgba(10, 25, 41, 0.6)"
              boxWidth={contentWidth}
            >
              <View style={styles.searchSection}>
                <Animated.View style={[pulseStyle, styles.searchIconContainer]}>
                  {matchState === 'searching' ? (
                    <ActivityIndicator size="large" color="#FFBC40" />
                  ) : matchState === 'found' || matchState === 'joining' ? (
                    <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                  ) : (
                    <Ionicons name="globe" size={48} color="#FFBC40" />
                  )}
                </Animated.View>

                <Text style={styles.searchTitle}>
                  {matchState === 'idle' && 'PRET A JOUER ?'}
                  {matchState === 'searching' && SEARCH_MESSAGES[messageIndex]}
                  {matchState === 'found' && 'PARTIE TROUVEE !'}
                  {matchState === 'joining' && 'CONNEXION EN COURS...'}
                </Text>

                <Text style={styles.searchSubtitle}>
                  {matchState === 'idle' && 'Matchmaking automatique active'}
                  {matchState === 'searching' && `Temps de recherche: ${formatTime(searchTime)}`}
                  {matchState === 'found' && 'Redirection vers le salon...'}
                  {matchState === 'joining' && 'Preparation de la partie...'}
                </Text>

                {matchState === 'searching' && (
                  <Pressable onPress={handleCancelSearch} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </Pressable>
                )}
              </View>
            </DynamicGradientBorder>
          </Animated.View>

          {/* Players Found Section */}
          {(matchState === 'searching' || matchState === 'found' || matchState === 'joining') && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Text style={styles.playersTitle}>
                JOUEURS EN LIGNE {playersOnline}/4
              </Text>

              <View style={{ gap: SPACING[3] }}>
                {/* Current user */}
                <DynamicGradientBorder
                  borderRadius={16}
                  fill="rgba(255, 188, 64, 0.08)"
                  boxWidth={contentWidth}
                >
                  <View style={styles.playerCard}>
                    <Avatar
                      name={user?.displayName ?? 'Joueur'}
                      playerColor="yellow"
                      size="md"
                    />
                    <View style={{ flex: 1, marginLeft: SPACING[3] }}>
                      <Text style={styles.playerName}>{user?.displayName ?? 'Joueur'}</Text>
                      <Text style={styles.playerLevel}>Vous</Text>
                    </View>
                    <View style={[styles.colorDot, { backgroundColor: COLORS.players.yellow }]} />
                  </View>
                </DynamicGradientBorder>

                {/* Found players */}
                {foundPlayers.map((player, index) => (
                  <Animated.View
                    key={player.id}
                    entering={FadeInDown.delay(400 + index * 150).duration(400)}
                  >
                    <DynamicGradientBorder
                      borderRadius={16}
                      fill="rgba(10, 25, 41, 0.6)"
                      boxWidth={contentWidth}
                    >
                      <View style={styles.playerCard}>
                        <Avatar
                          name={player.name}
                          playerColor={player.color}
                          size="md"
                        />
                        <View style={{ flex: 1, marginLeft: SPACING[3] }}>
                          <Text style={styles.playerName}>{player.name}</Text>
                          <Text style={styles.playerLevel}>Niv. {player.level}</Text>
                        </View>
                        <View style={[styles.colorDot, { backgroundColor: COLORS.players[player.color] }]} />
                      </View>
                    </DynamicGradientBorder>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Bottom Button (idle state only) */}
      {matchState === 'idle' && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
          <GameButton
            variant="yellow"
            fullWidth
            title="LANCER LA RECHERCHE"
            onPress={handleStartSearch}
          />
        </View>
      )}
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
  content: {
    flex: 1,
  },
  searchSection: {
    alignItems: 'center',
    padding: SPACING[5],
  },
  searchIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  searchTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  searchSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: SPACING[4],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[5],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  cancelButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FF6B6B',
  },
  playersTitle: {
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
  playerLevel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
  },
});
