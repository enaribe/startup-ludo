import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AutoWidthLogo } from '@/components/programs';
import { GameButton, GuestGate, OutlinedText, RadialBackground } from '@/components/ui';
import { useAuthStore, useProgramStore } from '@/stores';
import { startProgramPlay } from '@/utils/programPlayNav';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import { useTranslation } from '@/i18n';

export default function ProgramDetailScreen() {
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
  const getProgramProgress = useProgramStore((state) => state.getProgramProgress);

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );
  const partner = useMemo(
    () => program ? partners.find((item) => item.id === program.partnerId) : undefined,
    [partners, program]
  );
  const coPartners = useMemo(
    () =>
      (program?.coPartnerIds ?? [])
        .map((id) => partners.find((item) => item.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [partners, program]
  );
  const progress = useMemo(
    () => getProgramProgress(params.programId, userId),
    // enrollments/programs en déps pour recalculer la progression quand le store change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getProgramProgress, params.programId, userId, enrollments, programs]
  );
  // A déjà commencé le parcours (au moins 1 niveau validé) → "CONTINUER", sinon "JOUER".
  const hasStarted = progress.currentLevel > 0;

  if (isGuest) {
    return (
      <GuestGate
        featureName={t('program.featureName')}
        description={t('program.guestDetailDesc')}
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

  // « À qui s'adresse ce parcours » : priorité à eligibility (rempli dans l'admin),
  // repli sur audience (ancien champ, encore utilisé par certains programmes).
  const audienceChips = (() => {
    const chips: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [];
    const elig = program.eligibility;
    const aud = program.audience;

    // Âge : eligibility (min-max) sinon audience.ageRange.
    const ageLabel =
      elig && (elig.ageMin != null || elig.ageMax != null)
        ? `${elig.ageMin ?? ''}${elig.ageMin != null && elig.ageMax != null ? '-' : ''}${elig.ageMax ?? ''} ${t('program.years')}`.trim()
        : aud?.ageRange || '';
    if (ageLabel) chips.push({ icon: 'people-outline', label: ageLabel });

    // Régions / lieux.
    const regions = (elig?.regions?.length ? elig.regions : aud?.locations ?? []).filter(Boolean);
    if (regions.length) chips.push({ icon: 'location-outline', label: regions.join(' - ') });

    // Secteurs.
    const sectors = (elig?.sectors?.length ? elig.sectors : (aud?.sector ? [aud.sector] : [])).filter(Boolean);
    if (sectors.length) chips.push({ icon: 'leaf-outline', label: sectors.join(' - ') });

    // Profils.
    const profiles = (elig?.audienceProfiles?.length ? elig.audienceProfiles : (aud?.profile ? [aud.profile] : [])).filter(Boolean);
    if (profiles.length) chips.push({ icon: 'ribbon-outline', label: profiles.join(' - ') });

    return chips;
  })();

  const handleMainAction = () => {
    if (!program) return;
    // Écran QUICK GAME supprimé : si un profil est déjà choisi → écran de mode
    // (locale / en ligne), sinon → écran de choix de profil d'abord.
    startProgramPlay(router, program, userId, user?.displayName || '');
  };

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.white} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 82, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {(() => {
          // Logos co-partenaires : d'abord celui uploadé sur le programme, puis les co-partenaires cochés.
          const coPartnerLogos = [
            ...(program.bannerUrl ? [program.bannerUrl] : []),
            ...coPartners.map((item) => item.logoUrl).filter((url): url is string => Boolean(url)),
          ];
          const heroBackground = program.heroImageUrl;
          const heroInner = (
            <>
              {/* Haut : co-partenaire(s) à gauche, partenaire principal à droite */}
              <View style={styles.heroTopRow}>
                {coPartnerLogos.length > 0 ? (
                  <View style={styles.heroCoPartnerRow}>
                    {coPartnerLogos.map((logo, i) => (
                      <AutoWidthLogo key={i} uri={logo} height={28} />
                    ))}
                  </View>
                ) : (
                  <View />
                )}
                {partner?.logoUrl ? (
                  <AutoWidthLogo uri={partner.logoUrl} height={46} />
                ) : partner ? (
                  <Text style={styles.heroPartnerName}>{partner.shortName}</Text>
                ) : (
                  <View />
                )}
              </View>

              {/* Centre : logo du programme + badge joueurs, centrés */}
              <View style={styles.heroCenter}>
                {program.logoUrl ? (
                  <Image source={{ uri: program.logoUrl }} style={styles.heroProgramLogo} resizeMode="contain" />
                ) : (
                  <Text style={styles.heroTitle}>{program.name}</Text>
                )}
                <View style={styles.playerBadge}>
                  <Ionicons name="people" size={15} color={COLORS.info} />
                  <Text style={styles.playerBadgeText}>{t('program.playersCount', { count: program.playerCount.toLocaleString() })}</Text>
                </View>
              </View>
            </>
          );
          return heroBackground ? (
            <ImageBackground
              source={{ uri: heroBackground }}
              style={styles.hero}
              imageStyle={styles.heroImage}
              resizeMode="cover"
            >
              <View style={styles.heroScrim} />
              {heroInner}
            </ImageBackground>
          ) : (
            <View style={[styles.hero, { backgroundColor: program.primaryColor }]}>
              {heroInner}
            </View>
          );
        })()}

        <Text style={styles.title}>{program.name}</Text>
        <Text style={styles.description}>{program.description}</Text>

        {audienceChips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('program.audienceTitle')}</Text>
            <View style={styles.chipWrap}>
              {audienceChips.map((c, i) => (
                <InfoChip key={`${c.icon}_${i}`} icon={c.icon} label={c.label} />
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>{t('program.whatAwaitsTitle')}</Text>
        <View style={styles.expectGrid}>
          <ExpectCard icon="layers-outline" title={t('program.expectLevels', { count: progress.totalLevels })} subtitle={t('program.expectLevelsSub')} />
          <ExpectCard icon="person-outline" title={t('program.expectProfile')} subtitle={t('program.expectProfileSub')} />
          <ExpectCard icon="document-text-outline" title={t('program.expectForm')} subtitle={t('program.expectFormSub')} />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[3] }]}>
        <GameButton
          title={progress.isCompleted ? t('program.replayProgram') : hasStarted ? t('program.continueLevel', { level: Math.min(progress.currentLevel + 1, progress.totalLevels) }) : t('program.start')}
          variant="yellow"
          fullWidth
          onPress={handleMainAction}
        />
      </View>
    </View>
  );
}

function InfoChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.infoChip}>
      <Ionicons name={icon} size={16} color={COLORS.info} />
      <Text style={styles.infoChipText}>{label}</Text>
    </View>
  );
}

function ExpectCard({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={styles.expectCard}>
      <Ionicons name={icon} size={34} color={COLORS.info} style={styles.expectIcon} />
      <OutlinedText text={title} style={styles.expectTitle} outlineColor="#0E699C" outlineWidth={1.2} />
      <Text style={styles.expectSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: SPACING[4],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[4],
  },
  hero: {
    aspectRatio: 340 / 195,
    borderRadius: 24,
    padding: SPACING[4],
    overflow: 'hidden',
  },
  heroImage: {
    borderRadius: 24,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCoPartnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroPartnerName: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[3],
  },
  heroProgramLogo: {
    width: 150,
    height: 62,
  },
  heroTitle: {
    fontFamily: FONTS.title,
    fontSize: 28,
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  playerBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: '#132840',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 28,
    color: COLORS.white,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 25,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 19,
    color: COLORS.white,
    marginTop: SPACING[2],
  },
  chipWrap: {
    gap: SPACING[2],
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoChipText: {
    flexShrink: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.white,
  },
  expectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
  },
  expectCard: {
    width: '47%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  expectIcon: {
    marginBottom: SPACING[1],
  },
  expectTitle: {
    fontFamily: FONTS.title,
    fontSize: 17,
    color: COLORS.white,
    textAlign: 'center',
  },
  expectSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[4],
    padding: SPACING[4],
  },
  errorText: {
    fontFamily: FONTS.title,
    color: COLORS.white,
    fontSize: 20,
  },
});
