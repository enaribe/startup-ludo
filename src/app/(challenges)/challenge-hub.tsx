/**
 * Hub principal du programme Challenge - Hero, niveaux, livrables, bouton JOUER
 */

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import {
  SectorChoiceModal,
  PitchBuilderModal,
  BusinessPlanModal,
  FinalQuizModal,
} from '@/components/challenges';
import { useChallengeStore } from '@/stores';
import { getLevelProgress, getChallengeProgress } from '@/types/challenge';
import type { PitchData } from '@/components/challenges/PitchBuilderModal';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { COLORS } from '@/styles/colors';

export default function ChallengeHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const challenge = useChallengeStore((s) => s.getActiveChallenge());
  const enrollment = useChallengeStore((s) => s.getActiveEnrollment());
  const selectSector = useChallengeStore((s) => s.selectSector);
  const savePitch = useChallengeStore((s) => s.savePitch);
  const saveBusinessPlan = useChallengeStore((s) => s.saveBusinessPlan);
  const setChampionStatus = useChallengeStore((s) => s.setChampionStatus);

  const [sectorModalVisible, setSectorModalVisible] = useState(false);
  const [pitchModalVisible, setPitchModalVisible] = useState(false);
  const [bpModalVisible, setBpModalVisible] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);

  if (!challenge || !enrollment) {
    return (
      <View style={styles.container}>
        <RadialBackground />
        <View style={[styles.centered, { paddingTop: insets.top + 100 }]}>
          <Text style={styles.noProgram}>Aucun programme actif.</Text>
          <GameButton
            variant="blue"
            title="MES PROGRAMMES"
            onPress={() => router.replace('/(challenges)/my-programs')}
            style={{ marginTop: SPACING[4] }}
          />
        </View>
      </View>
    );
  }

  const level = challenge.levels.find((l) => l.number === enrollment.currentLevel);
  const subLevel = level?.subLevels.find((s) => s.number === enrollment.currentSubLevel);
  const xpInLevel = enrollment.xpByLevel[enrollment.currentLevel] ?? 0;
  const levelXpRequired = level?.xpRequired ?? 6000;
  const progressPct = getLevelProgress(xpInLevel, levelXpRequired);
  const totalProgressPct = getChallengeProgress(enrollment.totalXp, challenge.totalXpRequired);
  const selectedSector = challenge.sectors.find((s) => s.id === enrollment.selectedSectorId);

  const isSectorUnlocked = enrollment.currentLevel >= 2 || (enrollment.xpByLevel[1] ?? 0) >= 6000;
  const isPitchUnlocked = enrollment.currentLevel >= 3 || (enrollment.xpByLevel[2] ?? 0) >= 10000;
  const isBPSimpleUnlocked = enrollment.currentLevel >= 4 || (enrollment.xpByLevel[3] ?? 0) >= 20000;
  const isBPFullUnlocked =
    (enrollment.xpByLevel[4] ?? 0) >= 40000 && Boolean(enrollment.deliverables.businessPlanSimple);

  const handlePlay = () => {
    router.push(`/(game)/challenge-game?challengeId=${challenge.id}`);
  };

  const handleSectorSelect = (sectorId: string) => {
    selectSector(enrollment.id, sectorId);
    setSectorModalVisible(false);
  };

  const handlePitchValidate = (pitch: PitchData) => {
    savePitch(enrollment.id, pitch);
    setPitchModalVisible(false);
  };

  const handleBPValidate = (bp: { content: Record<string, string>; generatedDocument: string; certificate?: string }) => {
    saveBusinessPlan(
      enrollment.id,
      bp.certificate ? 'full' : 'simple',
      bp.content,
      bp.generatedDocument,
      bp.certificate
    );
    setBpModalVisible(false);
  };

  const handleQuizPass = (certificate: string) => {
    setChampionStatus(enrollment.id, 'local');
    saveBusinessPlan(enrollment.id, 'full', {}, '', certificate);
    setQuizModalVisible(false);
  };

  const deliverableItems = [
    {
      key: 'sector',
      label: 'Choix de secteur',
      icon: 'leaf-outline' as const,
      unlocked: isSectorUnlocked,
      completed: Boolean(enrollment.deliverables.sectorChoice),
      onPress: () => isSectorUnlocked && !enrollment.deliverables.sectorChoice && setSectorModalVisible(true),
      levelReq: 1,
    },
    {
      key: 'pitch',
      label: 'Pitch',
      icon: 'bulb-outline' as const,
      unlocked: isPitchUnlocked,
      completed: Boolean(enrollment.deliverables.pitch),
      onPress: () => isPitchUnlocked && setPitchModalVisible(true),
      levelReq: 2,
    },
    {
      key: 'bp_simple',
      label: 'BP Simple',
      icon: 'document-text-outline' as const,
      unlocked: isBPSimpleUnlocked,
      completed: Boolean(enrollment.deliverables.businessPlanSimple),
      onPress: () => isBPSimpleUnlocked && setBpModalVisible(true),
      levelReq: 3,
    },
    {
      key: 'bp_full',
      label: 'BP Complet + Certificat',
      icon: 'trophy-outline' as const,
      unlocked: isBPFullUnlocked,
      completed: Boolean(enrollment.deliverables.businessPlanFull),
      onPress: () => isBPFullUnlocked && !enrollment.deliverables.businessPlanFull && setQuizModalVisible(true),
      levelReq: 4,
    },
  ];

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.headerRow, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{challenge.name}</Text>
          <Text style={styles.headerSubtitle}>Hub</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: 12, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <DynamicGradientBorder borderRadius={16} fill="rgba(0,0,0,0.35)" style={styles.hero}>
            <View style={styles.heroInner}>
              <View style={styles.heroTop}>
                <Text style={styles.heroLevel}>Niveau {enrollment.currentLevel}</Text>
                {selectedSector && (
                  <Text style={styles.heroSector}>{selectedSector.name}</Text>
                )}
              </View>
              <Text style={styles.heroSubLevel}>{subLevel?.name ?? `Sous-niveau ${enrollment.currentSubLevel}`}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.heroXp}>
                {xpInLevel.toLocaleString('fr-FR')} / {levelXpRequired.toLocaleString('fr-FR')} XP
              </Text>
              <Text style={styles.heroTotal}>Progression totale : {totalProgressPct}%</Text>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        <Text style={styles.sectionTitle}>Livrables</Text>
        {deliverableItems.map((item, idx) => (
          <Animated.View key={item.key} entering={FadeInDown.delay(80 * idx).duration(300)}>
            <Pressable
              onPress={item.unlocked ? item.onPress : undefined}
              style={[styles.deliverableCard, !item.unlocked && styles.deliverableLocked]}
              disabled={!item.unlocked}
            >
              <View style={styles.deliverableLeft}>
                {item.unlocked ? (
                  <Ionicons name={item.icon} size={24} color={item.completed ? COLORS.success : COLORS.primary} />
                ) : (
                  <Ionicons name="lock-closed" size={24} color={COLORS.textMuted} />
                )}
                <View>
                  <Text style={[styles.deliverableLabel, !item.unlocked && styles.deliverableLabelLocked]}>
                    {item.label}
                  </Text>
                  {!item.unlocked && (
                    <Text style={styles.deliverableBadge}>Niveau {item.levelReq}</Text>
                  )}
                  {item.completed && (
                    <Text style={styles.deliverableDone}>Complété</Text>
                  )}
                </View>
              </View>
              {item.unlocked && !item.completed && (
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              )}
            </Pressable>
          </Animated.View>
        ))}

        <GameButton
          variant="yellow"
          title="JOUER"
          onPress={handlePlay}
          fullWidth
          style={styles.playBtn}
        />
      </ScrollView>

      <SectorChoiceModal
        visible={sectorModalVisible}
        sectors={challenge.sectors}
        onSelect={handleSectorSelect}
        onClose={() => setSectorModalVisible(false)}
        challengeName={challenge.name}
      />
      <PitchBuilderModal
        visible={pitchModalVisible}
        onClose={() => setPitchModalVisible(false)}
        onValidate={handlePitchValidate}
        initialData={enrollment.deliverables.pitch}
        mode={enrollment.deliverables.pitch ? 'view' : 'create'}
        sectorName={selectedSector?.name}
      />
      <BusinessPlanModal
        visible={bpModalVisible}
        onClose={() => setBpModalVisible(false)}
        onValidate={handleBPValidate}
        type={enrollment.deliverables.businessPlanSimple ? 'full' : 'simple'}
        initialData={
          enrollment.deliverables.businessPlanSimple?.content ??
          enrollment.deliverables.businessPlanFull?.content
        }
        mode="create"
        sectorName={selectedSector?.name}
        pitchData={enrollment.deliverables.pitch}
        bpSimpleData={enrollment.deliverables.businessPlanSimple?.content}
      />
      <FinalQuizModal
        visible={quizModalVisible}
        onClose={() => setQuizModalVisible(false)}
        onPass={handleQuizPass}
        enrollment={enrollment}
        challenge={challenge}
      />
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  noProgram: { fontFamily: FONTS.body, fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  scroll: { paddingHorizontal: 18 },
  hero: { marginBottom: SPACING[5] },
  heroInner: { padding: SPACING[4] },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2], marginBottom: 4 },
  heroLevel: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.sm, color: COLORS.primary },
  heroSector: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  heroSubLevel: { fontFamily: FONTS.title, fontSize: FONT_SIZES.lg, color: COLORS.text, marginBottom: SPACING[2] },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: SPACING[1] },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  heroXp: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  heroTotal: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  deliverableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: SPACING[3],
    marginBottom: SPACING[2],
  },
  deliverableLocked: { opacity: 0.45 },
  deliverableLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3] },
  deliverableLabel: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.base, color: COLORS.text },
  deliverableLabelLocked: { color: COLORS.textMuted },
  deliverableBadge: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  deliverableDone: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.success, marginTop: 2 },
  playBtn: { marginTop: SPACING[4], marginBottom: SPACING[8] },
});
