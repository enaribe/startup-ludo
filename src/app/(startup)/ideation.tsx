import { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { FONTS } from '@/styles/typography';
import { useSettingsStore } from '@/stores';

const STEPS = [
  { number: 1, text: "Tirage de 3 cartes d'inspiration" },
  { number: 2, text: 'Réflexion guidée (5 minutes)' },
  { number: 3, text: "Création avec l'assistant Tambali" },
  { number: 4, text: 'Finalisation et ajout au portfolio' },
] as const;

const StepItem = memo(function StepItem({
  number,
  text,
  delay,
}: {
  number: number;
  text: string;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.stepRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </Animated.View>
  );
});

export default function IdeationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleStart = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(startup)/inspiration-cards');
  }, [router, hapticsEnabled]);

  const headerTopPadding = insets.top + 10;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe avec background */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>NOUVELLE STARTUP</Text>
        <View style={styles.backButton} />
      </View>

      {/* Contenu */}
      <View style={[styles.content, { paddingTop: headerTopPadding + 70 }]}>
        <View style={styles.cardContainer}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.cardContent}>
              {/* Icône ampoule */}
              <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="bulb" size={36} color="#FFBC40" />
                </View>
              </Animated.View>

              {/* Titre */}
              <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                <Text style={styles.title}>IDÉATION CRÉATIVE</Text>
              </Animated.View>

              {/* Description */}
              <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                <Text style={styles.description}>
                  Transformez une idée en entreprise ! Nous allons vous guider à travers un processus
                  d'idéation structuré pour créer votre prochaine startup.
                </Text>
              </Animated.View>

              {/* Étapes */}
              <View style={styles.stepsContainer}>
                {STEPS.map((step) => (
                  <StepItem
                    key={step.number}
                    number={step.number}
                    text={step.text}
                    delay={350 + step.number * 100}
                  />
                ))}
              </View>

              {/* Bouton Commencer */}
              <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.buttonContainer}>
                <GameButton
                  variant="yellow"
                  fullWidth
                  title="COMMENCER"
                  onPress={handleStart}
                />
              </Animated.View>
            </View>
          </DynamicGradientBorder>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  cardContainer: {
    width: '100%',
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 14,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: '#FFBC40',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  stepsContainer: {
    width: '100%',
    gap: 14,
    marginBottom: 22,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFBC40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: '#0C243E',
  },
  stepText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
  },
});
