import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgramHomeCard } from '@/components/programs';
import { OutlinedText, RadialBackground } from '@/components/ui';
import { useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import { useTranslation } from '@/i18n';

export default function PartnerProgramsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ partnerId: string }>();

  const partners = useProgramStore((state) => state.partners);
  const programs = useProgramStore((state) => state.programs);

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

  // Ratio réel du logo pour que sa box épouse exactement l'image (largeur calée sur la hauteur).
  const [logoRatio, setLogoRatio] = useState<number | null>(null);
  useEffect(() => {
    if (!partner?.logoUrl) {
      setLogoRatio(null);
      return;
    }
    Image.getSize(
      partner.logoUrl,
      (w, h) => setLogoRatio(h > 0 ? w / h : null),
      () => setLogoRatio(null)
    );
  }, [partner?.logoUrl]);

  // Dégradé du header = couleurs du partenaire (même rendu que le bouton « NOUVELLE PARTIE » de l'accueil).
  const gradientColors: [string, string] = [
    partner?.primaryColor ?? COLORS.backgroundLight,
    partner?.secondaryColor ?? COLORS.background,
  ];

  return (
    <View style={styles.container}>
      <RadialBackground />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradientColors}
          style={[styles.partnerHero, { paddingTop: insets.top + SPACING[3] }]}
        >
          {/* PNG détouré du partenaire, posé à droite par-dessus le dégradé */}
          {partner?.heroImageUrl ? (
            <Image
              source={{ uri: partner.heroImageUrl }}
              style={styles.heroForeground}
              resizeMode="contain"
            />
          ) : null}

          {/* Haut : bouton retour, puis « En partenariat avec » + logo */}
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#0A1929" />
          </Pressable>

          <View style={styles.heroPartnership}>
            {partner?.logoUrl ? (
              <Image
                source={{ uri: partner.logoUrl }}
                style={[styles.partnerLogo, logoRatio ? { aspectRatio: logoRatio } : null]}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Bas : titre du partenaire en gros */}
          <View style={styles.heroTextBlock}>
            <OutlinedText
              text={partner?.name ?? t('program.partnerFallback')}
              style={styles.partnerName}
              outlineColor="#0E699C"
              outlineWidth={1.6}
            />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            {sortedPrograms.length > 0
              ? t('program.programsInProgress', { count: sortedPrograms.length })
              : t('program.programsTitle')}
          </Text>

          {sortedPrograms.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="rocket-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>{t('program.emptyTitle')}</Text>
              <Text style={styles.emptyText}>
                {t('program.emptyDesc')}
              </Text>
            </View>
          ) : null}

          <View style={styles.list}>
          {sortedPrograms.map((program) => {
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
                onPress={() => router.push({ pathname: '/(programs)/[programId]', params: { programId: program.id } })}
              />
            );
          })}
          </View>
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
  content: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
    gap: SPACING[4],
  },
  partnerHero: {
    width: '100%',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[4],
    minHeight: 200,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroForeground: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '58%',
    height: '92%',
    // n'intercepte pas les touches (le bouton retour reste cliquable)
    pointerEvents: 'none',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  heroPartnership: {
    marginTop: SPACING[3],
    alignItems: 'flex-start',
  },
  partnerEyebrow: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  partnerLogo: {
    height: 44,
    alignSelf: 'flex-start',
  },
  heroTextBlock: {
    marginTop: 'auto',
    paddingTop: SPACING[4],
    maxWidth: '60%',
  },
  partnerName: {
    fontFamily: FONTS.title,
    fontSize: 26,
    lineHeight: 30,
    color: COLORS.white,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.white,
  },
  list: {
    gap: SPACING[4],
  },
  emptyState: {
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[6],
    paddingHorizontal: SPACING[4],
  },
  emptyTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.white,
    marginTop: SPACING[2],
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
