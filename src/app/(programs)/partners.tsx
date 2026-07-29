import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerHomeCard } from '@/components/programs';
import { DynamicGradientBorder, GameButton, OutlinedText, RadialBackground } from '@/components/ui';
import { useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';

export default function AllPartnersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const partners = useProgramStore((state) => state.partners);
  const programs = useProgramStore((state) => state.programs);

  const activePartners = useMemo(
    () => partners.filter((partner) => partner.isActive),
    [partners]
  );

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <OutlinedText text="PARTENAIRES" style={styles.headerTitle} outlineColor="#0E699C" outlineWidth={1.4} />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* CTA : devenir partenaire */}
        <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
          <View style={styles.ctaCard}>
            <View style={styles.ctaIconWrap}>
              <Ionicons name="briefcase-outline" size={26} color={COLORS.primary} />
            </View>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>Vous aussi, devenez partenaire</Text>
              <Text style={styles.ctaSubtitle}>
                Faites jouer votre communauté et détectez de nouveaux talents entrepreneuriaux.
              </Text>
            </View>
            <GameButton
              title="DEVENIR PARTENAIRE"
              variant="yellow"
              fullWidth
              onPress={() => router.push('/(programs)/become-partner')}
            />
          </View>
        </DynamicGradientBorder>

        {/* Liste des partenaires */}
        {activePartners.length > 0 ? (
          <View style={styles.list}>
            {activePartners.map((partner) => {
              const partnerPrograms = programs.filter(
                (program) =>
                  program.isActive &&
                  (program.partnerId === partner.id || program.coPartnerIds?.includes(partner.id))
              );
              const playerCount = partnerPrograms.reduce((sum, program) => sum + program.playerCount, 0);
              return (
                <PartnerHomeCard
                  key={partner.id}
                  partner={partner}
                  playerCount={playerCount}
                  onPress={() => router.push({
                    pathname: '/(programs)/partner/[partnerId]',
                    params: { partnerId: partner.id },
                  })}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Ionicons name="business-outline" size={44} color="#71808E" />
            <Text style={styles.emptyText}>Aucun partenaire pour le moment.</Text>
          </View>
        )}
      </ScrollView>
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
    gap: SPACING[5],
  },
  ctaCard: {
    padding: SPACING[4],
    gap: SPACING[3],
  },
  ctaIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,188,64,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextWrap: {
    gap: 4,
    marginBottom: SPACING[1],
  },
  ctaTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.white,
  },
  ctaSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  list: {
    gap: SPACING[5],
  },
  emptyWrap: {
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[8],
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
