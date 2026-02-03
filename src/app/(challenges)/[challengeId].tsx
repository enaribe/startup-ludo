/**
 * Détail d'un programme Challenge - Hero, timeline niveaux, secteurs, bouton Rejoindre/Continuer
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { useChallengeStore, useAuthStore } from '@/stores';
import { getChallengeById } from '@/data/challenges';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { COLORS } from '@/styles/colors';

export default function ChallengeDetailScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const challenge = challengeId ? getChallengeById(challengeId) : undefined;
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 'guest';
  const enrollInChallenge = useChallengeStore((s) => s.enrollInChallenge);
  const setActiveChallenge = useChallengeStore((s) => s.setActiveChallenge);
  const enrollment = challenge ? useChallengeStore((s) => s.getEnrollmentForChallenge(challenge.id)) : undefined;
  const isEnrolled = Boolean(enrollment);

  const handleAction = () => {
    if (!challenge) return;
    if (isEnrolled) {
      setActiveChallenge(challenge.id);
      router.replace('/(challenges)/challenge-hub');
    } else {
      enrollInChallenge(challenge.id, userId);
      setActiveChallenge(challenge.id);
      router.replace('/(challenges)/challenge-hub');
    }
  };

  if (!challenge) {
    return (
      <View style={styles.container}>
        <RadialBackground />
        <View style={[styles.headerRow, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Programme</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.error}>Programme introuvable.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.headerRow, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{challenge.name}</Text>
          <Text style={styles.headerSubtitle}>{challenge.organization}</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0,0,0,0.35)" style={styles.hero}>
            <View style={styles.heroInner}>
              <View style={[styles.logoBox, { backgroundColor: challenge.primaryColor }]}>
                <Ionicons name="trophy-outline" size={40} color="#1E325A" />
              </View>
              <Text style={styles.heroName}>{challenge.name}</Text>
              <Text style={styles.heroOrg}>{challenge.organization}</Text>
              <Text style={styles.heroDesc}>{challenge.description}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{challenge.totalLevels} niveaux</Text>
                <Text style={styles.meta}>•</Text>
                <Text style={styles.meta}>16 étapes</Text>
                <Text style={styles.meta}>•</Text>
                <Text style={styles.meta}>{challenge.sectors.length} secteurs</Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        <Text style={styles.sectionTitle}>Niveaux</Text>
        {challenge.levels.map((level, idx) => (
          <Animated.View key={level.id} entering={FadeInDown.delay(100 + idx * 80).duration(400)}>
            <View style={styles.levelRow}>
              <View style={[styles.levelIcon, { backgroundColor: challenge.primaryColor + '30' }]}>
                <Ionicons name={level.iconName as keyof typeof Ionicons.glyphMap} size={22} color={challenge.primaryColor} />
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelName}>Niveau {level.number} - {level.name}</Text>
                <Text style={styles.levelDesc}>{level.description}</Text>
                <Text style={styles.levelXp}>{level.xpRequired.toLocaleString('fr-FR')} XP</Text>
              </View>
            </View>
          </Animated.View>
        ))}

        <Text style={styles.sectionTitle}>Secteurs</Text>
        <View style={styles.sectorsGrid}>
          {challenge.sectors.map((s) => (
            <View key={s.id} style={[styles.sectorCard, { borderLeftColor: s.color }]}>
              <Ionicons name={s.iconName as keyof typeof Ionicons.glyphMap} size={20} color={s.color} />
              <Text style={styles.sectorName}>{s.name}</Text>
            </View>
          ))}
        </View>

        <GameButton
          variant={isEnrolled ? 'yellow' : 'green'}
          title={isEnrolled ? 'CONTINUER' : 'REJOINDRE'}
          onPress={handleAction}
          fullWidth
          style={styles.cta}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitles: { flex: 1 },
  headerTitle: { fontFamily: FONTS.title, fontSize: 20, color: '#FFF' },
  headerSubtitle: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { fontFamily: FONTS.body, fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  scroll: { paddingHorizontal: 18 },
  hero: { marginBottom: SPACING[5] },
  heroInner: { padding: SPACING[5] },
  logoBox: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING[3] },
  heroName: { fontFamily: FONTS.title, fontSize: FONT_SIZES['2xl'], color: COLORS.text, marginBottom: 4 },
  heroOrg: { fontFamily: FONTS.body, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, marginBottom: SPACING[2] },
  heroDesc: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted, lineHeight: 20, marginBottom: SPACING[3] },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: SPACING[3],
  },
  levelIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: SPACING[3] },
  levelInfo: { flex: 1 },
  levelName: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.base, color: COLORS.text },
  levelDesc: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  levelXp: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.primary, marginTop: 4 },
  sectorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2], marginBottom: SPACING[5] },
  sectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: SPACING[3],
    borderLeftWidth: 4,
  },
  sectorName: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZES.sm, color: COLORS.text, marginLeft: SPACING[2], flex: 1 },
  cta: { marginBottom: SPACING[8] },
});
