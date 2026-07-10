import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicGradientBorder, GameButton, GuestGate, OutlinedText, RadialBackground } from '@/components/ui';
import { useAuthStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useTranslation } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEME = {
  accent: '#FFBC40',
  cardFill: 'rgba(0, 0, 0, 0.35)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textMuted: 'rgba(127, 142, 158, 0.95)',
};

/** Choix créer / rejoindre un salon entre joueurs du même programme. */
export default function ProgramOnlineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    programId: string;
    playerName?: string;
    profileId?: string;
    profileName?: string;
  }>();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const isGuest = user?.isGuest ?? true;
  const programs = useProgramStore((state) => state.programs);
  const getProgramProgress = useProgramStore((state) => state.getProgramProgress);

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );

  if (isGuest) {
    return <GuestGate featureName={t('program.featureName')} description={t('program.guestGenericDesc')} />;
  }

  if (!program) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('program.notFound')}</Text>
          <GameButton title={t('common.back')} variant="blue" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const progress = getProgramProgress(params.programId, userId);
  const levelIndex = Math.min(progress.currentLevel, Math.max(0, (program.contentPacks?.length ?? 1) - 1));
  const currentPack = program.contentPacks?.[levelIndex];

  // Params programme transmis au flux salon existant (create-room / join-room).
  const programParams = {
    programId: program.id,
    partnerId: program.partnerId,
    contentPackId: currentPack?.id ?? '',
    levelIndex: String(levelIndex),
  };

  const createSalon = () => {
    router.push({ pathname: '/(game)/create-room', params: programParams });
  };
  const joinSalon = () => {
    router.push({ pathname: '/(game)/join-room', params: programParams });
  };

  const contentWidth = SCREEN_WIDTH - SPACING[4] * 2;
  const headerBlockHeight = insets.top + 72;

  const OPTIONS = [
    { key: 'create', titleKey: 'program.onlineCreateTitle', subtitleKey: 'program.onlineCreateSub', icon: 'add-circle-outline' as const, onPress: createSalon },
    { key: 'join', titleKey: 'program.onlineJoinTitle', subtitleKey: 'program.onlineJoinSub', icon: 'enter-outline' as const, onPress: joinSalon },
  ];

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top + SPACING[2], backgroundColor: '#0A1929', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={THEME.text} />
          </Pressable>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>{t('program.modeOnlineTitle')}</Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingTop: headerBlockHeight + SPACING[5], paddingBottom: insets.bottom + SPACING[6] }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.subtitleWrap}>
          <OutlinedText text={t('program.onlineIntro')} style={styles.subtitle} outlineColor="#0A1929" outlineWidth={2} />
        </Animated.View>

        {OPTIONS.map((opt, index) => (
          <Animated.View key={opt.key} entering={FadeInDown.delay(200 + index * 100).duration(500)}>
            <Pressable onPress={opt.onPress}>
              <DynamicGradientBorder borderRadius={24} fill={THEME.cardFill} boxWidth={contentWidth} style={{ marginBottom: SPACING[4] }}>
                <View style={styles.cardContent}>
                  <View style={styles.iconColumn}>
                    <View style={styles.iconCircle}>
                      <Ionicons name={opt.icon} size={30} color={THEME.accent} />
                    </View>
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{t(opt.titleKey)}</Text>
                    <Text style={styles.cardDescription}>{t(opt.subtitleKey)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={THEME.textMuted} />
                </View>
              </DynamicGradientBorder>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C243E' },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingBottom: SPACING[4], paddingHorizontal: SPACING[4] },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  backButton: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20,
    backgroundColor: 'rgba(5, 25, 50, 0.75)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTitleWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 48 },
  headerRightSpacer: { width: 40, height: 40 },
  headerTitle: { fontFamily: FONTS.title, fontSize: 22, color: THEME.text, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' },
  contentContainer: { paddingHorizontal: SPACING[4] },
  subtitleWrap: { marginBottom: SPACING[6], alignItems: 'center' },
  subtitle: { fontFamily: FONTS.title, fontSize: FONT_SIZES.lg, textAlign: 'center', letterSpacing: 0.5 },
  cardContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING[5], paddingHorizontal: SPACING[4], gap: SPACING[4] },
  iconColumn: { width: 56, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.06)', alignItems: 'center', justifyContent: 'center' },
  cardTextContainer: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: FONTS.title, fontSize: FONT_SIZES.xl, marginBottom: SPACING[2], color: THEME.text, letterSpacing: 0.5, textTransform: 'uppercase' },
  cardDescription: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, lineHeight: 20, color: THEME.textSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING[4] },
  errorText: { fontFamily: FONTS.title, color: COLORS.white, fontSize: 20 },
});
