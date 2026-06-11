import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgramHomeCard } from '@/components/programs';
import { RadialBackground } from '@/components/ui';
import { useAuthStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';

export default function PartnerProgramsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ partnerId: string }>();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const isGuest = user?.isGuest ?? true;

  const partners = useProgramStore((state) => state.partners);
  const programs = useProgramStore((state) => state.programs);
  const getEnrollmentForProgram = useProgramStore((state) => state.getEnrollmentForProgram);
  const getProgramPlayAccess = useProgramStore((state) => state.getProgramPlayAccess);

  const partner = useMemo(
    () => partners.find((item) => item.id === params.partnerId),
    [partners, params.partnerId]
  );
  const sortedPrograms = useMemo(
    () => programs
      .filter(
        (program) =>
          program.isActive &&
          (program.partnerId === params.partnerId || program.coPartnerIds?.includes(params.partnerId))
      )
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [programs, params.partnerId]
  );

  const heroContent = (
    <>
      <Text style={styles.partnerEyebrow}>En partenariat avec</Text>
      {partner?.logoUrl ? (
        <Image source={{ uri: partner.logoUrl }} style={styles.partnerLogo} resizeMode="contain" />
      ) : null}
      <Text style={styles.partnerName}>{partner?.name ?? 'Partenaire'}</Text>
      <Text style={styles.partnerDescription}>{partner?.description ?? 'Programmes disponibles'}</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>PROGRAMMES</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 92, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {partner?.bannerUrl ? (
          <ImageBackground
            source={{ uri: partner.bannerUrl }}
            style={styles.partnerHero}
            imageStyle={styles.partnerHeroImage}
            resizeMode="cover"
          >
            <View style={styles.partnerHeroScrim} />
            {heroContent}
          </ImageBackground>
        ) : (
          <View style={[styles.partnerHero, { backgroundColor: partner?.primaryColor ?? COLORS.backgroundLight }]}>
            {heroContent}
          </View>
        )}

        <Text style={styles.sectionTitle}>{sortedPrograms.length} PARCOURS EN COURS</Text>
        <View style={styles.list}>
          {sortedPrograms.map((program) => {
            const enrollment = getEnrollmentForProgram(program.id, userId);
            const access = getProgramPlayAccess(program.id, userId, isGuest);
            const mainPartner = partners.find((item) => item.id === program.partnerId) ?? partner;
            const coPartners = (program.coPartnerIds ?? [])
              .map((id) => partners.find((item) => item.id === id))
              .filter((item): item is NonNullable<typeof item> => Boolean(item));
            return (
              <ProgramHomeCard
                key={program.id}
                program={program}
                partner={mainPartner}
                coPartners={coPartners}
                enrollment={enrollment ?? null}
                access={access}
                onPress={() => router.push({ pathname: '/(programs)/[programId]', params: { programId: program.id } })}
                onPlay={() => router.push({ pathname: '/(programs)/play/[programId]', params: { programId: program.id } })}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: COLORS.white,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[4],
  },
  partnerHero: {
    borderRadius: 24,
    padding: SPACING[5],
    minHeight: 170,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  partnerHeroImage: {
    borderRadius: 24,
  },
  partnerHeroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 41, 0.35)',
  },
  partnerLogo: {
    width: 92,
    height: 48,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  partnerEyebrow: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
  },
  partnerName: {
    fontFamily: FONTS.title,
    fontSize: 30,
    color: COLORS.white,
  },
  partnerDescription: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.white,
  },
  list: {
    gap: SPACING[4],
  },
});
