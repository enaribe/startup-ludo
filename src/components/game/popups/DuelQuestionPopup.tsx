import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  SlideInUp,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { DuelHeader } from '@/components/game/popups/DuelHeader';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import type { AIDuelAnswer, DuelQuestion, PlayerColor } from '@/types';

interface AIOpponentConfig {
  /** Nom affiché de l'IA (ex: "Bot Vert") */
  name: string;
  /** Réponses pré-calculées de l'IA, une par question (points + délai). */
  answers: AIDuelAnswer[];
  /** Appelée à la fin avec humain + IA scores en parallèle. */
  onComplete: (humanAnswers: number[], humanScore: number, aiScore: number) => void;
}

interface DuelQuestionPopupProps {
  visible: boolean;
  questions: DuelQuestion[];
  /** Mode classique humain — appelé à la fin avec les réponses du humain. */
  onComplete: (answers: number[], totalScore: number) => void;
  onClose: () => void;
  /** Appelé après chaque question répondue avec le score cumulé partiel
   *  (utilisé en ligne pour diffuser la progression aux spectateurs). */
  onProgress?: (score: number, answeredCount: number) => void;
  /** Si fourni, active le mode "humain vs IA en direct". onComplete n'est pas appelé,
   *  c'est aiOpponent.onComplete qui reçoit les 2 scores. */
  aiOpponent?: AIOpponentConfig;
  /** Joueur dont c'est le tour de répondre (pastille couleur + nom dans le header).
   *  Sert à lever l'ambiguïté « c'est à qui de jouer ? » dans tous les modes. */
  activePlayer?: { name: string; color: PlayerColor } | null;
  /** True si le joueur actif est le joueur LOCAL (adapte le libellé « À toi de jouer »
   *  vs « Au tour de X »). En local hot-seat, true = celui qui tient l'appareil. */
  isMyTurn?: boolean;
}

/** Initiales du nom (1 à 2 lettres) pour la pastille du joueur actif. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export const DuelQuestionPopup = memo(function DuelQuestionPopup({
  visible,
  questions,
  onComplete,
  onClose,
  onProgress,
  aiOpponent,
  activePlayer,
  isMyTurn,
}: DuelQuestionPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  usePlaySoundOnOpen(visible && questions.length > 0, 'popup-open');

  const isAIMode = !!aiOpponent;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // État IA : "thinking" → "answered" → reset au passage de question
  const [aiAnswered, setAiAnswered] = useState(false);
  const [aiScoreCumul, setAiScoreCumul] = useState(0);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progressAnim = useSharedValue(0);
  // Animation 3-points "réflexion" IA
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  // Reset quand le popup s'ouvre
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setAnswers([]);
      setTotalScore(0);
      setSelectedAnswer(null);
      setAiAnswered(false);
      setAiScoreCumul(0);
      isTransitioningRef.current = false;
      progressAnim.value = 0;
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    }
  }, [visible, progressAnim]);

  // Animation de progression
  useEffect(() => {
    progressAnim.value = withTiming((currentIndex / questions.length) * 100, { duration: 300 });
  }, [currentIndex, questions.length, progressAnim]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  // Animation des 3 points pendant la réflexion IA
  useEffect(() => {
    if (!isAIMode || aiAnswered) {
      dot1.value = withTiming(0.3, { duration: 150 });
      dot2.value = withTiming(0.3, { duration: 150 });
      dot3.value = withTiming(0.3, { duration: 150 });
      return;
    }
    const pulse = () =>
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      );
    dot1.value = pulse();
    setTimeout(() => { dot2.value = pulse(); }, 130);
    setTimeout(() => { dot3.value = pulse(); }, 260);
  }, [isAIMode, aiAnswered, currentIndex, dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  const isTransitioningRef = useRef(false);

  const currentQuestion = questions[currentIndex];

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return shuffleArray(currentQuestion.options);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  // Démarrer le timer IA au début de chaque question (mode IA)
  useEffect(() => {
    if (!isAIMode || !visible || !aiOpponent || !currentQuestion) return;
    setAiAnswered(false);
    const ai = aiOpponent.answers[currentIndex];
    if (!ai) return;
    aiTimerRef.current = setTimeout(() => {
      setAiAnswered(true);
      setAiScoreCumul((s) => s + ai.points);
    }, ai.delayMs);
    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  }, [currentIndex, isAIMode, visible, aiOpponent, currentQuestion]);

  // Avancer à la question suivante quand humain ET IA ont répondu (mode IA)
  // ou seulement humain (mode classique).
  useEffect(() => {
    if (selectedAnswer === null) return;
    if (isAIMode && !aiAnswered) return; // attend l'IA

    const answerIndex = selectedAnswer;
    const points = shuffledOptions[answerIndex]?.points || 0;
    const newAnswers = [...answers, answerIndex];
    const newScore = totalScore + points;

    const advanceTimer = setTimeout(() => {
      setAnswers(newAnswers);
      setTotalScore(newScore);

      // Diffuse la progression partielle (score cumulé après cette question)
      onProgress?.(newScore, newAnswers.length);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setAiAnswered(false);
        isTransitioningRef.current = false;
      } else if (isAIMode && aiOpponent) {
        const aiTotalScore = aiOpponent.answers.reduce((s, a) => s + a.points, 0);
        aiOpponent.onComplete(newAnswers, newScore, aiTotalScore);
      } else {
        onComplete(newAnswers, newScore);
      }
    }, 800);

    return () => clearTimeout(advanceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnswer, aiAnswered, isAIMode]);

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null || isTransitioningRef.current) return;
    if (!questions[currentIndex]) return;
    isTransitioningRef.current = true;
    setSelectedAnswer(answerIndex);
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [selectedAnswer, currentIndex, questions, hapticsEnabled]);

  if (!visible || questions.length === 0 || !currentQuestion) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      closeOnBackdrop={false}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <DuelHeader />

        {/* Bande « à qui de jouer » — couleur du joueur actif + son nom. Pastille
            blanche (initiales dans la couleur du joueur) pour un contraste net. */}
        {activePlayer && (
          <View style={[styles.turnBanner, { backgroundColor: COLORS.players[activePlayer.color] }]}>
            <View style={styles.turnBannerDot}>
              <Text style={[styles.turnBannerInitials, { color: COLORS.players[activePlayer.color] }]}>
                {getInitials(activePlayer.name)}
              </Text>
            </View>
            <View style={styles.turnBannerText}>
              <Text style={styles.turnBannerName} numberOfLines={1}>
                {activePlayer.name}
              </Text>
              <Text style={styles.turnBannerLabel} numberOfLines={1}>
                {isMyTurn ? 'À toi de jouer !' : 'À son tour de répondre'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.content}>
          {/* Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>{currentIndex + 1}/{questions.length}</Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
          </View>

          {/* Bandeau IA — visible uniquement en mode IA */}
          {isAIMode && aiOpponent && (
            <View style={styles.aiBanner}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={18} color={COLORS.white} />
              </View>
              <View style={styles.aiBannerCenter}>
                <Text style={styles.aiBannerName} numberOfLines={1}>
                  {aiOpponent.name}
                </Text>
                {aiAnswered ? (
                  <View style={styles.aiAnsweredRow}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.aiAnsweredText}>A répondu</Text>
                  </View>
                ) : (
                  <View style={styles.aiThinkingRow}>
                    <Text style={styles.aiThinkingText}>Réfléchit</Text>
                    <Animated.View style={[styles.aiDot, dot1Style]} />
                    <Animated.View style={[styles.aiDot, dot2Style]} />
                    <Animated.View style={[styles.aiDot, dot3Style]} />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Question */}
          <View style={styles.questionBox}>
            <Text style={styles.question}>{currentQuestion.question}</Text>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {shuffledOptions.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const pts = option.points ?? 0;
              const selectedColor = pts === 0
                ? COLORS.error
                : pts <= 15
                  ? COLORS.warning
                  : COLORS.success;

              return (
                <Animated.View
                  key={`${currentQuestion.id}-${index}`}
                  entering={FadeIn.delay(index * 100)}
                >
                  <Pressable
                    onPress={() => handleSelectAnswer(index)}
                    disabled={selectedAnswer !== null}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.optionPill,
                          pressed && !selectedAnswer && styles.optionPillPressed,
                          isSelected && { backgroundColor: selectedColor, borderColor: selectedColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                          adjustsFontSizeToFit
                          minimumFontScale={0.6}
                          numberOfLines={3}
                        >
                          {option.text}
                        </Text>
                        {isSelected && (
                          <View style={[styles.pointsBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                            <Text style={[styles.pointsText, { color: COLORS.white }]}>+{pts} pts</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Score actuel */}
          {isAIMode && aiOpponent ? (
            <View style={styles.scoreVsRow}>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreVsLabel}>Vous</Text>
                <Text style={styles.scoreVsValue}>{totalScore}</Text>
              </View>
              <Text style={styles.scoreVsSep}>VS</Text>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreVsLabel}>{aiOpponent.name}</Text>
                <Text style={styles.scoreVsValue}>{aiScoreCumul}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>Score actuel</Text>
              <Text style={styles.scoreValue}>{totalScore}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    maxWidth: 360,
    width: '92%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  content: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
  },
  turnBannerDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnBannerInitials: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
  },
  turnBannerText: {
    flex: 1,
    minWidth: 0,
  },
  turnBannerName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  turnBannerLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.85)',
  },
  progressSection: {
    width: '100%',
    marginBottom: SPACING[4],
  },
  progressText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E8EEF4',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.full,
  },
  questionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[4],
  },
  question: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 24,
  },
  options: {
    width: '100%',
    gap: SPACING[3],
    marginBottom: SPACING[4],
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    minHeight: 52,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  optionPillPressed: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderColor: COLORS.success,
  },
  optionPillSelected: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  optionText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  pointsBadge: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
    marginLeft: SPACING[2],
    ...SHADOWS.sm,
  },
  pointsText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: '#E8EEF4',
    width: '100%',
  },
  scoreLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
  },
  scoreValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.success,
  },
  // Bandeau IA
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    backgroundColor: '#F0F4F8',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    width: '100%',
    marginBottom: SPACING[3],
    borderWidth: 1,
    borderColor: '#D9E2EB',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING[2],
  },
  aiBannerName: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#2C3E50',
  },
  aiThinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  aiThinkingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#8E99A4',
    marginRight: 4,
  },
  aiDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7C3AED',
  },
  aiAnsweredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiAnsweredText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
  },
  // Score VS (mode IA)
  scoreVsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING[3],
    paddingHorizontal: SPACING[2],
    borderTopWidth: 1,
    borderTopColor: '#E8EEF4',
    width: '100%',
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
  },
  scoreVsLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#8E99A4',
    marginBottom: 2,
  },
  scoreVsValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.success,
  },
  scoreVsSep: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
    paddingHorizontal: SPACING[2],
  },
});
