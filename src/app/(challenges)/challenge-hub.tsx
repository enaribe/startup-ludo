/**
 * Challenge Hub - Écran central de progression du Challenge
 *
 * Design style Candy Crush avec:
 * - Carte de progression avec chemin sinueux
 * - Nœuds de niveaux interactifs
 * - Fond gradient coloré
 * - Livrables et bouton jouer en overlay
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GalleryNode } from '@/components/challenges';
import {
    BusinessPlanModal,
    ChallengeGalleryMap,
    EnrollmentFormModal,
    FinalQuizModal,
    PitchBuilderModal,
    SectorChoiceModal,
} from '@/components/challenges';
import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { useChallengeStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { EnrollmentFormData } from '@/types/challenge';
import { getLevelProgress } from '@/types/challenge';

// ===== COMPOSANT POPUP INFO NIVEAU =====

interface LevelInfoPopupProps {
  visible: boolean;
  node: GalleryNode | null;
  onClose: () => void;
  onPlay: () => void;
}

const LevelInfoPopup = memo(function LevelInfoPopup({
  visible,
  node,
  onClose,
  onPlay,
}: LevelInfoPopupProps) {
  if (!visible || !node) return null;

  const progressPercent = node.xpRequired > 0
    ? Math.min(100, Math.round((node.xpCurrent / node.xpRequired) * 100))
    : 0;

  const getStatusText = () => {
    if (node.isCompleted) return 'Complété';
    if (node.isCurrent) return 'En cours';
    if (node.isUnlocked) return 'Débloqué';
    return 'Verrouillé';
  };

  const getStatusColor = () => {
    if (node.isCompleted) return COLORS.success;
    if (node.isCurrent) return COLORS.primary;
    if (node.isUnlocked) return COLORS.info;
    return COLORS.textMuted;
  };

  const canPlay = (node.isUnlocked || node.isCurrent) && !node.isCompleted;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.levelPopupBackdrop} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.levelPopupWrapper}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <DynamicGradientBorder borderRadius={24} fill="rgba(10, 25, 41, 0.98)">
              <View style={styles.levelPopupContainer}>
                {/* Header avec numéro */}
                <View style={styles.levelPopupHeader}>
                  <View style={[styles.levelPopupNumber, { backgroundColor: getStatusColor() }]}>
                    {node.isCompleted ? (
                      <Ionicons name="checkmark" size={24} color={COLORS.white} />
                    ) : (
                      <Text style={styles.levelPopupNumberText}>{node.levelNumber}</Text>
                    )}
                  </View>
                  <Pressable onPress={onClose} style={styles.levelPopupCloseBtn}>
                    <Ionicons name="close" size={24} color={COLORS.textMuted} />
                  </Pressable>
                </View>

                {/* Nom et description */}
                <Text style={styles.levelPopupTitle}>{node.name}</Text>
                {node.description && (
                  <Text style={styles.levelPopupDescription}>{node.description}</Text>
                )}

                {/* Posture */}
                {node.posture && (
                  <View style={styles.levelPopupPosture}>
                    <Ionicons name="person-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.levelPopupPostureText}>{node.posture}</Text>
                  </View>
                )}

                {/* Status */}
                <View style={[styles.levelPopupStatusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                  <Text style={[styles.levelPopupStatusText, { color: getStatusColor() }]}>
                    {getStatusText()}
                  </Text>
                </View>

                {/* Progression XP */}
                {canPlay && (
                  <View style={styles.levelPopupProgress}>
                    <View style={styles.levelPopupProgressHeader}>
                      <Text style={styles.levelPopupProgressLabel}>Progression</Text>
                      <Text style={styles.levelPopupProgressValue}>{progressPercent}%</Text>
                    </View>
                    <View style={styles.levelPopupProgressBar}>
                      <View style={[styles.levelPopupProgressFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.levelPopupXpText}>
                      {node.xpCurrent.toLocaleString()} / {node.xpRequired.toLocaleString()} XP
                    </Text>
                  </View>
                )}

                {/* Bouton Jouer avec GameButton */}
                {canPlay && (
                  <View style={styles.levelPopupActions}>
                    <GameButton
                      title="JOUER CE NIVEAU"
                      variant="yellow"
                      fullWidth
                      onPress={onPlay}
                    />
                  </View>
                )}

                {/* Message verrouillé */}
                {!node.isUnlocked && !node.isCompleted && (
                  <View style={styles.levelPopupLocked}>
                    <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
                    <Text style={styles.levelPopupLockedText}>
                      Complétez les niveaux précédents pour débloquer
                    </Text>
                  </View>
                )}

                {/* Bouton Fermer */}
                <View style={styles.levelPopupActions}>
                  <GameButton
                    title="Fermer"
                    variant="blue"
                    fullWidth
                    onPress={onClose}
                  />
                </View>
              </View>
            </DynamicGradientBorder>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
});

// ===== COMPOSANT PANNEAU LIVRABLES =====

interface DeliverablesPanelProps {
  visible: boolean;
  onClose: () => void;
  enrollment: {
    deliverables: {
      sectorChoice?: { sectorId: string; completedAt: number };
      pitch?: { problem: string; solution: string; target: string; viability: string; impact: string; generatedDocument: string; completedAt: number };
      businessPlanSimple?: { content: Record<string, string>; generatedDocument: string; completedAt: number };
      businessPlanFull?: { content: Record<string, string>; generatedDocument: string; completedAt: number };
    };
  } | null;
  selectedSector: { name: string; color: string } | null;
  isSectorUnlocked: boolean;
  isPitchUnlocked: boolean;
  isBPSimpleUnlocked: boolean;
  isBPFullUnlocked: boolean;
  shouldShowSectorChoice: boolean;
  canShowPitch: boolean;
  canShowBPSimple: boolean;
  canShowBPFull: boolean;
  onDeliverablePress: (type: 'sector_choice' | 'pitch' | 'business_plan_simple' | 'business_plan_full') => void;
}

const DeliverablesPanel = memo(function DeliverablesPanel({
  visible,
  onClose,
  enrollment,
  selectedSector,
  isSectorUnlocked,
  isPitchUnlocked,
  isBPSimpleUnlocked,
  isBPFullUnlocked,
  shouldShowSectorChoice,
  canShowPitch,
  canShowBPSimple,
  canShowBPFull,
  onDeliverablePress,
}: DeliverablesPanelProps) {
  if (!visible || !enrollment) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.deliverablesPanelBackdrop}>
        <Pressable style={styles.deliverablesPanelDismiss} onPress={onClose} />
        <Animated.View
          entering={SlideInUp.duration(300)}
          style={styles.deliverablesPanelContainer}
        >
          <View style={styles.deliverablesPanelHandle} />
          <Text style={styles.deliverablesPanelTitle}>LIVRABLES</Text>

          <ScrollView style={styles.deliverablesPanelScroll} showsVerticalScrollIndicator={false}>
            {/* Choix secteur */}
            <Pressable
              style={[styles.deliverablePanelItem, !isSectorUnlocked && styles.deliverablePanelItemLocked]}
              onPress={() => onDeliverablePress('sector_choice')}
              disabled={!isSectorUnlocked}
            >
              <View style={[styles.deliverablePanelIcon, { backgroundColor: enrollment.deliverables.sectorChoice ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)' }]}>
                <Ionicons
                  name={enrollment.deliverables.sectorChoice ? 'checkmark-circle' : !isSectorUnlocked ? 'lock-closed' : 'ellipse-outline'}
                  size={24}
                  color={enrollment.deliverables.sectorChoice ? COLORS.success : COLORS.textMuted}
                />
              </View>
              <View style={styles.deliverablePanelInfo}>
                <Text style={styles.deliverablePanelName}>Choix du secteur</Text>
                <Text style={styles.deliverablePanelStatus}>
                  {selectedSector ? selectedSector.name : !isSectorUnlocked ? 'Déblocage: Niveau 1' : 'Non choisi'}
                </Text>
              </View>
              {shouldShowSectorChoice && <View style={styles.newDot} />}
            </Pressable>

            {/* Pitch */}
            <Pressable
              style={[styles.deliverablePanelItem, !isPitchUnlocked && styles.deliverablePanelItemLocked]}
              onPress={() => onDeliverablePress('pitch')}
              disabled={!isPitchUnlocked}
            >
              <View style={[styles.deliverablePanelIcon, { backgroundColor: enrollment.deliverables.pitch ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)' }]}>
                <Ionicons
                  name={enrollment.deliverables.pitch ? 'checkmark-circle' : !isPitchUnlocked ? 'lock-closed' : 'ellipse-outline'}
                  size={24}
                  color={enrollment.deliverables.pitch ? COLORS.success : COLORS.textMuted}
                />
              </View>
              <View style={styles.deliverablePanelInfo}>
                <Text style={styles.deliverablePanelName}>Fiche Pitch</Text>
                <Text style={styles.deliverablePanelStatus}>
                  {enrollment.deliverables.pitch ? 'Complété' : !isPitchUnlocked ? 'Déblocage: Niveau 2' : 'Non commencé'}
                </Text>
              </View>
              {canShowPitch && <View style={styles.newDot} />}
            </Pressable>

            {/* BP Simple */}
            <Pressable
              style={[styles.deliverablePanelItem, !isBPSimpleUnlocked && styles.deliverablePanelItemLocked]}
              onPress={() => onDeliverablePress('business_plan_simple')}
              disabled={!isBPSimpleUnlocked}
            >
              <View style={[styles.deliverablePanelIcon, { backgroundColor: enrollment.deliverables.businessPlanSimple ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)' }]}>
                <Ionicons
                  name={enrollment.deliverables.businessPlanSimple ? 'checkmark-circle' : !isBPSimpleUnlocked ? 'lock-closed' : 'ellipse-outline'}
                  size={24}
                  color={enrollment.deliverables.businessPlanSimple ? COLORS.success : COLORS.textMuted}
                />
              </View>
              <View style={styles.deliverablePanelInfo}>
                <Text style={styles.deliverablePanelName}>Business Plan Simplifié</Text>
                <Text style={styles.deliverablePanelStatus}>
                  {enrollment.deliverables.businessPlanSimple ? 'Complété' : !isBPSimpleUnlocked ? 'Déblocage: Niveau 3' : 'Non commencé'}
                </Text>
              </View>
              {canShowBPSimple && <View style={styles.newDot} />}
            </Pressable>

            {/* BP Full */}
            <Pressable
              style={[styles.deliverablePanelItem, !isBPFullUnlocked && styles.deliverablePanelItemLocked]}
              onPress={() => onDeliverablePress('business_plan_full')}
              disabled={!isBPFullUnlocked}
            >
              <View style={[styles.deliverablePanelIcon, { backgroundColor: enrollment.deliverables.businessPlanFull ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)' }]}>
                <Ionicons
                  name={enrollment.deliverables.businessPlanFull ? 'checkmark-circle' : !isBPFullUnlocked ? 'lock-closed' : 'ellipse-outline'}
                  size={24}
                  color={enrollment.deliverables.businessPlanFull ? COLORS.success : COLORS.textMuted}
                />
              </View>
              <View style={styles.deliverablePanelInfo}>
                <Text style={styles.deliverablePanelName}>Business Plan Complet</Text>
                <Text style={styles.deliverablePanelStatus}>
                  {enrollment.deliverables.businessPlanFull ? 'Complété + Certificat' : !isBPFullUnlocked ? 'Déblocage: Niveau 4' : 'Non commencé'}
                </Text>
              </View>
              {canShowBPFull && <View style={styles.newDot} />}
            </Pressable>
          </ScrollView>

          <View style={styles.deliverablesPanelCloseBtn}>
            <GameButton
              title="Fermer"
              variant="blue"
              fullWidth
              onPress={onClose}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
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
  const [showDeliverablesPanel, setShowDeliverablesPanel] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GalleryNode | null>(null);

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
  // progressPercent utilisé dans le futur si besoin
  const _progressPercent = currentLevel
    ? getLevelProgress(levelXp, currentLevel.xpRequired)
    : 0;
  void _progressPercent; // Éviter l'erreur TS unused

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

  const handleLevelPress = useCallback((node: GalleryNode) => {
    setSelectedNode(node);
  }, []);

  const handlePlayFromPopup = useCallback(() => {
    setSelectedNode(null);
    if (shouldShowSectorChoice) {
      setShowSectorModal(true);
    } else {
      router.push({
        pathname: '/(game)/challenge-game',
        params: { challengeId },
      });
    }
  }, [router, challengeId, shouldShowSectorChoice]);

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

  const handlePitchComplete = useCallback((_pitch: {
    problem: string;
    solution: string;
    target: string;
    viability: string;
    impact: string;
    generatedDocument: string;
  }) => {
    setShowPitchModal(false);
    // TODO: Sauvegarder le pitch dans l'enrollment via le store
  }, []);

  const handleBPComplete = useCallback((_bp: {
    content: Record<string, string>;
    generatedDocument: string;
    certificate?: string;
  }) => {
    setShowBPModal(false);
    // TODO: Sauvegarder le BP dans l'enrollment via le store
  }, []);

  const handleFinalQuizPass = useCallback((_certificate: string) => {
    setShowFinalQuizModal(false);
    // TODO: Sauvegarder le certificat dans l'enrollment via le store
  }, []);

  // Formulaire d'inscription obligatoire (hook doit être avant les returns conditionnels)
  const handleEnrollmentFormSubmit = useCallback(
    (formData: EnrollmentFormData) => {
      if (enrollment) {
        submitEnrollmentForm(enrollment.id, formData);
      }
    },
    [enrollment?.id, submitEnrollmentForm]
  );

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

  // Calculs pour le résumé de progression
  const totalLevels = challenge.levels.length;
  const completedLevels = enrollment.currentLevel - 1;
  const overallProgress = Math.round((completedLevels / totalLevels) * 100);

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe */}
      <View style={[styles.headerFixed, { paddingTop: insets.top + SPACING[2] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{challenge.name}</Text>
          <Pressable
            onPress={() => router.push({
              pathname: '/(challenges)/[challengeId]',
              params: { challengeId: challenge.id },
            })}
            style={styles.headerBtn}
          >
            <Ionicons name="information-circle-outline" size={22} color={COLORS.white} />
          </Pressable>
        </View>

        {/* Panneau de résumé de progression */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.progressSummary}>
          <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.progressSummaryContent}>
              {/* Niveau actuel */}
              <View style={styles.progressSummaryMain}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeNumber}>{enrollment.currentLevel}</Text>
                </View>
                <View style={styles.progressSummaryInfo}>
                  <Text style={styles.progressSummaryLevel}>Niveau {enrollment.currentLevel}</Text>
                  <Text style={styles.progressSummarySublevel}>{currentSubLevel?.name || currentLevel?.name}</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.progressSummaryStats}>
                <View style={styles.progressSummaryStat}>
                  <Text style={styles.progressStatValue}>{enrollment.totalXp.toLocaleString()}</Text>
                  <Text style={styles.progressStatLabel}>XP Total</Text>
                </View>
                <View style={styles.progressStatDivider} />
                <View style={styles.progressSummaryStat}>
                  <Text style={styles.progressStatValue}>{overallProgress}%</Text>
                  <Text style={styles.progressStatLabel}>Progression</Text>
                </View>
                {selectedSector && (
                  <>
                    <View style={styles.progressStatDivider} />
                    <View style={styles.progressSummaryStat}>
                      <View style={[styles.sectorDot, { backgroundColor: selectedSector.color }]} />
                      <Text style={styles.progressStatLabel}>{selectedSector.name}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </View>

      {/* Carte de progression style Galerie */}
      <View style={[styles.mapContainer, { paddingTop: insets.top + 190 }]}>
        <ChallengeGalleryMap
          levels={challenge.levels}
          currentLevel={enrollment.currentLevel}
          currentSubLevel={enrollment.currentSubLevel}
          xpByLevel={enrollment.xpByLevel}
          totalXp={enrollment.totalXp}
          onNodePress={handleLevelPress}
        />
      </View>

      {/* Barre d'actions en bas */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(500).springify()}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[3] }]}
      >
        <View style={styles.bottomBarContent}>
          {/* Bouton Livrables */}
          <Pressable
            style={styles.deliverablesBtn}
            onPress={() => setShowDeliverablesPanel(true)}
          >
            <Ionicons name="document-text" size={20} color={COLORS.white} />
            <Text style={styles.deliverablesBtnText}>Livrables</Text>
            {(shouldShowSectorChoice || canShowPitch || canShowBPSimple || canShowBPFull) && (
              <View style={styles.deliverablesBtnBadge}>
                <Text style={styles.deliverablesBtnBadgeText}>!</Text>
              </View>
            )}
          </Pressable>

          {/* Bouton Jouer */}
          <View style={styles.playBtnContainer}>
            <GameButton
              title="JOUER"
              variant="yellow"
              fullWidth
              onPress={handlePlay}
            />
          </View>
        </View>
        <Text style={styles.playModeText}>
          {currentSubLevel?.name || 'Niveau ' + enrollment.currentLevel}
        </Text>
      </Animated.View>

      {/* Popup Info Niveau */}
      <LevelInfoPopup
        visible={!!selectedNode}
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onPlay={handlePlayFromPopup}
      />

      {/* Panel Livrables */}
      <DeliverablesPanel
        visible={showDeliverablesPanel}
        onClose={() => setShowDeliverablesPanel(false)}
        enrollment={enrollment}
        selectedSector={selectedSector ? { name: selectedSector.name, color: selectedSector.color } : null}
        isSectorUnlocked={isSectorUnlocked}
        isPitchUnlocked={isPitchUnlocked}
        isBPSimpleUnlocked={isBPSimpleUnlocked}
        isBPFullUnlocked={isBPFullUnlocked}
        shouldShowSectorChoice={shouldShowSectorChoice}
        canShowPitch={canShowPitch}
        canShowBPSimple={canShowBPSimple}
        canShowBPFull={canShowBPFull}
        onDeliverablePress={(type) => {
          setShowDeliverablesPanel(false);
          handleDeliverablePress(type);
        }}
      />

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
          sectorName={selectedSector?.name}
          mode={pitchModalMode}
          initialData={enrollment.deliverables.pitch}
          onValidate={handlePitchComplete}
          onClose={() => setShowPitchModal(false)}
        />
      )}

      {/* Modal Business Plan */}
      {enrollment && challengeId && (
        <BusinessPlanModal
          visible={showBPModal}
          type={showBPType}
          mode={bpModalMode}
          initialData={showBPType === 'simple' ? enrollment.deliverables.businessPlanSimple?.content : enrollment.deliverables.businessPlanFull?.content}
          sectorName={selectedSector?.name}
          pitchData={enrollment.deliverables.pitch}
          bpSimpleData={enrollment.deliverables.businessPlanSimple?.content}
          onValidate={handleBPComplete}
          onClose={() => setShowBPModal(false)}
        />
      )}

      {/* Modal Quiz Final + Certificat */}
      {enrollment && challenge && (
        <FinalQuizModal
          visible={showFinalQuizModal}
          enrollment={enrollment}
          challenge={challenge}
          onPass={handleFinalQuizPass}
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

  // Header fixe avec résumé
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  headerBtn: {
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
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
  },

  // Résumé de progression
  progressSummary: {
    marginTop: SPACING[3],
  },
  progressSummaryContent: {
    padding: SPACING[3],
  },
  progressSummaryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  levelBadgeNumber: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.background,
  },
  progressSummaryInfo: {
    flex: 1,
  },
  progressSummaryLevel: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },
  progressSummarySublevel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressSummaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: SPACING[2],
  },
  progressSummaryStat: {
    alignItems: 'center',
    gap: 2,
  },
  progressStatValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
  },
  progressStatLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  progressStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Container de la carte
  mapContainer: {
    flex: 1,
  },

  // Barre d'actions en bas
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(12, 36, 62, 0.95)',
    paddingHorizontal: SPACING[3],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  deliverablesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  deliverablesBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  deliverablesBtnBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliverablesBtnBadgeText: {
    fontFamily: FONTS.title,
    fontSize: 11,
    color: COLORS.white,
  },
  playBtnContainer: {
    flex: 1,
  },
  playModeText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING[2],
  },

  // Panel Livrables
  deliverablesPanelBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  deliverablesPanelDismiss: {
    flex: 1,
  },
  deliverablesPanelContainer: {
    backgroundColor: '#0A1929',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
    paddingBottom: SPACING[6],
    maxHeight: '70%',
  },
  deliverablesPanelHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING[4],
  },
  deliverablesPanelTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING[4],
  },
  deliverablesPanelScroll: {
    maxHeight: 320,
  },
  deliverablePanelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: SPACING[3],
    borderRadius: 16,
    marginBottom: SPACING[2],
  },
  deliverablePanelItemLocked: {
    opacity: 0.5,
  },
  deliverablePanelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliverablePanelInfo: {
    flex: 1,
  },
  deliverablePanelName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },
  deliverablePanelStatus: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  newDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  deliverablesPanelCloseBtn: {
    marginTop: SPACING[3],
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

  // Popup Info Niveau
  levelPopupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  levelPopupWrapper: {
    width: '100%',
    maxWidth: 340,
  },
  levelPopupContainer: {
    padding: SPACING[5],
  },
  levelPopupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[4],
  },
  levelPopupNumber: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelPopupNumberText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  levelPopupCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelPopupTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    marginBottom: SPACING[2],
  },
  levelPopupDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING[3],
  },
  levelPopupPosture: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: 12,
    marginBottom: SPACING[3],
    alignSelf: 'flex-start',
  },
  levelPopupPostureText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  levelPopupStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
    marginBottom: SPACING[4],
  },
  levelPopupStatusText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
  },
  levelPopupProgress: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: SPACING[3],
    marginBottom: SPACING[4],
  },
  levelPopupProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING[2],
  },
  levelPopupProgressLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  levelPopupProgressValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  levelPopupProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING[2],
  },
  levelPopupProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  levelPopupXpText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  levelPopupCategories: {
    marginBottom: SPACING[4],
  },
  levelPopupCategoriesLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
  },
  levelPopupCategoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  levelPopupCategoryChip: {
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
  },
  levelPopupCategoryText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  levelPopupActions: {
    marginTop: SPACING[3],
  },
  levelPopupLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: 12,
  },
  levelPopupLockedText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    flex: 1,
  },
});
