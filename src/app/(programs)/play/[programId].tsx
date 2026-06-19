import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgramEnrollmentModal } from '@/components/programs';
import { GameButton, GuestGate, OutlinedText, RadialBackground } from '@/components/ui';
import { useAuthStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import { useTranslation } from '@/i18n';
import type { ProgramEnrollmentFormData } from '@/types/program';

export default function ProgramPlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ programId: string }>();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const isGuest = user?.isGuest ?? true;
  const programs = useProgramStore((state) => state.programs);
  const partners = useProgramStore((state) => state.partners);
  const enrollments = useProgramStore((state) => state.enrollments);
  const enrollInProgram = useProgramStore((state) => state.enrollInProgram);
  const getProgramProgress = useProgramStore((state) => state.getProgramProgress);
  const [showEnroll, setShowEnroll] = useState(false);
  const [playerName, setPlayerName] = useState(user?.displayName || '');

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );
  const partner = useMemo(
    () => program ? partners.find((item) => item.id === program.partnerId) : undefined,
    [partners, program]
  );
  const progress = useMemo(
    () => getProgramProgress(params.programId, userId),
    // enrollments/programs en déps pour recalculer la progression quand le store change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getProgramProgress, params.programId, userId, enrollments, programs]
  );
  // Niveau courant à jouer (clampé). Le pack correspondant alimente le contenu de la partie.
  const levelIndex = Math.min(progress.currentLevel, Math.max(0, (program?.contentPacks?.length ?? 1) - 1));
  const currentPack = program?.contentPacks?.[levelIndex];

  if (isGuest) {
    return (
      <GuestGate
        featureName={t('program.featureName')}
        description={t('program.guestPlayDesc')}
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

  const goToProfileChoice = () => {
    // Parcours déjà terminé : on propose le formulaire (optionnel) plutôt que rejouer.
    if (progress.isCompleted) {
      setShowEnroll(true);
      return;
    }
    // Étape suivante : choix du profil à incarner, puis du mode de jeu.
    router.push({
      pathname: '/(programs)/play/profile/[programId]',
      params: { programId: program.id, playerName: playerName.trim() },
    });
  };

  const handleEnroll = (formData: ProgramEnrollmentFormData) => {
    enrollInProgram(program.id, userId, formData);
    setShowEnroll(false);
  };

  const playerLabel = playerName.trim() || user?.displayName || t('program.you');

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <OutlinedText text={t('program.quickGame')} style={styles.headerTitle} outlineColor="#0E699C" outlineWidth={1.4} />
        <Text style={styles.headerStep}>{t('program.levelProgress', { current: Math.min(levelIndex + 1, progress.totalLevels), total: progress.totalLevels })}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          {currentPack?.name
            ? t('program.playIntroLevel', { level: levelIndex + 1, name: currentPack.name })
            : t('program.playIntroProfile', { count: progress.totalLevels })}
        </Text>

        <View style={styles.modePill}>
          <Text style={styles.modePillText}>{t('program.modeSolo')}</Text>
        </View>

        <Text style={styles.fieldLabel}>{t('program.playerNameLabel')}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={playerName}
            onChangeText={setPlayerName}
            placeholder={t('program.playerNamePlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.input}
            maxLength={24}
          />
        </View>

        <View style={styles.vsCard}>
          <View style={styles.vsPlayer}>
            <View style={[styles.vsAvatar, { backgroundColor: COLORS.players.blue }]}>
              <Ionicons name="person" size={30} color={COLORS.white} />
            </View>
            <OutlinedText text={playerLabel.toUpperCase()} style={styles.vsName} outlineColor="#0E699C" outlineWidth={1.2} />
            <Text style={styles.vsRole}>{t('program.you')}</Text>
          </View>

          <View style={styles.vsMiddle}>
            <Text style={styles.vsTextV}>V</Text>
            <Ionicons name="flash" size={26} color={COLORS.primary} />
            <Text style={styles.vsTextS}>S</Text>
          </View>

          <View style={styles.vsPlayer}>
            <View style={[styles.vsAvatar, { backgroundColor: COLORS.players.green }]}>
              <Ionicons name="sparkles" size={26} color={COLORS.white} />
            </View>
            <OutlinedText text="ADIA" style={styles.vsName} outlineColor="#2E7D32" outlineWidth={1.2} />
            <Text style={styles.vsRole}>{t('program.ai')}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {t('program.adiaInfo')}
          </Text>
        </View>

        {partner?.shortName ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {t('program.dataConsent', { partner: partner.shortName })}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[3] }]}>
        <GameButton
          title={progress.isCompleted ? t('program.fillForm') : t('program.chooseProfile')}
          variant="yellow"
          fullWidth
          onPress={goToProfileChoice}
        />
      </View>

      <ProgramEnrollmentModal
        visible={showEnroll}
        programName={program.name}
        defaultFullName={user?.displayName}
        defaultEmail={user?.email}
        endForm={program.endForm}
        onSubmit={handleEnroll}
        onClose={() => setShowEnroll(false)}
      />
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
  headerStep: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    width: 60,
    textAlign: 'right',
  },
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
  modePill: {
    alignSelf: 'center',
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[2],
    borderRadius: 22,
    backgroundColor: 'rgba(255,188,64,0.08)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  modePillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.primary,
  },
  fieldLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.white,
    marginBottom: -SPACING[2],
  },
  inputWrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: SPACING[4],
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.white,
    paddingVertical: SPACING[4],
  },
  vsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[5],
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  vsPlayer: {
    alignItems: 'center',
    gap: SPACING[2],
    flex: 1,
  },
  vsAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsName: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: COLORS.white,
  },
  vsRole: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  vsMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[2],
  },
  vsTextV: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: COLORS.primary,
  },
  vsTextS: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: '#AC700C',
  },
  infoBox: {
    padding: SPACING[4],
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 20,
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
