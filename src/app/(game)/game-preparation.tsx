/**
 * game-preparation - Ecran de preparation avant le plateau
 *
 * Barre de progression, etapes visuelles, icones par phase.
 * Design system: RadialBackground, DynamicGradientBorder, COLORS/FONTS/SPACING.
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { RadialBackground, DynamicGradientBorder } from '@/components/ui';
import { multiplayerSync } from '@/services/multiplayer';
import { useGameStore } from '@/stores';
import { ref, get } from 'firebase/database';
import { database, REALTIME_PATHS } from '@/services/firebase/config';
import type { RealtimePlayer } from '@/services/firebase/config';
import { decodeCheckpoint } from '@/utils/onlineCodec';
import type { CompactCheckpoint } from '@/utils/onlineCodec';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/** Renders an animated percentage text using Reanimated shared value */
function AnimatedPercentage({ progress, color }: { progress: { value: string }; color: string }) {
  const animProps = useAnimatedProps(() => ({
    text: progress.value,
    defaultValue: progress.value,
  }));

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      animatedProps={animProps}
      style={[
        styles.percentage,
        { color },
      ]}
    />
  );
}

type PreparationState = 'connecting' | 'syncing' | 'loading' | 'finalizing' | 'starting' | 'error';

interface StepConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress: number;
}

const STEPS: { key: PreparationState; config: StepConfig }[] = [
  { key: 'connecting', config: { label: 'Connexion', icon: 'wifi', progress: 10 } },
  { key: 'syncing', config: { label: 'Joueurs', icon: 'people', progress: 30 } },
  { key: 'loading', config: { label: 'Donnees', icon: 'download', progress: 60 } },
  { key: 'finalizing', config: { label: 'Finalisation', icon: 'construct', progress: 85 } },
  { key: 'starting', config: { label: 'C\'est parti !', icon: 'rocket', progress: 100 } },
];

const STEP_INDEX: Record<PreparationState, number> = {
  connecting: 0,
  syncing: 1,
  loading: 2,
  finalizing: 3,
  starting: 4,
  error: -1,
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
  const initGame = useGameStore((s) => s.initGame);
  const loadFromCheckpoint = useGameStore((s) => s.loadFromCheckpoint);
  const hasInitRef = useRef(false);

  // Pulse animation for the active step icon
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Animated progress bar (smooth transitions)
  const animProgress = useSharedValue(0);

  const animBarStyle = useAnimatedStyle(() => ({
    width: `${animProgress.value}%`,
  }));

  const animPercentText = useDerivedValue(() => `${Math.round(animProgress.value)}%`);

  // ===== INITIALIZATION LOGIC (unchanged) =====

  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const isOnline = params.mode === 'online';

    if (isOnline && params.roomId) {
      initOnlineGame();
    } else {
      initLocalGame();
    }

    async function initOnlineGame() {
      try {
        const roomId = params.roomId!;

        setState('connecting');

        await new Promise((r) => setTimeout(r, 500));
        setState('syncing');

        const playersRef = ref(database, REALTIME_PATHS.roomPlayers(roomId));
        const playersSnap = await get(playersRef);

        if (!playersSnap.exists()) {
          setState('error');
          return;
        }

        const rtdbPlayers: RealtimePlayer[] = [];
        playersSnap.forEach((child) => {
          rtdbPlayers.push(child.val() as RealtimePlayer);
        });

        setState('loading');
        const checkpoint = await multiplayerSync.getCheckpoint();

        const roomRef = ref(database, REALTIME_PATHS.room(roomId));
        const roomSnap = await get(roomRef);
        const roomData = roomSnap.val();
        const edition = roomData?.edition || 'classic';

        await new Promise((r) => setTimeout(r, 300));
        setState('finalizing');

        const gamePlayers = rtdbPlayers.map((p) => ({
          id: p.id,
          name: p.displayName || p.name || 'Joueur',
          color: p.color,
          isAI: false,
          startupId: p.startupId,
          startupName: p.startupName,
          isDefaultProject: p.isDefaultProject,
        }));

        if (checkpoint && (checkpoint as unknown as CompactCheckpoint).t) {
          initGame('online', edition, gamePlayers);
          loadFromCheckpoint(decodeCheckpoint(checkpoint as unknown as CompactCheckpoint));
        } else {
          initGame('online', edition, gamePlayers);
        }

        multiplayerSync.setupPresence();

        await new Promise((r) => setTimeout(r, 500));
        setState('starting');

        setTimeout(() => {
          router.replace({
            pathname: '/(game)/play/[gameId]',
            params: {
              gameId: params.gameId || `game_${roomId}_${Date.now()}`,
              mode: 'online',
              roomId,
            },
          });
        }, 600);
      } catch (error) {
        console.error('[GamePreparation] Init error:', error);
        setState('error');
      }
    }

    function initLocalGame() {
      const transitions: { delay: number; nextState: PreparationState }[] = [
        { delay: 300, nextState: 'syncing' },
        { delay: 600, nextState: 'loading' },
        { delay: 900, nextState: 'finalizing' },
        { delay: 1200, nextState: 'starting' },
      ];

      transitions.forEach(({ delay, nextState }) => {
        setTimeout(() => setState(nextState), delay);
      });

      setTimeout(() => {
        if (params.gameId) {
          router.replace({
            pathname: '/(game)/play/[gameId]',
            params: {
              gameId: params.gameId,
              mode: params.mode || 'local',
              roomId: params.roomId,
            },
          });
        }
      }, 1800);
    }
  }, [params.gameId, params.mode, params.roomId, router, initGame, loadFromCheckpoint]);

  // Error auto-return
  useEffect(() => {
    if (state === 'error') {
      const t = setTimeout(() => router.back(), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state, router]);

  const currentStepIndex = STEP_INDEX[state];
  const currentStep = STEPS[Math.max(0, currentStepIndex)]?.config;
  const progress = state === 'error' ? 0 : (currentStep?.progress ?? 0);

  // Animate progress smoothly on each state change
  useEffect(() => {
    animProgress.value = withTiming(progress, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animProgress]);

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + SPACING[8], paddingBottom: insets.bottom + SPACING[6] },
        ]}
      >
        {/* Title */}
        <Animated.Text entering={FadeInDown.delay(100).duration(400)} style={styles.title}>
          {state === 'error' ? 'Erreur' : 'Preparation'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(200).duration(400)} style={styles.subtitle}>
          {state === 'error'
            ? 'Une erreur est survenue'
            : currentStep?.label ?? ''}
        </Animated.Text>

        {/* Central icon */}
        <Animated.View
          entering={FadeIn.delay(300).duration(500)}
          style={styles.iconSection}
        >
          <DynamicGradientBorder
            borderRadius={50}
            fill="rgba(0, 0, 0, 0.3)"
            boxWidth={100}
          >
            <Animated.View
              style={[
                styles.iconCircle,
                state !== 'error' && state !== 'starting' && pulseStyle,
              ]}
            >
              <Ionicons
                name={state === 'error' ? 'close-circle' : (currentStep?.icon ?? 'wifi')}
                size={40}
                color={state === 'error' ? COLORS.error : state === 'starting' ? COLORS.success : COLORS.primary}
              />
            </Animated.View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Progress bar */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.progressSection}
        >
          <DynamicGradientBorder
            borderRadius={16}
            fill="rgba(0, 0, 0, 0.3)"
            boxWidth={contentWidth}
          >
            <View style={styles.progressInner}>
              {/* Steps row */}
              <View style={styles.stepsRow}>
                {STEPS.map((step, i) => {
                  const isDone = currentStepIndex > i;
                  const isActive = currentStepIndex === i;
                  const isPending = currentStepIndex < i;
                  const stepColor = isDone
                    ? COLORS.success
                    : isActive
                      ? COLORS.primary
                      : 'rgba(255,255,255,0.2)';

                  return (
                    <View key={step.key} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            backgroundColor: isPending ? 'transparent' : stepColor,
                            borderColor: stepColor,
                          },
                        ]}
                      >
                        {isDone && (
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        )}
                        {isActive && (
                          <View style={[styles.stepDotInner, { backgroundColor: stepColor }]} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          (isDone || isActive) && { color: COLORS.text },
                        ]}
                        numberOfLines={1}
                      >
                        {step.config.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Bar */}
              <View style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: state === 'error'
                        ? COLORS.error
                        : progress >= 85
                          ? COLORS.success
                          : COLORS.primary,
                    },
                    animBarStyle,
                  ]}
                />
              </View>

              {/* Percentage */}
              <AnimatedPercentage
                progress={animPercentText}
                color={
                  state === 'error'
                    ? COLORS.error
                    : progress >= 85
                      ? COLORS.success
                      : COLORS.primary
                }
              />
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Error hint */}
        {state === 'error' && (
          <Animated.Text
            entering={FadeInDown.delay(500).duration(400)}
            style={styles.errorHint}
          >
            Retour automatique dans 3 secondes...
          </Animated.Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[4],
  },

  // Title
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING[1],
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[6],
  },

  // Central icon
  iconSection: {
    marginBottom: SPACING[8],
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Progress
  progressSection: {
    width: '100%',
  },
  progressInner: {
    padding: SPACING[4],
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING[3],
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    gap: SPACING[1],
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepLabel: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING[2],
  },

  // Error
  errorHint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING[6],
  },
});
