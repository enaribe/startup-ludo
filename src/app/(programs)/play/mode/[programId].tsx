import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton, GuestGate, OutlinedText, RadialBackground } from '@/components/ui';
import { useAuthStore, useGameStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import { useTranslation } from '@/i18n';

type ModeKey = 'solo' | 'duel' | 'tournament';

const MODES: { key: ModeKey; titleKey: string; subtitleKey: string; icon: keyof typeof Ionicons.glyphMap; available: boolean }[] = [
  { key: 'solo', titleKey: 'program.modeSoloTitle', subtitleKey: 'program.modeSoloSub', icon: 'phone-portrait-outline', available: true },
  { key: 'duel', titleKey: 'program.modeDuelTitle', subtitleKey: 'program.modeDuelSub', icon: 'people-outline', available: false },
  { key: 'tournament', titleKey: 'program.modeTournamentTitle', subtitleKey: 'program.modeTournamentSub', icon: 'trophy-outline', available: false },
];

export default function ProgramModeScreen() {
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
  const enrollments = useProgramStore((state) => state.enrollments);
  const createProgramSession = useProgramStore((state) => state.createProgramSession);
  const getProgramProgress = useProgramStore((state) => state.getProgramProgress);
  const initGame = useGameStore((state) => state.initGame);

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );
  const enrollment = enrollments.find((item) => item.programId === params.programId && item.userId === userId);
  const progress = getProgramProgress(params.programId, userId);

  const [selectedMode, setSelectedMode] = useState<ModeKey>('solo');

  if (isGuest) {
    return (
      <GuestGate
        featureName={t('program.featureName')}
        description={t('program.guestGenericDesc')}
      />
    );
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

  // Le joueur prend le nom du profil choisi, sinon son pseudo saisi, sinon son displayName.
  const playerLabel =
    params.profileName?.trim() ||
    params.playerName?.trim() ||
    user?.displayName ||
    t('program.you');

  const levelIndex = Math.min(progress.currentLevel, Math.max(0, (program.contentPacks?.length ?? 1) - 1));
  const currentPack = program.contentPacks?.[levelIndex];

  const startSoloGame = () => {
    const gameId = `program_${program.id}_${Date.now()}`;
    const session = createProgramSession(program.id, userId, false, gameId, levelIndex);
    if (!session) return;

    initGame(
      'solo',
      'classic',
      [
        {
          id: userId,
          name: playerLabel,
          color: 'blue',
          isAI: false,
          isHost: true,
          isConnected: true,
        },
        {
          id: `ai_${program.id}`,
          name: 'ADIA',
          color: 'green',
          isAI: true,
          isHost: false,
          isConnected: true,
        },
      ],
      {
        origin: 'program',
        partnerId: program.partnerId,
        programId: program.id,
        enrollmentId: enrollment?.id ?? null,
        sessionId: session.id,
        isTrial: false,
        contentPackId: currentPack?.id,
        levelIndex,
        profileId: params.profileId || null,
        profileName: params.profileName || null,
      }
    );

    router.replace({
      pathname: '/(game)/play/[gameId]',
      params: { gameId, mode: 'solo', programId: program.id, programSessionId: session.id },
    });
  };

  const handleContinue = () => {
    // Seul le mode Solo est actif pour l'instant.
    if (selectedMode === 'solo') startSoloGame();
  };

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <OutlinedText text={t('program.gameMode')} style={styles.headerTitle} outlineColor="#0E699C" outlineWidth={1.4} />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          {t('program.modeIntro', { count: progress.totalLevels })}
        </Text>

        {MODES.map((mode) => {
          const selected = selectedMode === mode.key;
          return (
            <Pressable
              key={mode.key}
              onPress={() => mode.available && setSelectedMode(mode.key)}
              style={[
                styles.modeCard,
                selected && mode.available && styles.modeCardSelected,
                !mode.available && styles.modeCardDisabled,
              ]}
            >
              <View style={styles.modeIcon}>
                <Ionicons name={mode.icon} size={26} color={mode.available ? COLORS.info : COLORS.textMuted} />
              </View>
              <View style={styles.modeTextWrap}>
                <View style={styles.modeTitleRow}>
                  <OutlinedText text={t(mode.titleKey)} style={styles.modeTitle} outlineColor="#0E699C" outlineWidth={1} />
                  {!mode.available && <Text style={styles.soonBadge}>{t('program.soon')}</Text>}
                </View>
                <Text style={styles.modeSubtitle}>{t(mode.subtitleKey)}</Text>
              </View>
              {selected && mode.available && (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[3] }]}>
        <GameButton title={t('program.continue')} variant="yellow" fullWidth onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.white,
  },
  headerSpacer: { width: 44 },
  content: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
    gap: SPACING[4],
  },
  intro: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[4],
    padding: SPACING[4],
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,188,64,0.08)',
  },
  modeCardDisabled: {
    opacity: 0.55,
  },
  modeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTextWrap: {
    flex: 1,
    gap: 4,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  modeTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.white,
  },
  soonBadge: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.primary,
    backgroundColor: 'rgba(255,188,64,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modeSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
    backgroundColor: '#0A1929',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING[4],
  },
  errorText: {
    fontFamily: FONTS.title,
    color: COLORS.white,
    fontSize: 20,
  },
});
