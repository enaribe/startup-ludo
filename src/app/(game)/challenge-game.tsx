/**
 * Setup pré-partie Challenge - config auto Solo vs IA, joueur vert, IA bleu
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { useChallengeStore, useGameStore, useAuthStore } from '@/stores';
import { getChallengeById } from '@/data/challenges';
import { getLevelProgress } from '@/types/challenge';
import type { ChallengeContext } from '@/types';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { COLORS } from '@/styles/colors';

function getEditionFromSector(sectorId: string | null, challengeId: string): string {
  if (!sectorId) return 'classic';
  const sector = getChallengeById(challengeId)?.sectors.find((s) => s.id === sectorId);
  if (!sector) return 'classic';
  if (sector.category === 'agriculture') return 'agriculture';
  if (sector.category === 'services') return 'culture'; // fallback édition "services"-like
  return 'classic';
}

export default function ChallengeGameScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const challenge = challengeId ? useChallengeStore((s) => s.getChallengeById(challengeId)) : undefined;
  const enrollment = challengeId ? useChallengeStore((s) => s.getEnrollmentForChallenge(challengeId)) : undefined;
  const initGame = useGameStore((s) => s.initGame);

  if (!challenge || !enrollment) {
    return (
      <View style={styles.container}>
        <RadialBackground />
        <View style={[styles.centered, { paddingTop: insets.top + 80 }]}>
          <Text style={styles.error}>Programme ou inscription introuvable.</Text>
          <GameButton variant="blue" title="RETOUR" onPress={() => router.back()} style={{ marginTop: SPACING[4] }} />
        </View>
      </View>
    );
  }

  const level = challenge.levels.find((l) => l.number === enrollment.currentLevel);
  const subLevel = level?.subLevels.find((s) => s.number === enrollment.currentSubLevel);
  const xpInLevel = enrollment.xpByLevel[enrollment.currentLevel] ?? 0;
  const levelXpRequired = level?.xpRequired ?? 6000;
  const progressPct = getLevelProgress(xpInLevel, levelXpRequired);
  const sector = challenge.sectors.find((s) => s.id === enrollment.selectedSectorId);
  const edition = getEditionFromSector(enrollment.selectedSectorId, challenge.id);

  const handleLaunch = () => {
    const humanId = `player_${user?.id ?? 'guest'}_${Date.now()}`;
    const aiId = `ai_${Date.now()}`;
    const players = [
      { id: humanId, name: user?.displayName ?? 'Vous', color: 'green' as const, isAI: false },
      { id: aiId, name: 'IA', color: 'blue' as const, isAI: true },
    ];
    const context: ChallengeContext = {
      challengeId: challenge.id,
      enrollmentId: enrollment.id,
      levelNumber: enrollment.currentLevel,
      subLevelNumber: enrollment.currentSubLevel,
      sectorId: enrollment.selectedSectorId,
    };
    initGame('solo', edition, players, context);
    const gameId = useGameStore.getState().game?.id;
    if (gameId) router.replace(`/(game)/play/${gameId}`);
  };

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.headerRow, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{challenge.name}</Text>
          <Text style={styles.headerSubtitle}>Partie Challenge</Text>
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.content}>
        <DynamicGradientBorder borderRadius={16} fill="rgba(0,0,0,0.35)" style={styles.card}>
          <View style={styles.cardInner}>
            <View style={styles.cardTop}>
              <View style={[styles.logoBox, { backgroundColor: challenge.primaryColor }]}>
                <Ionicons name="trophy-outline" size={28} color="#1E325A" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{challenge.name}</Text>
                <Text style={styles.cardOrg}>{challenge.organization}</Text>
                <Text style={styles.cardLevel}>
                  Niveau {enrollment.currentLevel} • {subLevel?.name ?? `Sous-niveau ${enrollment.currentSubLevel}`}
                </Text>
                {sector && (
                  <Text style={styles.cardSector}>{sector.name}</Text>
                )}
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.xpText}>
              {xpInLevel.toLocaleString('fr-FR')} / {levelXpRequired.toLocaleString('fr-FR')} XP
            </Text>
          </View>
        </DynamicGradientBorder>

        <View style={styles.configBox}>
          <Text style={styles.configTitle}>Configuration</Text>
          <View style={styles.configRow}>
            <View style={[styles.playerDot, { backgroundColor: COLORS.players.green }]} />
            <Text style={styles.configText}>Vous (Vert) vs IA (Bleu)</Text>
          </View>
          <Text style={styles.configHint}>Mode Solo • Édition {edition}</Text>
        </View>

        {subLevel?.cardCategories && (
          <View style={styles.typesBox}>
            <Text style={styles.typesTitle}>Types de cartes de ce sous-niveau</Text>
            <View style={styles.typesRow}>
              {subLevel.cardCategories.map((c) => (
                <Text key={c} style={styles.typeChip}>{c}</Text>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.xpInfo}>
          Les XP gagnés seront comptabilisés dans ta progression du programme.
        </Text>

        <GameButton
          variant="yellow"
          title="LANCER LA PARTIE"
          onPress={handleLaunch}
          fullWidth
          style={styles.launchBtn}
        />
      </Animated.View>
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
  headerTitles: { flex: 1 },
  headerTitle: { fontFamily: FONTS.title, fontSize: 20, color: '#FFF' },
  headerSubtitle: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  error: { fontFamily: FONTS.body, fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  content: { paddingHorizontal: 18, paddingTop: SPACING[4], paddingBottom: 120 },
  card: { marginBottom: SPACING[4] },
  cardInner: { padding: SPACING[4] },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING[3] },
  logoBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: SPACING[3] },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: FONTS.title, fontSize: FONT_SIZES.xl, color: COLORS.text },
  cardOrg: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  cardLevel: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.sm, color: COLORS.primary, marginTop: 4 },
  cardSector: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: SPACING[1] },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  xpText: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  configBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: SPACING[3],
    marginBottom: SPACING[4],
  },
  configTitle: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.base, color: COLORS.text, marginBottom: SPACING[2] },
  configRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2] },
  playerDot: { width: 12, height: 12, borderRadius: 6 },
  configText: { fontFamily: FONTS.body, fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  configHint: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 4 },
  typesBox: { marginBottom: SPACING[4] },
  typesTitle: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginBottom: SPACING[2] },
  typesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpInfo: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginBottom: SPACING[4],
  },
  launchBtn: { marginBottom: SPACING[8] },
});
