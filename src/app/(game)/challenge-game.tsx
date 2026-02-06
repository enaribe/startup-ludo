/**
 * Challenge Game Setup - Configuration simplifiée pour le mode Challenge
 *
 * Différences avec le jeu normal:
 * - Mode solo uniquement (contre IA)
 * - Configuration automatique (pas de choix de joueurs/couleurs)
 * - Cartes adaptées au niveau/sous-niveau du Challenge
 * - Maisons adaptées au secteur choisi
 * - XP comptabilisé vers le Challenge
 */

import { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { useChallengeStore, useGameStore, useAuthStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';
import { getLevelProgress } from '@/types/challenge';

export default function ChallengeGameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId?: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  // Challenge store
  const challenges = useChallengeStore((state) => state.challenges);
  const activeChallengeId = useChallengeStore((state) => state.activeChallengeId);
  const enrollments = useChallengeStore((state) => state.enrollments);

  // Game store
  const initGame = useGameStore((state) => state.initGame);

  // Déterminer le Challenge
  const challengeId = params.challengeId || activeChallengeId;
  const challenge = useMemo(
    () => challenges.find((c) => c.id === challengeId),
    [challenges, challengeId]
  );
  const enrollment = useMemo(
    () => enrollments.find((e) => e.challengeId === challengeId),
    [enrollments, challengeId]
  );

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

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleStartGame = useCallback(() => {
    if (!challenge || !enrollment) return;

    const edition = 'classic';

    // Configuration automatique: joueur vs IA
    // Utiliser l'UID Firebase pour que l'écran de résultats identifie le gagnant
    const playerId = user?.id || 'player_0';
    const gamePlayers = [
      {
        id: playerId,
        name: user?.displayName || 'Vous',
        color: 'green' as const,
        isAI: false,
        isHost: true,
        isConnected: true,
      },
      {
        id: 'ai_challenge',
        name: 'IA Challenge',
        color: 'blue' as const,
        isAI: true,
        isHost: false,
        isConnected: true,
      },
    ];

    // Initialiser la partie avec contexte Challenge
    initGame('solo', edition, gamePlayers, {
      challengeId: challenge.id,
      enrollmentId: enrollment.id,
      levelNumber: enrollment.currentLevel,
      subLevelNumber: enrollment.currentSubLevel,
      sectorId: selectedSector?.id || null,
    });

    // Naviguer vers le plateau (utiliser un ID de partie unique)
    const gameId = `challenge_${Date.now()}`;
    router.push(`/(game)/play/${gameId}`);
  }, [challenge, enrollment, selectedSector, user?.id, user?.displayName, initGame, router]);

  // Si pas de Challenge ou d'inscription, retour
  if (!challenge || !enrollment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Challenge non trouvé</Text>
          <Pressable style={styles.errorButton} onPress={handleBack}>
            <Text style={styles.errorButtonText}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>PARTIE CHALLENGE</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Carte Challenge Info */}
        <Animated.View entering={FadeIn.duration(400)}>
          <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.challengeCard}>
              {/* Header Challenge */}
              <View style={styles.challengeHeader}>
                <View style={styles.challengeLogo}>
                  <Ionicons name="school-outline" size={28} color={challenge.primaryColor} />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeName}>{challenge.name}</Text>
                  <Text style={styles.challengeOrg}>{challenge.organization}</Text>
                </View>
              </View>

              {/* Niveau actuel */}
              <View style={styles.levelRow}>
                <Ionicons
                  name={(currentLevel?.iconName as keyof typeof Ionicons.glyphMap) || 'star-outline'}
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.levelText}>
                  Niveau {enrollment.currentLevel} - {currentLevel?.name}
                </Text>
              </View>

              {/* Sous-niveau actuel */}
              {currentSubLevel && (
                <View style={styles.subLevelRow}>
                  <Ionicons name="navigate-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.subLevelText}>
                    {enrollment.currentSubLevel}. {currentSubLevel.name}
                  </Text>
                </View>
              )}

              {/* Barre de progression */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {levelXp.toLocaleString()} / {currentLevel?.xpRequired.toLocaleString()} XP
                </Text>
              </View>

              {/* Secteur */}
              {selectedSector && (
                <View style={[styles.sectorBadge, { backgroundColor: selectedSector.color + '20' }]}>
                  <Ionicons
                    name={(selectedSector.iconName as keyof typeof Ionicons.glyphMap) || 'leaf-outline'}
                    size={18}
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

        {/* Configuration automatique */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.configSection}>
          <Text style={styles.sectionTitle}>CONFIGURATION</Text>

          <DynamicGradientBorder borderRadius={12} fill="rgba(0, 0, 0, 0.25)">
            <View style={styles.configCard}>
              {/* Mode */}
              <View style={styles.configRow}>
                <View style={styles.configIconBox}>
                  <Ionicons name="game-controller" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.configInfo}>
                  <Text style={styles.configLabel}>Mode</Text>
                  <Text style={styles.configValue}>Solo vs IA</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>

              {/* Joueur */}
              <View style={styles.configRow}>
                <View style={[styles.configIconBox, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                  <Ionicons name="person" size={20} color="#4CAF50" />
                </View>
                <View style={styles.configInfo}>
                  <Text style={styles.configLabel}>Joueur</Text>
                  <Text style={styles.configValue}>{user?.displayName || 'Vous'}</Text>
                </View>
                <View style={[styles.colorDot, { backgroundColor: '#4CAF50' }]} />
              </View>

              {/* IA */}
              <View style={styles.configRow}>
                <View style={[styles.configIconBox, { backgroundColor: 'rgba(31, 145, 208, 0.15)' }]}>
                  <Ionicons name="hardware-chip" size={20} color="#1F91D0" />
                </View>
                <View style={styles.configInfo}>
                  <Text style={styles.configLabel}>Adversaire</Text>
                  <Text style={styles.configValue}>IA Challenge</Text>
                </View>
                <View style={[styles.colorDot, { backgroundColor: '#1F91D0' }]} />
              </View>

              {/* Cartes */}
              {currentSubLevel && (
                <View style={styles.configRow}>
                  <View style={[styles.configIconBox, { backgroundColor: 'rgba(255, 188, 64, 0.15)' }]}>
                    <Ionicons name="layers" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.configInfo}>
                    <Text style={styles.configLabel}>Types de cartes</Text>
                    <Text style={styles.configValue}>
                      {currentSubLevel.cardCategories.join(', ')}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Info XP */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.xpInfoBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.xpInfoText}>
              Les XP gagnés seront comptabilisés dans ta progression Challenge
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Bouton fixe en bas */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
        <GameButton
          variant="yellow"
          fullWidth
          title="LANCER LA PARTIE"
          onPress={handleStartGame}
        />
      </View>
    </View>
  );
}

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
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
  },

  // Challenge Card
  challengeCard: {
    padding: SPACING[4],
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  challengeLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeInfo: {
    flex: 1,
    marginLeft: SPACING[3],
  },
  challengeName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  challengeOrg: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[2],
  },
  levelText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
  },
  subLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  subLevelText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    marginBottom: SPACING[3],
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING[1],
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
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

  // Config Section
  configSection: {
    marginTop: SPACING[5],
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING[3],
  },
  configCard: {
    padding: SPACING[3],
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[2],
  },
  configIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  configInfo: {
    flex: 1,
  },
  configLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  configValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  // XP Info
  xpInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[3],
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING[4],
  },
  xpInfoText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
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
  errorButton: {
    marginTop: SPACING[4],
    paddingHorizontal: SPACING[6],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
  },
  errorButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.background,
  },
});
