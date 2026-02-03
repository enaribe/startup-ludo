/**
 * FinalQuizModal - Quiz final certification (Niveau 4)
 */

import { memo, useState, useCallback } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import { YEAH_FINAL_QUIZ, QUIZ_PASS_THRESHOLD } from '@/data/challenges';
import type { Challenge, ChallengeEnrollment } from '@/types/challenge';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

const { width: screenWidth } = Dimensions.get('window');

interface FinalQuizModalProps {
  visible: boolean;
  onClose: () => void;
  onPass: (certificate: string) => void;
  enrollment: ChallengeEnrollment;
  challenge: Challenge;
}

export const FinalQuizModal = memo(function FinalQuizModal({
  visible,
  onClose,
  onPass,
}: FinalQuizModalProps) {
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const handleClose = useCallback(() => {
    setPhase('quiz');
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    onClose();
  }, [onClose]);

  const submitAnswer = useCallback(() => {
    const q = YEAH_FINAL_QUIZ[currentIndex];
    if (!q || selectedOption === null) return;
    const correct = selectedOption === q.correctAnswer;
    setScore((s) => s + (correct ? 1 : 0));
    if (currentIndex < YEAH_FINAL_QUIZ.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    } else setPhase('result');
  }, [currentIndex, selectedOption]);

  const handleResult = useCallback(() => {
    const total = YEAH_FINAL_QUIZ.length;
    const passed = score / total >= QUIZ_PASS_THRESHOLD;
    if (passed) {
      onPass(`Certificat-Champion-Local-${Date.now()}`);
      handleClose();
    } else {
      setPhase('quiz');
      setCurrentIndex(0);
      setSelectedOption(null);
      setScore(0);
    }
  }, [score, onPass, handleClose]);

  if (!visible) return null;

  const q = YEAH_FINAL_QUIZ[currentIndex];
  const total = YEAH_FINAL_QUIZ.length;
  const passed = phase === 'result' && score / total >= QUIZ_PASS_THRESHOLD;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View entering={SlideInUp.duration(300).springify().damping(20)} style={styles.container}>
          <DynamicGradientBorder borderRadius={24} fill="rgba(10,25,41,0.95)" boxWidth={screenWidth - 36}>
            <View style={styles.inner}>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
              {phase === 'quiz' && q && (
                <>
                  <Text style={styles.title}>Quiz final - Question {currentIndex + 1}/{total}</Text>
                  <Text style={styles.question}>{q.question}</Text>
                  <View style={styles.options}>
                    {q.options.map((opt, i) => (
                      <Pressable key={i} onPress={() => setSelectedOption(i)} style={[styles.option, selectedOption === i && styles.optionSelected]}>
                        <Text style={styles.optionText}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <GameButton variant="yellow" title="VALIDER" onPress={submitAnswer} fullWidth disabled={selectedOption === null} />
                </>
              )}
              {phase === 'result' && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <View style={styles.resultIcon}>
                    <Ionicons name={passed ? 'trophy' : 'close-circle'} size={48} color={passed ? COLORS.primary : COLORS.error} />
                  </View>
                  <Text style={styles.resultTitle}>{passed ? 'Félicitations !' : 'Échec'}</Text>
                  <Text style={styles.resultScore}>Score : {score}/{total}</Text>
                  <GameButton variant={passed ? 'green' : 'blue'} title={passed ? 'OBTENIR CERTIFICAT' : 'RÉESSAYER'} onPress={handleResult} fullWidth />
                </Animated.View>
              )}
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  container: { width: '100%' },
  inner: { padding: SPACING[5], paddingTop: SPACING[6] },
  closeBtn: { position: 'absolute', top: SPACING[3], right: SPACING[3], width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  title: { fontFamily: FONTS.title, fontSize: FONT_SIZES.lg, color: COLORS.text, marginBottom: SPACING[3] },
  question: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.base, color: COLORS.text, marginBottom: SPACING[4] },
  options: { gap: SPACING[2], marginBottom: SPACING[4] },
  option: { padding: SPACING[3], backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { borderColor: COLORS.primary },
  optionText: { fontFamily: FONTS.body, fontSize: FONT_SIZES.base, color: COLORS.text },
  resultIcon: { alignItems: 'center', marginBottom: SPACING[4] },
  resultTitle: { fontFamily: FONTS.title, fontSize: FONT_SIZES.xl, color: COLORS.text, textAlign: 'center', marginBottom: SPACING[2] },
  resultScore: { fontFamily: FONTS.bodyBold, fontSize: FONT_SIZES.lg, color: COLORS.primary, textAlign: 'center', marginBottom: SPACING[4] },
});
