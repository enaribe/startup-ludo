/**
 * Challenge Hub - Écran central de progression du Challenge
 *
 * Affiche:
 * - Progression actuelle (niveau, sous-niveau, XP)
 * - Liste des niveaux et sous-niveaux avec leur état
 * - Secteur choisi (si applicable)
 * - Livrables complétés
 * - Bouton pour lancer une partie Challenge
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BusinessPlanModal,
    EnrollmentFormModal,
    FinalQuizModal,
    PitchBuilderModal,
    SectorChoiceModal,
} from '@/components/challenges';
import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { useChallengeStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ChallengeLevel, ChallengeSubLevel, EnrollmentFormData } from '@/types/challenge';
import {
    getLevelProgress,
    isLevelUnlocked,
    isSubLevelUnlocked,
} from '@/types/challenge';

// ===== COMPOSANTS INTERNES =====

interface LevelItemProps {
  level: ChallengeLevel;
  index: number;
  isCurrentLevel: boolean;
  isUnlocked: boolean;
  isCompleted: boolean;
  currentSubLevel: number;
  xpInLevel: number;
  onPress: () => void;
}

const LevelItem = memo(function LevelItem({
  level,
  index,
  isCurrentLevel,
  isUnlocked,
  isCompleted,
  currentSubLevel,
  xpInLevel,
  onPress,
}: LevelItemProps) {
  const [expanded, setExpanded] = useState(isCurrentLevel);

  const statusIcon = isCompleted
    ? 'checkmark-circle'
    : isCurrentLevel
    ? 'radio-button-on'
    : isUnlocked
    ? 'ellipse-outline'
    : 'lock-closed';

  const statusColor = isCompleted
    ? COLORS.success
    : isCurrentLevel
    ? COLORS.primary
    : isUnlocked
    ? COLORS.textSecondary
    : COLORS.textMuted;

  const progressPercent = isCurrentLevel
    ? getLevelProgress(xpInLevel, level.xpRequired)
    : isCompleted
    ? 100
    : 0;

  const enterDelay = 200 + index * 140;

  return (
    <Animated.View entering={FadeInDown.delay(enterDelay).duration(450).springify()}>
      <Pressable
        onPress={() => {
          setExpanded(!expanded);
          if (isCurrentLevel) onPress();
        }}
        style={[
          styles.levelItem,
          isCurrentLevel && styles.levelItemCurrent,
          !isUnlocked && !isCompleted && styles.levelItemLocked,
        ]}
      >
        {/* Header du niveau */}
        <View style={styles.levelHeader}>
          <Animated.View
            entering={ZoomIn.delay(enterDelay + 150).duration(400)}
            style={styles.levelIconContainer}
          >
            <Ionicons name={statusIcon} size={24} color={statusColor} />
          </Animated.View>
          <View style={styles.levelInfo}>
            <Text
              style={[
                styles.levelTitle,
                !isUnlocked && !isCompleted && styles.levelTitleLocked,
              ]}
            >
              Niveau {level.number} - {level.name}
            </Text>
            <Text style={styles.levelPosture}>{level.posture}</Text>
          </View>
          <Animated.View
            entering={FadeIn.delay(enterDelay + 200).duration(400)}
            style={styles.levelXpBadge}
          >
            <Text style={styles.levelXpText}>
              {isCompleted ? level.xpRequired : xpInLevel} / {level.xpRequired} XP
            </Text>
          </Animated.View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
          />
        </View>

        {/* Barre de progression */}
        {(isCurrentLevel || isCompleted) && (
          <Animated.View
            entering={FadeIn.delay(enterDelay + 250).duration(500)}
            style={styles.levelProgressBar}
          >
            <View
              style={[styles.levelProgressFill, { width: `${progressPercent}%` }]}
            />
          </Animated.View>
        )}

        {/* Sous-niveaux (expandable) */}
        {expanded && (
          <View style={styles.subLevelsContainer}>
            {/* Description du niveau pour les niveaux non débloqués */}
            {!isUnlocked && !isCompleted && (
              <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.levelPreviewBanner}>
                <Ionicons name="lock-closed" size={14} color={COLORS.textMuted} />
                <Text style={styles.levelPreviewText}>
                  Complétez le niveau précédent pour débloquer
                </Text>
              </Animated.View>
            )}
            {level.description ? (
              <Animated.View entering={FadeInDown.delay(150).duration(300)}>
                <Text style={styles.levelDescription}>{level.description}</Text>
              </Animated.View>
            ) : null}
            {level.subLevels.map((subLevel, subIndex) => (
              <SubLevelItem
                key={subLevel.id}
                subLevel={subLevel}
                levelNumber={level.number}
                isCurrentLevel={isCurrentLevel}
                currentSubLevel={currentSubLevel}
                xpInLevel={xpInLevel}
                index={subIndex}
              />
            ))}
            {/* Livrable attendu */}
            <Animated.View entering={FadeInDown.delay(200 + level.subLevels.length * 80).duration(350).springify()} style={styles.levelDeliverableHint}>
              <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
              <Text style={styles.levelDeliverableText}>
                Livrable : {level.deliverableType === 'sector_choice' ? 'Choix du secteur'
                  : level.deliverableType === 'pitch' ? 'Fiche Pitch'
                  : level.deliverableType === 'business_plan_simple' ? 'Business Plan Simplifié'
                  : level.deliverableType === 'business_plan_full' ? 'Business Plan Complet + Certificat'
                  : level.deliverableType}
              </Text>
            </Animated.View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

interface SubLevelItemProps {
  subLevel: ChallengeSubLevel;
  levelNumber: number;
  isCurrentLevel: boolean;
  currentSubLevel: number;
  xpInLevel: number;
  index: number;
}

const SubLevelItem = memo(function SubLevelItem({
  subLevel,
  levelNumber,
  isCurrentLevel,
  currentSubLevel,
  xpInLevel,
  index,
}: SubLevelItemProps) {
  const isCurrent = isCurrentLevel && subLevel.number === currentSubLevel;
  const isCompleted = isCurrentLevel
    ? xpInLevel >= subLevel.xpRequired
    : subLevel.number < currentSubLevel;
  const isUnlocked = isSubLevelUnlocked(
    levelNumber,
    subLevel.number,
    levelNumber,
    currentSubLevel,
    subLevel.rules.sequentialRequired
  );

  const statusIcon = isCompleted
    ? 'checkmark-circle'
    : isCurrent
    ? 'radio-button-on'
    : isUnlocked
    ? 'ellipse-outline'
    : 'ellipse-outline';

  const statusColor = isCompleted
    ? COLORS.success
    : isCurrent
    ? COLORS.primary
    : COLORS.textMuted;

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 80).duration(350).springify()}
      style={styles.subLevelItem}
    >
      <View style={styles.subLevelConnector} />
      <Animated.View entering={ZoomIn.delay(200 + index * 80).duration(300)}>
        <Ionicons name={statusIcon} size={16} color={statusColor} />
      </Animated.View>
      <View style={styles.subLevelContent}>
        <Text
          style={[
            styles.subLevelText,
            isCompleted && styles.subLevelTextCompleted,
            isCurrent && styles.subLevelTextCurrent,
          ]}
        >
          {subLevel.number}. {subLevel.name}
        </Text>
        <Text style={styles.subLevelXp}>
          {subLevel.xpRequired.toLocaleString()} XP
        </Text>
      </View>
      {isCurrent && (
        <Animated.View entering={ZoomIn.delay(300 + index * 80).duration(300)} style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>EN COURS</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
});

// ===== ÉCRAN PRINCIPAL =====

export default function ChallengeHubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId?: string }>();
  const insets = useSafeAreaInsets();

  // Challenge store
  const challenges = useChallengeStore((state) => state.challenges);
  const activeChallengeId = useChallengeStore((state) => state.activeChallengeId);
  const enrollments = useChallengeStore((state) => state.enrollments);
  const selectSector = useChallengeStore((state) => state.selectSector);
  const submitEnrollmentForm = useChallengeStore((state) => state.submitEnrollmentForm);

  // Déterminer le Challenge à afficher
  const challengeId = params.challengeId || activeChallengeId;
  const challenge = useMemo(
    () => challenges.find((c) => c.id === challengeId),
    [challenges, challengeId]
  );
  const enrollment = useMemo(
    () => enrollments.find((e) => e.challengeId === challengeId),
    [enrollments, challengeId]
  );

  // États pour les modals
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showBPModal, setShowBPModal] = useState(false);
  const [showBPType, setShowBPType] = useState<'simple' | 'full'>('simple');
  const [showFinalQuizModal, setShowFinalQuizModal] = useState(false);
  const [pitchModalMode, setPitchModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [bpModalMode, setBpModalMode] = useState<'create' | 'view' | 'edit'>('create');

  // Données dérivées
  const currentLevel = useMemo(() => {
    if (!challenge || !enrollment) return null;
    return challenge.levels.find((l) => l.number === enrollment.currentLevel);
  }, [challenge, enrollment]);

  const currentSubLevel = useMemo(() => {
    if (!currentLevel || !enrollment) return null;
    return currentLevel.subLevels.find(
      (sl) => sl.number === enrollment.currentSubLevel
    );
  }, [currentLevel, enrollment]);

  const selectedSector = useMemo(() => {
    if (!challenge || !enrollment?.selectedSectorId) return null;
    return challenge.sectors.find((s) => s.id === enrollment.selectedSectorId);
  }, [challenge, enrollment?.selectedSectorId]);

  const levelXp = enrollment?.xpByLevel[enrollment.currentLevel] || 0;
  const progressPercent = currentLevel
    ? getLevelProgress(levelXp, currentLevel.xpRequired)
    : 0;

  // === Éligibilité des livrables ===
  // Chaque livrable nécessite d'avoir complété TOUS les sous-niveaux du niveau correspondant
  // (= être passé au niveau suivant via checkAndUnlockNextLevel)

  // Secteur: débloqué quand niveau 1 complété (currentLevel >= 2)
  const isSectorUnlocked = useMemo(() => {
    if (!enrollment) return false;
    return enrollment.currentLevel >= 2;
  }, [enrollment]);

  const shouldShowSectorChoice = useMemo(() => {
    return isSectorUnlocked && !enrollment?.selectedSectorId && !enrollment?.deliverables.sectorChoice;
  }, [isSectorUnlocked, enrollment]);

  // Pitch: débloqué quand niveau 2 complété (currentLevel >= 3)
  const isPitchUnlocked = useMemo(() => {
    if (!enrollment) return false;
    return enrollment.currentLevel >= 3;
  }, [enrollment]);

  const canShowPitch = useMemo(() => {
    return isPitchUnlocked && !enrollment?.deliverables.pitch;
  }, [isPitchUnlocked, enrollment]);

  // BP Simple: débloqué quand niveau 3 complété (currentLevel >= 4)
  const isBPSimpleUnlocked = useMemo(() => {
    if (!enrollment) return false;
    return enrollment.currentLevel >= 4;
  }, [enrollment]);

  const canShowBPSimple = useMemo(() => {
    return isBPSimpleUnlocked && !enrollment?.deliverables.businessPlanSimple;
  }, [isBPSimpleUnlocked, enrollment]);

  // BP Full: débloqué quand niveau 4 XP atteint + BP Simple fait
  const isBPFullUnlocked = useMemo(() => {
    if (!enrollment || !challenge) return false;
    const level4Xp = enrollment.xpByLevel[4] || 0;
    const level4Required = challenge.levels.find((l) => l.number === 4)?.xpRequired || 40000;
    return level4Xp >= level4Required && !!enrollment.deliverables.businessPlanSimple;
  }, [enrollment, challenge]);

  const canShowBPFull = useMemo(() => {
    return isBPFullUnlocked && !enrollment?.deliverables.businessPlanFull;
  }, [isBPFullUnlocked, enrollment]);

  // Données existantes pour les modals de BP
  const existingDataForBP = useMemo(() => {
    if (!enrollment) return undefined;
    return {
      sectorName: selectedSector?.name,
      pitch: enrollment.deliverables.pitch,
      businessPlanSimple: enrollment.deliverables.businessPlanSimple,
    };
  }, [enrollment, selectedSector]);

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePlay = useCallback(() => {
    if (shouldShowSectorChoice) {
      setShowSectorModal(true);
    } else {
      // Naviguer vers le jeu Challenge
      router.push({
        pathname: '/(game)/challenge-game',
        params: { challengeId },
      });
    }
  }, [router, challengeId, shouldShowSectorChoice]);

  const handleSelectSector = useCallback(
    (sectorId: string) => {
      if (enrollment) {
        selectSector(enrollment.id, sectorId);
        setShowSectorModal(false);
        // Après sélection, lancer le jeu
        router.push({
          pathname: '/(game)/challenge-game',
          params: { challengeId },
        });
      }
    },
    [enrollment, selectSector, router, challengeId]
  );

  const handleLevelPress = useCallback(() => {
    // Pour l'instant, juste un feedback visuel
  }, []);

  // Handlers pour les livrables
  const handleDeliverablePress = useCallback((type: 'sector_choice' | 'pitch' | 'business_plan_simple' | 'business_plan_full') => {
    if (!enrollment) return;
    switch (type) {
      case 'sector_choice':
        if (!isSectorUnlocked) return; // Niveau 1 pas encore complété
        if (!enrollment.deliverables.sectorChoice) {
          setShowSectorModal(true);
        }
        break;
      case 'pitch':
        if (!isPitchUnlocked) return; // Niveau 2 pas encore complété
        if (enrollment.deliverables.pitch) {
          setPitchModalMode('view');
          setShowPitchModal(true);
        } else {
          setPitchModalMode('create');
          setShowPitchModal(true);
        }
        break;
      case 'business_plan_simple':
        if (!isBPSimpleUnlocked) return; // Niveau 3 pas encore complété
        if (enrollment.deliverables.businessPlanSimple) {
          setBpModalMode('view');
          setShowBPType('simple');
          setShowBPModal(true);
        } else {
          setBpModalMode('create');
          setShowBPType('simple');
          setShowBPModal(true);
        }
        break;
      case 'business_plan_full':
        if (!isBPFullUnlocked) return; // Niveau 4 pas complété ou BP Simple manquant
        if (enrollment.deliverables.businessPlanFull) {
          setBpModalMode('view');
          setShowBPType('full');
          setShowBPModal(true);
        } else {
          setShowFinalQuizModal(true);
        }
        break;
    }
  }, [enrollment, isSectorUnlocked, isPitchUnlocked, isBPSimpleUnlocked, isBPFullUnlocked]);

  const handlePitchComplete = useCallback(() => {
    setShowPitchModal(false);
  }, []);

  const handleBPComplete = useCallback(() => {
    setShowBPModal(false);
  }, []);

  const handleFinalQuizComplete = useCallback((_champion: import('@/types/challenge').ChampionStatus) => {
    setShowFinalQuizModal(false);
  }, []);

  // Si pas de Challenge ou d'inscription, afficher un message
  if (!challenge || !enrollment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Challenge non trouvé</Text>
          <View style={{ marginTop: SPACING[4] }}>
            <GameButton title="Retour" variant="blue" onPress={handleBack} />
          </View>
        </View>
      </View>
    );
  }

  // Formulaire d'inscription obligatoire : bloquer l'accès aux niveaux tant qu'il n'est pas rempli
  const handleEnrollmentFormSubmit = useCallback(
    (formData: EnrollmentFormData) => {
      submitEnrollmentForm(enrollment.id, formData);
    },
    [enrollment.id, submitEnrollmentForm]
  );

  if (enrollment.formData == null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <EnrollmentFormModal
          visible
          challengeName={challenge.name}
          onSubmit={handleEnrollmentFormSubmit}
          onClose={handleBack}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header avec bouton retour + info */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}
      >
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Animated.Text
          entering={FadeIn.delay(200).duration(400)}
          style={styles.headerTitle}
        >
          {challenge.name}
        </Animated.Text>
        <Pressable
          onPress={() => router.push({
            pathname: '/(challenges)/[challengeId]',
            params: { challengeId: challenge.id },
          })}
          style={styles.infoButton}
        >
          <Ionicons name="information-circle-outline" size={24} color={COLORS.white} />
        </Pressable>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte de progression principale */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
          <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.progressCard}>
              {/* Niveau actuel */}
              <View style={styles.currentLevelRow}>
                <Animated.View
                  entering={ZoomIn.delay(300).duration(500)}
                  style={styles.levelIconLarge}
                >
                  <Ionicons
                    name={
                      (currentLevel?.iconName as keyof typeof Ionicons.glyphMap) ||
                      'star-outline'
                    }
                    size={32}
                    color={COLORS.primary}
                  />
                </Animated.View>
                <View style={styles.currentLevelInfo}>
                  <Text style={styles.currentLevelLabel}>
                    Niveau {enrollment.currentLevel}
                  </Text>
                  <Text style={styles.currentLevelName}>{currentLevel?.name}</Text>
                </View>
                <Animated.View entering={ZoomIn.delay(400).duration(400)} style={styles.xpBadgeLarge}>
                  <Text style={styles.xpValue}>{enrollment.totalXp.toLocaleString()}</Text>
                  <Text style={styles.xpLabel}>XP Total</Text>
                </Animated.View>
              </View>

              {/* Barre de progression niveau */}
              <View style={styles.mainProgressContainer}>
                <View style={styles.mainProgressBar}>
                  <View
                    style={[styles.mainProgressFill, { width: `${progressPercent}%` }]}
                  />
                </View>
                <Text style={styles.mainProgressText}>
                  {levelXp.toLocaleString()} / {currentLevel?.xpRequired.toLocaleString()} XP
                </Text>
              </View>

              {/* Sous-niveau actuel */}
              {currentSubLevel && (
                <View style={styles.currentSubLevelRow}>
                  <Ionicons
                    name="navigate-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.currentSubLevelText}>
                    {enrollment.currentSubLevel}.{' '}
                    {currentSubLevel.name}
                  </Text>
                </View>
              )}

              {/* Secteur choisi */}
              {selectedSector && (
                <View
                  style={[
                    styles.sectorBadge,
                    { backgroundColor: selectedSector.color + '20' },
                  ]}
                >
                  <Ionicons
                    name={
                      (selectedSector.iconName as keyof typeof Ionicons.glyphMap) ||
                      'leaf-outline'
                    }
                    size={20}
                    color={selectedSector.color}
                  />
                  <Text style={[styles.sectorText, { color: selectedSector.color }]}>
                    {selectedSector.name}
                  </Text>
                </View>
              )}
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Section Progression détaillée */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PROGRESSION</Text>
        </Animated.View>

        {/* Liste des niveaux */}
        <View style={styles.levelsContainer}>
          {challenge.levels.map((level, levelIndex) => {
            const levelIsUnlocked = isLevelUnlocked(
              level.number,
              enrollment.currentLevel,
              enrollment.xpByLevel,
              challenge.levels
            );
            const levelIsCompleted =
              level.number < enrollment.currentLevel ||
              (level.number === enrollment.currentLevel &&
                levelXp >= level.xpRequired &&
                enrollment.currentSubLevel >= level.subLevels.length);
            const levelIsCurrent = level.number === enrollment.currentLevel;

            return (
              <LevelItem
                key={level.id}
                level={level}
                index={levelIndex}
                isCurrentLevel={levelIsCurrent}
                isUnlocked={levelIsUnlocked}
                isCompleted={levelIsCompleted}
                currentSubLevel={enrollment.currentSubLevel}
                xpInLevel={enrollment.xpByLevel[level.number] || 0}
                onPress={handleLevelPress}
              />
            );
          })}
        </View>

        {/* Section Livrables */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LIVRABLES</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(450).springify()}>
          <DynamicGradientBorder borderRadius={12} fill="rgba(0, 0, 0, 0.25)">
            <View style={styles.deliverablesContainer}>
              {/* Choix secteur — verrouillé tant que Niveau 1 pas complété */}
              <Animated.View entering={FadeInDown.delay(800).duration(300)}>
                <Pressable
                  style={[styles.deliverableItem, !isSectorUnlocked && styles.deliverableItemLocked]}
                  onPress={() => handleDeliverablePress('sector_choice')}
                  disabled={!isSectorUnlocked}
                >
                  <Animated.View entering={ZoomIn.delay(900).duration(300)}>
                    <Ionicons
                      name={
                        enrollment.deliverables.sectorChoice
                          ? 'checkmark-circle'
                          : !isSectorUnlocked
                          ? 'lock-closed'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={
                        enrollment.deliverables.sectorChoice
                          ? COLORS.success
                          : COLORS.textMuted
                      }
                    />
                  </Animated.View>
                  <Text style={[styles.deliverableText, !isSectorUnlocked && styles.deliverableTextLocked]}>
                    Choix secteur:{' '}
                    {selectedSector ? selectedSector.name : 'Non choisi'}
                  </Text>
                  {!isSectorUnlocked ? (
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedBadgeText}>NIVEAU 1</Text>
                    </View>
                  ) : shouldShowSectorChoice ? (
                    <Animated.View entering={ZoomIn.delay(1000).duration(300)} style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NOUVEAU</Text>
                    </Animated.View>
                  ) : null}
                </Pressable>
              </Animated.View>

              {/* Pitch — verrouillé tant que Niveau 2 pas complété */}
              <Animated.View entering={FadeInDown.delay(880).duration(300)}>
                <Pressable
                  style={[styles.deliverableItem, !isPitchUnlocked && styles.deliverableItemLocked]}
                  onPress={() => handleDeliverablePress('pitch')}
                  disabled={!isPitchUnlocked}
                >
                  <Animated.View entering={ZoomIn.delay(980).duration(300)}>
                    <Ionicons
                      name={
                        enrollment.deliverables.pitch
                          ? 'checkmark-circle'
                          : !isPitchUnlocked
                          ? 'lock-closed'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={
                        enrollment.deliverables.pitch
                          ? COLORS.success
                          : COLORS.textMuted
                      }
                    />
                  </Animated.View>
                  <Text style={[styles.deliverableText, !isPitchUnlocked && styles.deliverableTextLocked]}>
                    Pitch:{' '}
                    {enrollment.deliverables.pitch ? 'Complété' : 'Non commencé'}
                  </Text>
                  {!isPitchUnlocked ? (
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedBadgeText}>NIVEAU 2</Text>
                    </View>
                  ) : enrollment.deliverables.pitch ? (
                    <Animated.View entering={ZoomIn.delay(1050).duration(300)} style={styles.viewBadge}>
                      <Ionicons name="eye-outline" size={12} color={COLORS.primary} />
                      <Text style={styles.viewBadgeText}>VOIR</Text>
                    </Animated.View>
                  ) : canShowPitch ? (
                    <Animated.View entering={ZoomIn.delay(1050).duration(300)} style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NOUVEAU</Text>
                    </Animated.View>
                  ) : null}
                </Pressable>
              </Animated.View>

              {/* Business Plan Simple — verrouillé tant que Niveau 3 pas complété */}
              <Animated.View entering={FadeInDown.delay(960).duration(300)}>
                <Pressable
                  style={[styles.deliverableItem, !isBPSimpleUnlocked && styles.deliverableItemLocked]}
                  onPress={() => handleDeliverablePress('business_plan_simple')}
                  disabled={!isBPSimpleUnlocked}
                >
                  <Animated.View entering={ZoomIn.delay(1060).duration(300)}>
                    <Ionicons
                      name={
                        enrollment.deliverables.businessPlanSimple
                          ? 'checkmark-circle'
                          : !isBPSimpleUnlocked
                          ? 'lock-closed'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={
                        enrollment.deliverables.businessPlanSimple
                          ? COLORS.success
                          : COLORS.textMuted
                      }
                    />
                  </Animated.View>
                  <Text style={[styles.deliverableText, !isBPSimpleUnlocked && styles.deliverableTextLocked]}>
                    Business Plan Simplifié:{' '}
                    {enrollment.deliverables.businessPlanSimple
                      ? 'Complété'
                      : 'Non commencé'}
                  </Text>
                  {!isBPSimpleUnlocked ? (
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedBadgeText}>NIVEAU 3</Text>
                    </View>
                  ) : enrollment.deliverables.businessPlanSimple ? (
                    <Animated.View entering={ZoomIn.delay(1130).duration(300)} style={styles.viewBadge}>
                      <Ionicons name="eye-outline" size={12} color={COLORS.primary} />
                      <Text style={styles.viewBadgeText}>VOIR</Text>
                    </Animated.View>
                  ) : canShowBPSimple ? (
                    <Animated.View entering={ZoomIn.delay(1130).duration(300)} style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NOUVEAU</Text>
                    </Animated.View>
                  ) : null}
                </Pressable>
              </Animated.View>

              {/* Business Plan Complet — verrouillé tant que Niveau 4 XP pas atteint + BP Simple manquant */}
              <Animated.View entering={FadeInDown.delay(1040).duration(300)}>
                <Pressable
                  style={[styles.deliverableItem, !isBPFullUnlocked && styles.deliverableItemLocked]}
                  onPress={() => handleDeliverablePress('business_plan_full')}
                  disabled={!isBPFullUnlocked}
                >
                  <Animated.View entering={ZoomIn.delay(1140).duration(300)}>
                    <Ionicons
                      name={
                        enrollment.deliverables.businessPlanFull
                          ? 'checkmark-circle'
                          : !isBPFullUnlocked
                          ? 'lock-closed'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={
                        enrollment.deliverables.businessPlanFull
                          ? COLORS.success
                          : COLORS.textMuted
                      }
                    />
                  </Animated.View>
                  <Text style={[styles.deliverableText, !isBPFullUnlocked && styles.deliverableTextLocked]}>
                    Business Plan Complet:{' '}
                    {enrollment.deliverables.businessPlanFull
                      ? 'Complété'
                      : 'Non commencé'}
                  </Text>
                  {!isBPFullUnlocked ? (
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedBadgeText}>NIVEAU 4</Text>
                    </View>
                  ) : enrollment.deliverables.businessPlanFull ? (
                    <Animated.View entering={ZoomIn.delay(1210).duration(300)} style={styles.viewBadge}>
                      <Ionicons name="eye-outline" size={12} color={COLORS.primary} />
                      <Text style={styles.viewBadgeText}>VOIR</Text>
                    </Animated.View>
                  ) : canShowBPFull ? (
                    <Animated.View entering={ZoomIn.delay(1210).duration(300)} style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NOUVEAU</Text>
                    </Animated.View>
                  ) : null}
                </Pressable>
              </Animated.View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Espace pour le bouton fixe — augmenté pour voir la section livrables */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bouton Jouer fixe en bas — GameButton jaune avec gradient */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(500).springify()}
        style={[styles.playButtonContainer, { paddingBottom: insets.bottom + SPACING[4] }]}
      >
        <GameButton
          title="Jouer"
          variant="yellow"
          fullWidth
          onPress={handlePlay}
        />
        <Text style={styles.playModeText}>
          Mode: Solo (Challenge - {currentSubLevel?.name || 'N/A'})
        </Text>
      </Animated.View>

      {/* Modal de choix de secteur */}
      {challenge && (
        <SectorChoiceModal
          visible={showSectorModal}
          sectors={challenge.sectors}
          onSelect={handleSelectSector}
          onClose={() => setShowSectorModal(false)}
        />
      )}

      {/* Modal Pitch Builder */}
      {enrollment && challengeId && (
        <PitchBuilderModal
          visible={showPitchModal}
          enrollmentId={enrollment.id}
          challengeId={challengeId}
          sectorName={selectedSector?.name}
          mode={pitchModalMode}
          initialData={enrollment.deliverables.pitch}
          onComplete={handlePitchComplete}
          onClose={() => setShowPitchModal(false)}
        />
      )}

      {/* Modal Business Plan */}
      {enrollment && challengeId && (
        <BusinessPlanModal
          visible={showBPModal}
          enrollmentId={enrollment.id}
          challengeId={challengeId}
          type={showBPType}
          mode={bpModalMode}
          initialBPData={showBPType === 'simple' ? enrollment.deliverables.businessPlanSimple : enrollment.deliverables.businessPlanFull}
          existingData={existingDataForBP}
          onComplete={handleBPComplete}
          onClose={() => setShowBPModal(false)}
        />
      )}

      {/* Modal Quiz Final + Certificat */}
      {enrollment && challengeId && (
        <FinalQuizModal
          visible={showFinalQuizModal}
          enrollmentId={enrollment.id}
          challengeId={challengeId}
          existingData={{
            sectorName: selectedSector?.name || '',
            pitch: enrollment.deliverables.pitch,
            businessPlanSimple: enrollment.deliverables.businessPlanSimple,
          }}
          onComplete={handleFinalQuizComplete}
          onClose={() => setShowFinalQuizModal(false)}
        />
      )}
    </View>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
    textAlign: 'center',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
  },

  // Carte de progression principale
  progressCard: {
    padding: SPACING[4],
  },
  currentLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  levelIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLevelInfo: {
    flex: 1,
    marginLeft: SPACING[3],
  },
  currentLevelLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  currentLevelName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  xpBadgeLarge: {
    alignItems: 'flex-end',
  },
  xpValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  xpLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  mainProgressContainer: {
    marginBottom: SPACING[3],
  },
  mainProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING[1],
  },
  mainProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  mainProgressText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  currentSubLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  currentSubLevelText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: BORDER_RADIUS.lg,
  },
  sectorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
  },

  // Sections
  sectionHeader: {
    marginTop: SPACING[6],
    marginBottom: SPACING[3],
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },

  // Niveaux
  levelsContainer: {
    gap: SPACING[2],
  },
  levelItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[3],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelItemCurrent: {
    borderColor: COLORS.primary + '40',
    backgroundColor: 'rgba(255, 188, 64, 0.08)',
  },
  levelItemLocked: {
    opacity: 0.7,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIconContainer: {
    marginRight: SPACING[3],
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },
  levelTitleLocked: {
    color: COLORS.textMuted,
  },
  levelPosture: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  levelXpBadge: {
    marginRight: SPACING[2],
  },
  levelXpText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  levelProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING[3],
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },

  // Sous-niveaux
  subLevelsContainer: {
    marginTop: SPACING[3],
    paddingLeft: SPACING[6],
  },
  subLevelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
    position: 'relative',
  },
  subLevelConnector: {
    position: 'absolute',
    left: -SPACING[4],
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  subLevelContent: {
    flex: 1,
  },
  subLevelText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  subLevelXp: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  subLevelTextCompleted: {
    color: COLORS.success,
  },
  subLevelTextCurrent: {
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  currentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  currentBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
  },

  levelPreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[2],
  },
  levelPreviewText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  levelDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[3],
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  levelDeliverableHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[2],
    paddingTop: SPACING[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  levelDeliverableText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },

  // Livrables
  deliverablesContainer: {
    padding: SPACING[3],
  },
  deliverableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[2],
  },
  deliverableItemLocked: {
    opacity: 0.45,
  },
  deliverableText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  deliverableTextLocked: {
    color: COLORS.textMuted,
  },
  lockedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  lockedBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  newBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  newBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: COLORS.background,
    letterSpacing: 0.5,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.3)',
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  viewBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  // Bouton Jouer
  playButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(12, 36, 62, 0.95)',
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  playModeText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING[2],
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[6],
  },
  errorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    marginTop: SPACING[4],
  },
});
