import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgramEnrollmentModal } from '@/components/programs';
import { DynamicGradientBorder, GameButton, GuestGate, RadialBackground } from '@/components/ui';
import { useAuthStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import type { ProgramEnrollmentFormData } from '@/types/program';

export default function ProgramDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ programId: string }>();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const isGuest = user?.isGuest ?? true;

  const programs = useProgramStore((state) => state.programs);
  const partners = useProgramStore((state) => state.partners);
  const enrollments = useProgramStore((state) => state.enrollments);
  const sessions = useProgramStore((state) => state.sessions);
  const enrollInProgram = useProgramStore((state) => state.enrollInProgram);
  const [showEnroll, setShowEnroll] = useState(false);

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
  const enrollment = useMemo(
    () => enrollments.find((item) => item.programId === params.programId && item.userId === userId),
    [enrollments, params.programId, userId]
  );
  const access = useMemo(() => {
    if (!program || !program.isActive) {
      return { canPlay: false, reason: 'program_not_found' as const, requiresEnrollment: false, isTrial: false };
    }
    if (!userId || isGuest) {
      return { canPlay: false, reason: 'guest_blocked' as const, requiresEnrollment: true, isTrial: false };
    }
    if (enrollment?.formData) {
      return { canPlay: true, reason: 'enrolled' as const, requiresEnrollment: false, isTrial: false };
    }
    const hasPlayed = sessions.some((session) => session.programId === params.programId && session.userId === userId);
    return hasPlayed
      ? { canPlay: false, reason: 'trial_used' as const, requiresEnrollment: true, isTrial: false }
      : { canPlay: true, reason: 'trial_available' as const, requiresEnrollment: false, isTrial: true };
  }, [program, userId, isGuest, enrollment, sessions, params.programId]);

  if (isGuest) {
    return (
      <GuestGate
        featureName="Programmes"
        description="Cree un compte pour tester les programmes partenaires et sauvegarder ta progression."
      />
    );
  }

  if (!program) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <View style={styles.center}>
          <Text style={styles.errorText}>Programme introuvable</Text>
          <GameButton title="Retour" variant="blue" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const handleEnroll = (formData: ProgramEnrollmentFormData) => {
    enrollInProgram(program.id, userId, formData);
    setShowEnroll(false);
  };

  const handleMainAction = () => {
    if (access.canPlay) {
      router.push({ pathname: '/(programs)/play/[programId]', params: { programId: program.id } });
      return;
    }
    setShowEnroll(true);
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
          const allPartners = partner ? [partner, ...coPartners] : coPartners;
          // Image de fond propre au programme (heroImageUrl) en priorité, bannière en repli.
          const heroBackground = program.heroImageUrl || program.bannerUrl;
          const heroInner = (
            <>
              <View style={styles.heroTopRow}>
                <View style={styles.heroPartnership}>
                  <Text style={styles.heroPartner}>En partenariat avec</Text>
                  <View style={styles.heroPartnerLogos}>
                    {allPartners.length > 0 ? (
                      allPartners.map((item) =>
                        item.logoUrl ? (
                          <Image key={item.id} source={{ uri: item.logoUrl }} style={styles.heroPartnerLogo} resizeMode="contain" />
                        ) : (
                          <Text key={item.id} style={styles.heroPartnerName}>{item.shortName}</Text>
                        )
                      )
                    ) : (
                      <Text style={styles.heroPartnerName}>Partenaire</Text>
                    )}
                  </View>
                </View>
                {program.logoUrl ? (
                  <View style={styles.heroProgramLogoBadge}>
                    <Image source={{ uri: program.logoUrl }} style={styles.heroProgramLogo} resizeMode="contain" />
                  </View>
                ) : null}
              </View>
              <Text style={styles.heroTitle}>{program.name}</Text>
              <View style={styles.playerBadge}>
                <Ionicons name="people" size={15} color={COLORS.info} />
                <Text style={styles.playerBadgeText}>{program.playerCount.toLocaleString()} joueurs</Text>
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

        <Text style={styles.sectionTitle}>A QUI S'ADRESSE CE PARCOURS</Text>
        <View style={styles.chipWrap}>
          {program.audience.ageRange && <InfoChip icon="people-outline" label={program.audience.ageRange} />}
          <InfoChip icon="location-outline" label={program.audience.locations.join(' - ')} />
          <InfoChip icon="leaf-outline" label={program.audience.sector} />
          <InfoChip icon="ribbon-outline" label={program.audience.profile} />
        </View>

        <Text style={styles.sectionTitle}>CE QUI VOUS ATTEND</Text>
        <DynamicGradientBorder borderRadius={20} fill="rgba(0,0,0,0.32)">
          <View style={styles.expectations}>
            <InfoRow icon="game-controller-outline" label={`${program.sessionCount} parties contre l'IA`} />
            <InfoRow icon="help-circle-outline" label="Quiz, opportunites, challenges et financements dedies" />
            <InfoRow icon="school-outline" label={enrollment?.formData ? 'Inscription active' : 'Premiere partie de decouverte disponible'} />
          </View>
        </DynamicGradientBorder>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[3] }]}>
        <GameButton
          title={access.canPlay ? 'JOUER' : "S'INSCRIRE"}
          variant="yellow"
          fullWidth
          onPress={handleMainAction}
        />
      </View>

      <ProgramEnrollmentModal
        visible={showEnroll}
        programName={program.name}
        defaultFullName={user?.displayName}
        defaultEmail={user?.email}
        onSubmit={handleEnroll}
        onClose={() => setShowEnroll(false)}
      />
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

function InfoRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.infoRowText}>{label}</Text>
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
    minHeight: 240,
    borderRadius: 24,
    padding: SPACING[5],
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    borderRadius: 24,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 41, 0.35)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
  },
  heroPartnership: {
    gap: 6,
    flexShrink: 1,
  },
  heroPartnerLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPartnerLogo: {
    width: 72,
    height: 42,
  },
  heroPartnerName: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroProgramLogoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroProgramLogo: {
    width: 44,
    height: 44,
  },
  heroPartner: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroTitle: {
    fontFamily: FONTS.title,
    fontSize: 30,
    color: COLORS.white,
    maxWidth: '82%',
  },
  playerBadge: {
    marginTop: SPACING[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
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
  expectations: {
    padding: SPACING[4],
    gap: SPACING[3],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoRowText: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
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
