/**
 * game-preparation - Préparation de la partie
 *
 * Écran de chargement avec barre de progression et messages d'étape
 * États: connecting, syncing, loading, finalizing, starting, error
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { LoadingIndicator } from '@/components/common';

type PreparationState = 'connecting' | 'syncing' | 'loading' | 'finalizing' | 'starting' | 'error';

const STATES_CONFIG: Record<
  PreparationState,
  { message: string; progress: number; color: string }
> = {
  connecting: {
    message: 'Connexion au serveur...',
    progress: 10,
    color: '#FFBC40',
  },
  syncing: {
    message: 'Synchronisation des joueurs...',
    progress: 30,
    color: '#FFBC40',
  },
  loading: {
    message: 'Chargement des données de jeu...',
    progress: 60,
    color: '#FFBC40',
  },
  finalizing: {
    message: 'Finalisation...',
    progress: 85,
    color: '#4CAF50',
  },
  starting: {
    message: 'Démarrage de la partie !',
    progress: 100,
    color: '#4CAF50',
  },
  error: {
    message: 'Une erreur est survenue',
    progress: 0,
    color: '#FF6B6B',
  },
};

export default function GamePreparationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    gameId: string;
    roomId?: string;
    mode?: string;
  }>();

  const [state, setState] = useState<PreparationState>('connecting');

  const rotationValue = useSharedValue(0);
  const progressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation de rotation pour le spinner
  useEffect(() => {
    rotationValue.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotationValue]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationValue.value}deg` }],
  }));

  // Simulation des étapes de chargement
  useEffect(() => {
    const transitions: { delay: number; state: PreparationState }[] = [
      { delay: 1000, state: 'syncing' },
      { delay: 2000, state: 'loading' },
      { delay: 3500, state: 'finalizing' },
      { delay: 4500, state: 'starting' },
    ];

    transitions.forEach(({ delay, state: nextState }) => {
      progressRef.current = setTimeout(() => {
        setState(nextState);
      }, delay);
    });

    // Redirection après "starting"
    const redirectTimeout = setTimeout(() => {
      if (params.gameId) {
        router.replace({
          pathname: '/(game)/play/[gameId]',
          params: {
            gameId: params.gameId,
            mode: params.mode || 'online',
            roomId: params.roomId,
          },
        });
      }
    }, 5500);

    return () => {
      if (progressRef.current) {
        clearTimeout(progressRef.current);
      }
      clearTimeout(redirectTimeout);
    };
  }, [params.gameId, params.mode, params.roomId, router]);

  // Gestion des erreurs (retour auto après 3s)
  useEffect(() => {
    if (state === 'error') {
      const errorTimeout = setTimeout(() => {
        router.back();
      }, 3000);
      return () => clearTimeout(errorTimeout);
    }
    return undefined;
  }, [state, router]);

  const currentConfig = STATES_CONFIG[state];

  return (
    <View style={{ flex: 1, backgroundColor: '#0C243E' }}>
      {/* Background */}
      <LinearGradient
        colors={['#194F8A', '#0C243E']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Lumière animée */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          marginLeft: -150,
          width: 300,
          height: 300,
          opacity: 0.4,
        }}
      >
        <Svg width="300" height="300">
          <Defs>
            <RadialGradient id="prepGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={currentConfig.color} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={currentConfig.color} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="150" cy="150" r="150" fill="url(#prepGrad)" />
        </Svg>
      </Animated.View>

      {/* Contenu centré */}
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingHorizontal: SPACING[6],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Spinner */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ marginBottom: SPACING[8] }}
        >
          {state === 'error' ? (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 48 }}>❌</Text>
            </View>
          ) : (
            <Animated.View style={spinnerStyle}>
              <LoadingIndicator
                size="large"
                color={currentConfig.color}
              />
            </Animated.View>
          )}
        </Animated.View>

        {/* Titre */}
        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={{
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES['2xl'],
            color: COLORS.text,
            textAlign: 'center',
            marginBottom: SPACING[2],
          }}
        >
          Préparation de la partie
        </Animated.Text>

        {/* Message d'étape */}
        <Animated.Text
          entering={FadeInDown.delay(300).duration(500)}
          style={{
            fontFamily: FONTS.body,
            fontSize: FONT_SIZES.md,
            color: state === 'error' ? '#FF6B6B' : COLORS.textSecondary,
            textAlign: 'center',
            marginBottom: SPACING[6],
          }}
        >
          {currentConfig.message}
        </Animated.Text>

        {/* Barre de progression */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={{
            width: '100%',
            maxWidth: 300,
          }}
        >
          <View
            style={{
              height: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                width: `${currentConfig.progress}%`,
                backgroundColor: currentConfig.color,
                borderRadius: 6,
              }}
            />
          </View>

          {/* Pourcentage */}
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.lg,
              color: currentConfig.color,
              textAlign: 'center',
              marginTop: SPACING[3],
            }}
          >
            {currentConfig.progress}%
          </Text>
        </Animated.View>

        {/* Message d'erreur supplémentaire */}
        {state === 'error' && (
          <Animated.Text
            entering={FadeInDown.delay(500).duration(500)}
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.sm,
              color: COLORS.textSecondary,
              textAlign: 'center',
              marginTop: SPACING[6],
            }}
          >
            Retour automatique dans 3 secondes...
          </Animated.Text>
        )}
      </View>
    </View>
  );
}
