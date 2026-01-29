/**
 * quick-match - Matchmaking rapide
 *
 * États: idle, searching, found, joining
 * Timer, messages évolutifs, liste des joueurs en file
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore } from '@/stores';
import { useMultiplayer } from '@/hooks/useMultiplayer';

type MatchState = 'idle' | 'searching' | 'found' | 'joining';

// Messages de recherche évolutifs
const SEARCH_MESSAGES = [
  'Recherche de joueurs...',
  'Élargissement des critères...',
  'Recherche avancée...',
  'Presque trouvé !',
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
  const [foundRoom, setFoundRoom] = useState<{ code: string; roomId: string } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseValue = useSharedValue(1);

  // Animation de pulsation
  useEffect(() => {
    if (matchState === 'searching') {
      pulseValue.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1, true);
    } else {
      pulseValue.value = 1;
    }
  }, [matchState, pulseValue]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Timer de recherche
  useEffect(() => {
    if (matchState === 'searching') {
      timerRef.current = setInterval(() => {
        setSearchTime((prev) => {
          const newTime = prev + 1;
          // Changer le message toutes les 10 secondes
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

  // Simulation de matchmaking (à remplacer par vraie logique Firebase)
  useEffect(() => {
    if (matchState === 'searching' && searchTime >= 5) {
      // Simuler la découverte d'une room après 5 secondes
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

  const handleStartSearch = useCallback(async () => {
    setMatchState('searching');
    setSearchTime(0);
    setMessageIndex(0);
  }, []);

  const handleCancelSearch = useCallback(() => {
    setMatchState('idle');
    setSearchTime(0);
    setMessageIndex(0);
  }, []);

  const handleFoundMatch = useCallback(async () => {
    setMatchState('found');

    // Créer une room pour le match rapide
    if (user) {
      const result = await createRoom({
        edition: challenge || 'classic',
        maxPlayers: 4,
        hostName: user.displayName ?? 'Joueur',
        isQuickMatch: true,
      });

      if (result) {
        setFoundRoom({ code: result.code, roomId: result.roomId });

        // Attendre 2 secondes puis rediriger
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

  const getStatusColor = () => {
    switch (matchState) {
      case 'searching':
        return '#FFBC40';
      case 'found':
        return '#4CAF50';
      case 'joining':
        return '#4CAF50';
      default:
        return '#FFBC40';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0C243E' }}>
      {/* Background */}
      <LinearGradient
        colors={['#194F8A', '#0C243E']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Pattern overlay */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
        }}
      >
        {/* Pattern simplifié */}
      </View>

      {/* Lumière animée */}
      <Animated.View
        entering={FadeIn.delay(200).duration(1000)}
        style={{
          position: 'absolute',
          top: -100,
          left: '50%',
          marginLeft: -150,
          width: 300,
          height: 300,
          opacity: 0.3,
        }}
      >
        <Svg width="300" height="300">
          <Defs>
            <RadialGradient id="lightGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={getStatusColor()} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={getStatusColor()} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="150" cy="150" r="150" fill="url(#lightGrad)" />
        </Svg>
      </Animated.View>

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
          Match Rapide
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Contenu */}
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[4],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Carte principale */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: SPACING[6],
            width: '100%',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Icône avec animation */}
          <Animated.View style={[pulseStyle, { marginBottom: SPACING[5] }]}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: `${getStatusColor()}20`,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: getStatusColor(),
              }}
            >
              {matchState === 'searching' ? (
                <ActivityIndicator size="large" color={getStatusColor()} />
              ) : matchState === 'found' || matchState === 'joining' ? (
                <Ionicons name="checkmark" size={48} color={getStatusColor()} />
              ) : (
                <Ionicons name="flash" size={48} color={getStatusColor()} />
              )}
            </View>
          </Animated.View>

          {/* Message principal */}
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES.xl,
              color: COLORS.text,
              textAlign: 'center',
              marginBottom: SPACING[2],
            }}
          >
            {matchState === 'idle' && 'Prêt à jouer ?'}
            {matchState === 'searching' && SEARCH_MESSAGES[messageIndex]}
            {matchState === 'found' && 'Partie trouvée !'}
            {matchState === 'joining' && 'Connexion en cours...'}
          </Text>

          {/* Sous-message */}
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.sm,
              color: COLORS.textSecondary,
              textAlign: 'center',
              marginBottom: SPACING[4],
            }}
          >
            {matchState === 'idle' &&
              'Lance la recherche pour trouver des adversaires automatiquement'}
            {matchState === 'searching' && `Temps de recherche: ${formatTime(searchTime)}`}
            {matchState === 'found' && foundRoom && `Code: ${foundRoom.code}`}
            {matchState === 'joining' && 'Redirection vers le salon...'}
          </Text>

          {/* Bouton d'action */}
          {matchState === 'idle' && (
            <Pressable onPress={handleStartSearch} style={{ width: '100%' }}>
              <LinearGradient
                colors={['#FFBC40', '#F5A623']}
                style={{
                  paddingVertical: SPACING[4],
                  borderRadius: 16,
                  alignItems: 'center',
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.md,
                    color: '#0C243E',
                  }}
                >
                  Lancer la recherche
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          {matchState === 'searching' && (
            <Pressable
              onPress={handleCancelSearch}
              style={{
                width: '100%',
                paddingVertical: SPACING[4],
                borderRadius: 16,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#FF6B6B',
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.md,
                  color: '#FF6B6B',
                }}
              >
                Annuler la recherche
              </Text>
            </Pressable>
          )}

          {(matchState === 'found' || matchState === 'joining') && (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#4CAF50" />
            </View>
          )}
        </Animated.View>

        {/* Info supplémentaire */}
        {matchState === 'searching' && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={{ marginTop: SPACING[6], alignItems: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[2] }}>
              <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.textSecondary,
                  marginLeft: SPACING[1],
                }}
              >
                Joueurs en recherche: ~{Math.floor(Math.random() * 10) + 5}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
                textAlign: 'center',
              }}
            >
              La recherche s'élargit automatiquement pour trouver une partie plus rapidement
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
