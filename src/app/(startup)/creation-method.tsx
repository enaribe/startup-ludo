import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    FadeIn,
    FadeInDown,
    FadeOut,
    interpolate,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { generateStartupIdeas } from '@/services/ai';
import { useSettingsStore } from '@/stores';
import { FONTS } from '@/styles/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type GeneratedIdea = { id: string; title: string; description: string };

function getMockIdeas(
  target?: string,
  mission?: string,
  sector?: string
): GeneratedIdea[] {
  const t = target || 'cible';
  const m = mission || 'mission';
  const s = sector || 'secteur';
  return [
    { id: '1', title: `${t} + ${m} dans le ${s}`, description: 'Solution digitale pour connecter les acteurs du secteur.' },
    { id: '2', title: `Plateforme ${t} pour ${m}`, description: 'Service innovant ciblant le marché ' + s + '.' },
    { id: '3', title: `${m} durable en ${s}`, description: 'Modèle hybride associant ' + t + ' et ' + s + '.' },
  ];
}

/* ───────────────────────── Animated Spinner ───────────────────────── */

const AISpinner = memo(function AISpinner() {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(rotation);
      cancelAnimation(pulse);
      cancelAnimation(glow);
    };
  }, [rotation, pulse, glow]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.8]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.9, 1.15]) }],
  }));

  return (
    <View style={spinnerStyles.wrapper}>
      <Animated.View style={[spinnerStyles.glow, glowStyle]} />
      <Animated.View style={[spinnerStyles.ring, ringStyle]}>
        <View style={spinnerStyles.ringInner}>
          <Ionicons name="diamond" size={28} color="#FFBC40" />
        </View>
      </Animated.View>
    </View>
  );
});

const spinnerStyles = StyleSheet.create({
  wrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  glow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFBC40',
    borderTopColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* ───────────────────────── Loading Dots ───────────────────────── */

const LoadingDots = memo(function LoadingDots() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 }),
        withTiming(0, { duration: 600 })
      ),
      -1
    );
    dot2.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 }),
          withTiming(0, { duration: 600 })
        ),
        -1
      )
    );
    dot3.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 }),
          withTiming(0, { duration: 600 })
        ),
        -1
      )
    );
    return () => {
      cancelAnimation(dot1);
      cancelAnimation(dot2);
      cancelAnimation(dot3);
    };
  }, [dot1, dot2, dot3]);

  const dotStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
    transform: [{ translateY: interpolate(dot1.value, [0, 1], [0, -4]) }],
  }));
  const dotStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
    transform: [{ translateY: interpolate(dot2.value, [0, 1], [0, -4]) }],
  }));
  const dotStyle3 = useAnimatedStyle(() => ({
    opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
    transform: [{ translateY: interpolate(dot3.value, [0, 1], [0, -4]) }],
  }));

  return (
    <View style={dotsStyles.row}>
      <Animated.View style={[dotsStyles.dot, dotStyle1]} />
      <Animated.View style={[dotsStyles.dot, dotStyle2]} />
      <Animated.View style={[dotsStyles.dot, dotStyle3]} />
    </View>
  );
});

const dotsStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignSelf: 'center', marginTop: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFBC40',
  },
});

/* ───────────────────────── Idea Card ───────────────────────── */

interface IdeaCardProps {
  idea: GeneratedIdea;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

const IdeaCard = memo(function IdeaCard({ idea, index, isSelected, onSelect }: IdeaCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 12, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 400 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(160)}
      style={[animatedStyle, ideaStyles.cardOuter]}
    >
      <DynamicGradientBorder
        borderRadius={16}
        fill={isSelected ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.35)'}
        style={ideaStyles.cardBorder}
      >
        <Pressable
          onPress={() => onSelect(index)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={ideaStyles.cardInner}
        >
          <View style={ideaStyles.cardHeader}>
            <View style={[ideaStyles.numberBadge, isSelected && ideaStyles.numberBadgeSelected]}>
              <Text style={[ideaStyles.numberText, isSelected && ideaStyles.numberTextSelected]}>
                {index + 1}
              </Text>
            </View>
            <View style={ideaStyles.cardTextWrapper}>
              <Text style={[ideaStyles.cardTitle, isSelected && ideaStyles.cardTitleSelected]} numberOfLines={2}>
                {idea.title}
              </Text>
              <Text style={ideaStyles.cardDesc} numberOfLines={2}>
                {idea.description}
              </Text>
            </View>
            {isSelected && (
              <Animated.View entering={ZoomIn.duration(250)} style={ideaStyles.checkIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#FFBC40" />
              </Animated.View>
            )}
          </View>
        </Pressable>
      </DynamicGradientBorder>
    </Animated.View>
  );
});

const ideaStyles = StyleSheet.create({
  cardOuter: {
    width: '100%',
    marginBottom: 10,
  },
  cardBorder: {
    width: '100%',
  },
  cardInner: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  numberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  numberBadgeSelected: {
    backgroundColor: 'rgba(255, 188, 64, 0.25)',
  },
  numberText: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  numberTextSelected: {
    color: '#FFBC40',
  },
  cardTextWrapper: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  cardTitleSelected: {
    color: '#FFDC64',
  },
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 17,
  },
  checkIcon: {
    marginTop: 2,
  },
});

/* ───────────────────────── Step Indicator ───────────────────────── */

const StepIndicator = memo(function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[stepStyles.dot, i < current && stepStyles.dotActive]} />
      ))}
    </View>
  );
});

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dotActive: {
    backgroundColor: '#FFBC40',
  },
});

/* ───────────────────────── Main Screen ───────────────────────── */

export default function CreationMethodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showManualPopup, setShowManualPopup] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const descriptionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  const params = useLocalSearchParams<{
    targetCardId?: string;
    targetCardTitle?: string;
    targetCardDesc?: string;
    missionCardId?: string;
    missionCardTitle?: string;
    missionCardDesc?: string;
    sectorTitle?: string;
    sectorId?: string;
  }>();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  /* ── AI flow ── */

  const handleAI = useCallback(async () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setShowAIPopup(true);
    setIsGenerating(true);
    setGeneratedIdeas([]);
    setSelectedIdeaIndex(null);

    // Minimum loading time for UX (2s)
    const minDelay = new Promise<void>((resolve) => {
      aiTimerRef.current = setTimeout(() => {
        aiTimerRef.current = null;
        resolve();
      }, 2000);
    });

    try {
      // Fire both in parallel: API call + minimum UX delay
      const [aiIdeas] = await Promise.all([
        generateStartupIdeas(
          params.targetCardTitle,
          params.missionCardTitle,
          params.sectorTitle
        ),
        minDelay,
      ]);

      // Use AI result, or fallback to mock if null
      const ideas = aiIdeas ?? getMockIdeas(
        params.targetCardTitle,
        params.missionCardTitle,
        params.sectorTitle
      );
      setGeneratedIdeas(ideas);
    } catch {
      // Fallback to mock ideas on any error
      const ideas = getMockIdeas(
        params.targetCardTitle,
        params.missionCardTitle,
        params.sectorTitle
      );
      setGeneratedIdeas(ideas);
    } finally {
      setIsGenerating(false);
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [params.targetCardTitle, params.missionCardTitle, params.sectorTitle, hapticsEnabled]);

  const handleSelectIdea = useCallback((index: number) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIdeaIndex(index);
  }, [hapticsEnabled]);

  const handleConfirmIdea = useCallback(() => {
    if (selectedIdeaIndex == null) return;
    const idea = generatedIdeas[selectedIdeaIndex];
    if (!idea) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowAIPopup(false);
    setGeneratedIdeas([]);
    setSelectedIdeaIndex(null);
    router.push({
      pathname: '/(startup)/confirmation',
      params: {
        startupName: idea.title,
        startupDescription: idea.description,
        startupSector: params.sectorId || '',
        targetCardId: params.targetCardId || '',
        targetCardTitle: params.targetCardTitle || '',
        targetCardDesc: params.targetCardDesc || '',
        missionCardId: params.missionCardId || '',
        missionCardTitle: params.missionCardTitle || '',
        missionCardDesc: params.missionCardDesc || '',
      },
    });
  }, [selectedIdeaIndex, generatedIdeas, router, params, hapticsEnabled]);

  const handleCloseAIPopup = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = null;
    setShowAIPopup(false);
    setIsGenerating(false);
    setGeneratedIdeas([]);
    setSelectedIdeaIndex(null);
  }, []);

  /* ── Manual flow ── */

  const handleManual = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setManualName('');
    setManualDescription('');
    setShowManualPopup(true);
  }, [hapticsEnabled]);

  const handleCloseManualPopup = useCallback(() => {
    setShowManualPopup(false);
    setManualName('');
    setManualDescription('');
  }, []);

  const handleConfirmManual = useCallback(() => {
    const trimmedName = manualName.trim();
    const trimmedDesc = manualDescription.trim();
    if (!trimmedName || !trimmedDesc) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowManualPopup(false);
    router.push({
      pathname: '/(startup)/confirmation',
      params: {
        startupName: trimmedName,
        startupDescription: trimmedDesc,
        startupSector: params.sectorId || '',
        targetCardId: params.targetCardId || '',
        targetCardTitle: params.targetCardTitle || '',
        targetCardDesc: params.targetCardDesc || '',
        missionCardId: params.missionCardId || '',
        missionCardTitle: params.missionCardTitle || '',
        missionCardDesc: params.missionCardDesc || '',
      },
    });
    setManualName('');
    setManualDescription('');
  }, [manualName, manualDescription, router, params, hapticsEnabled]);

  const isManualValid = manualName.trim().length > 0 && manualDescription.trim().length > 0;
  const headerTopPadding = insets.top + 10;
  const NAME_MAX = 30;
  const DESC_MAX = 150;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>CRÉATION</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTopPadding + 60, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Résumé des cartes tirées */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Vos cartes d'inspiration</Text>

              <View style={[styles.summaryChip, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                <Text style={[styles.summaryChipText, { color: '#4CAF50' }]}>
                  {params.targetCardTitle?.toUpperCase() || 'CIBLE'}
                </Text>
              </View>

              <View style={[styles.summaryChip, { backgroundColor: 'rgba(255, 188, 64, 0.15)' }]}>
                <Text style={[styles.summaryChipText, { color: '#FFBC40' }]}>
                  {params.missionCardTitle?.toUpperCase() || 'MISSION'}
                </Text>
              </View>

              <View style={[styles.summaryChip, { backgroundColor: 'rgba(31, 145, 208, 0.15)' }]}>
                <Text style={[styles.summaryChipText, { color: '#1F91D0' }]}>
                  {params.sectorTitle?.toUpperCase() || 'SECTEUR'}
                </Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Titre question */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.questionTitle}>COMMENT SOUHAITEZ-VOUS PROCÉDER ?</Text>
        </Animated.View>

        {/* Option 1 : Assistant IA Tambali */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <View style={styles.tambaliIcon}>
                  <Ionicons name="diamond" size={20} color="#FFBC40" />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={styles.optionTitle}>Assistant Tambali</Text>
                  <Text style={styles.optionDesc}>Générer 3 idées de startup avec l'IA</Text>
                </View>
              </View>

              <GameButton
                variant="blue"
                fullWidth
                title="GÉNÉRER AVEC L'IA"
                onPress={handleAI}
              />
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Option 2 : Création manuelle */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <View style={styles.manualIcon}>
                  <Ionicons name="create" size={20} color="#1F91D0" />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={styles.optionTitle}>Création manuelle</Text>
                  <Text style={styles.optionDesc}>Décrivez votre idée vous-même</Text>
                </View>
              </View>

              <GameButton
                variant="blue"
                fullWidth
                title="CRÉER MANUELLEMENT"
                onPress={handleManual}
              />
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </ScrollView>

      {/* ═══════════ POPUP IA ═══════════ */}
      <Modal
        visible={showAIPopup}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.popupOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={isGenerating ? undefined : handleCloseAIPopup} />
          <Animated.View
            entering={SlideInUp.duration(120).springify().damping(26)}
            exiting={FadeOut.duration(100)}
            style={styles.popupWrapper}
          >
            <DynamicGradientBorder
              borderRadius={24}
              fill="#0D2744"
              style={styles.popupCardBorder}
            >
              <View style={styles.popupCardInner}>
                {/* Header */}
                <View style={styles.popupHeader}>
                  <View style={styles.popupHeaderLeft}>
                    <View style={styles.popupTambaliIcon}>
                      <Ionicons name="diamond" size={16} color="#FFBC40" />
                    </View>
                    <Text style={styles.popupHeaderTitle}>
                      {isGenerating ? 'TAMBALI' : 'CHOISISSEZ UNE IDÉE'}
                    </Text>
                  </View>
                  {!isGenerating && (
                    <Pressable onPress={handleCloseAIPopup} hitSlop={12} style={styles.popupCloseBtn}>
                      <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                    </Pressable>
                  )}
                </View>

                <View style={styles.popupDivider} />

                {/* Body */}
                <View style={styles.popupBody}>
                {isGenerating ? (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.popupLoadingCenter}>
                    <AISpinner />
                    <Text style={styles.popupLoadingTitle}>Génération en cours</Text>
                    <Text style={styles.popupLoadingSubtitle}>
                      L'IA analyse vos cartes d'inspiration et génère 3 idées de startup...
                    </Text>
                    <LoadingDots />
                  </Animated.View>
                ) : generatedIdeas.length > 0 ? (
                  <>
                    <StepIndicator current={selectedIdeaIndex != null ? 2 : 1} total={2} />

                    <Text style={styles.popupSelectSubtitle}>
                      Sélectionnez celle qui vous inspire le plus
                    </Text>

                    <ScrollView
                      style={styles.popupIdeasScroll}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {generatedIdeas.map((idea, index) => (
                        <IdeaCard
                          key={idea.id}
                          idea={idea}
                          index={index}
                          isSelected={selectedIdeaIndex === index}
                          onSelect={handleSelectIdea}
                        />
                      ))}
                    </ScrollView>

                    <Animated.View entering={FadeIn.delay(200).duration(150)}>
                      <GameButton
                        variant="yellow"
                        fullWidth
                        title="VALIDER CETTE IDÉE"
                        onPress={handleConfirmIdea}
                        disabled={selectedIdeaIndex == null}
                      />
                    </Animated.View>
                  </>
                ) : null}
                </View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        </View>
      </Modal>

      {/* ═══════════ POPUP MANUEL ═══════════ */}
      <Modal
        visible={showManualPopup}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.popupOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseManualPopup} />
          <Animated.View
            entering={SlideInUp.duration(120).springify().damping(26)}
            exiting={FadeOut.duration(100)}
            style={styles.popupWrapper}
          >
            <DynamicGradientBorder
              borderRadius={24}
              fill="#0D2744"
              style={styles.popupCardBorder}
            >
              <View style={styles.popupCardInner}>
                {/* Header */}
                <View style={styles.popupHeader}>
                  <View style={styles.popupHeaderLeft}>
                    <View style={styles.popupManualIcon}>
                      <Ionicons name="create" size={16} color="#1F91D0" />
                    </View>
                    <Text style={styles.popupHeaderTitle}>CRÉER UN PROJET</Text>
                  </View>
                  <Pressable onPress={handleCloseManualPopup} hitSlop={12} style={styles.popupCloseBtn}>
                    <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                <View style={styles.popupDivider} />

                {/* Body */}
                <View style={styles.popupBody}>
                <Text style={styles.manualSubtitle}>
                  Décrivez votre idée de startup en quelques mots
                </Text>

                {/* Name input */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons name="business" size={14} color="#FFBC40" />
                    <Text style={styles.fieldLabel}>Nom du projet</Text>
                  </View>
                  <DynamicGradientBorder
                    borderRadius={14}
                    fill="rgba(0, 0, 0, 0.35)"
                    style={styles.inputBorderWrapper}
                  >
                    <View style={styles.inputInner}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Ex. Ma Super App"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={manualName}
                        onChangeText={setManualName}
                        maxLength={NAME_MAX}
                        autoCapitalize="words"
                        returnKeyType="next"
                        onSubmitEditing={() => descriptionInputRef.current?.focus()}
                      />
                    </View>
                  </DynamicGradientBorder>
                  <Text style={styles.charCount}>
                    {manualName.length}/{NAME_MAX}
                  </Text>
                </Animated.View>

                {/* Description input */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons name="document-text" size={14} color="#FFBC40" />
                    <Text style={styles.fieldLabel}>Description</Text>
                  </View>
                  <DynamicGradientBorder
                    borderRadius={14}
                    fill="rgba(0, 0, 0, 0.35)"
                    style={styles.inputBorderWrapper}
                  >
                    <View style={[styles.inputInner, styles.inputInnerMultiline]}>
                      <TextInput
                        ref={descriptionInputRef}
                        style={[styles.textInput, styles.textInputMultiline]}
                        placeholder="Décrivez votre idée en quelques mots..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={manualDescription}
                        onChangeText={setManualDescription}
                        maxLength={DESC_MAX}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  </DynamicGradientBorder>
                  <Text style={styles.charCount}>
                    {manualDescription.length}/{DESC_MAX}
                  </Text>
                </Animated.View>

                {/* Confirm */}
                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                  <GameButton
                    variant="yellow"
                    fullWidth
                    title="CONTINUER"
                    onPress={handleConfirmManual}
                    disabled={!isManualValid}
                  />
                </Animated.View>
              </View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ═══════════════════════ Styles ═══════════════════════ */

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
  scrollContent: {
    paddingHorizontal: 18,
    gap: 20,
  },
  // Résumé des cartes
  summaryContent: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  summaryTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  summaryChip: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryChipText: {
    fontFamily: FONTS.title,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  // Question
  questionTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: '#FFBC40',
    textAlign: 'center',
    marginVertical: 4,
  },
  // Options
  optionContent: {
    padding: 20,
    gap: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tambaliIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(31, 145, 208, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  optionDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
  },

  /* ── Popup shared ── */
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupWrapper: {
    width: '100%',
    maxWidth: 360,
    maxHeight: SCREEN_HEIGHT * 0.82,
  },
  popupCardBorder: {
    width: '100%',
    overflow: 'hidden',
  },
  popupCardInner: {
    overflow: 'hidden',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  popupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  popupTambaliIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupManualIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(31, 145, 208, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupHeaderTitle: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  popupCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  popupBody: {
    padding: 20,
  },

  /* ── AI Loading ── */
  popupLoadingCenter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  popupLoadingTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  popupLoadingSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },

  /* ── AI Ideas ── */
  popupSelectSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 16,
  },
  popupIdeasScroll: {
    maxHeight: SCREEN_HEIGHT * 0.35,
    marginBottom: 16,
  },

  /* ── Manual Popup ── */
  manualSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
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
  inputInnerMultiline: {
    paddingVertical: 14,
    minHeight: 90,
  },
  textInput: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: '#FFFFFF',
  },
  textInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'right',
    marginTop: 6,
  },
});
