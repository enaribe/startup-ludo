/**
 * Liste "Mes programmes" - actif + autres inscriptions
 */

import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { useChallengeStore, useAuthStore } from '@/stores';
import { getChallengeProgress } from '@/types/challenge';
import { getChallengeById } from '@/data/challenges';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { COLORS } from '@/styles/colors';

export default function MyProgramsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 'guest';
  const enrollments = useChallengeStore((s) => s.getUserEnrollments(userId));
  const activeChallengeId = useChallengeStore((s) => s.activeChallengeId);
  const setActiveChallenge = useChallengeStore((s) => s.setActiveChallenge);

  const activeEnrollment = enrollments.find((e) => e.challengeId === activeChallengeId);
  const otherEnrollments = enrollments.filter((e) => e.challengeId !== activeChallengeId);

  const handleActivate = (challengeId: string) => {
    setActiveChallenge(challengeId);
    router.replace('/(challenges)/challenge-hub');
  };

  const handleDiscover = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.headerRow, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Mes programmes</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: 12, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {enrollments.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.empty}>
            <Ionicons name="folder-open-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aucun programme</Text>
            <Text style={styles.emptyDesc}>Rejoins un programme depuis l'accueil.</Text>
            <GameButton variant="yellow" title="DÉCOUVRIR" onPress={handleDiscover} fullWidth style={styles.emptyBtn} />
          </Animated.View>
        ) : (
          <>
            {activeEnrollment && (() => {
              const challenge = getChallengeById(activeEnrollment.challengeId);
              if (!challenge) return null;
              const progress = getChallengeProgress(activeEnrollment.totalXp, challenge.totalXpRequired);
              return (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <Text style={styles.sectionLabel}>Programme actif</Text>
                  <DynamicGradientBorder borderRadius={16} fill="rgba(0,0,0,0.35)" style={styles.card}>
                    <View style={styles.cardInner}>
                      <View style={[styles.logoBox, { backgroundColor: challenge.primaryColor }]}>
                        <Ionicons name="trophy-outline" size={28} color="#1E325A" />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>{challenge.name}</Text>
                        <Text style={styles.cardOrg}>{challenge.organization}</Text>
                        <View style={styles.progressRow}>
                          <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                          </View>
                          <Text style={styles.progressText}>{progress}%</Text>
                        </View>
                        <Text style={styles.cardLevel}>
                          Niveau {activeEnrollment.currentLevel} • Sous-niveau {activeEnrollment.currentSubLevel}
                        </Text>
                      </View>
                      <GameButton
                        variant="yellow"
                        title="CONTINUER"
                        onPress={() => router.replace('/(challenges)/challenge-hub')}
                        fullWidth
                      />
                    </View>
                  </DynamicGradientBorder>
                </Animated.View>
              );
            })()}

            {otherEnrollments.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Autres programmes</Text>
                {otherEnrollments.map((e, idx) => {
                  const challenge = getChallengeById(e.challengeId);
                  if (!challenge) return null;
                  const progress = getChallengeProgress(e.totalXp, challenge.totalXpRequired);
                  return (
                    <Animated.View key={e.id} entering={FadeInDown.delay(100 + idx * 80).duration(300)}>
                      <View style={styles.compactCard}>
                        <View style={[styles.compactLogo, { backgroundColor: challenge.primaryColor + '40' }]}>
                          <Ionicons name="trophy-outline" size={20} color={challenge.primaryColor} />
                        </View>
                        <View style={styles.compactInfo}>
                          <Text style={styles.compactName}>{challenge.name}</Text>
                          <Text style={styles.compactProgress}>{progress}%</Text>
                        </View>
                        <GameButton
                          variant="blue"
                          title="ACTIVER"
                          onPress={() => handleActivate(challenge.id)}
                          size="sm"
                        />
                      </View>
                    </Animated.View>
                  );
                })}
              </>
            )}

            <GameButton variant="blue" title="DÉCOUVRIR D'AUTRES PROGRAMMES" onPress={handleDiscover} fullWidth style={styles.discoverBtn} />
          </>
        )}
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
  headerTitle: { fontFamily: FONTS.title, fontSize: 20, color: '#FFF', flex: 1 },
  scroll: { paddingHorizontal: 18 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: FONTS.title, fontSize: FONT_SIZES.xl, color: COLORS.text, marginTop: SPACING[4] },
  emptyDesc: { fontFamily: FONTS.body, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, marginTop: SPACING[2] },
  emptyBtn: { marginTop: SPACING[6], maxWidth: 280 },
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING[2],
  },
  card: { marginBottom: SPACING[5] },
  cardInner: { padding: SPACING[4] },
  logoBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING[3] },
  cardInfo: { marginBottom: SPACING[4] },
  cardName: { fontFamily: FONTS.title, fontSize: FONT_SIZES.xl, color: COLORS.text },
  cardOrg: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2], marginTop: SPACING[2] },
  progressBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZES.sm, color: COLORS.primary, minWidth: 36 },
  cardLevel: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: SPACING[3],
    marginBottom: SPACING[2],
  },
  compactLogo: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: SPACING[3] },
  compactInfo: { flex: 1 },
  compactName: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.base, color: COLORS.text },
  compactProgress: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  discoverBtn: { marginTop: SPACING[6], marginBottom: SPACING[8] },
});
