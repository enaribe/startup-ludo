/**
 * Challenge Game Setup - Écran de préparation avant une partie Challenge
 *
 * Design cohérent avec local-setup.tsx (RadialBackground, DynamicGradientBorder)
 */

import { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { GameButton, RadialBackground, DynamicGradientBorder } from '@/components/ui';
import { useChallengeStore, useGameStore, useAuthStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';
import { getLevelProgress } from '@/types/challenge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - 36;

// Couleurs des joueurs (même que local-setup)
const PLAYER_COLORS = {
  green: '#4CAF50',
  blue: '#1F91D0',
};

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

      {/* Header fixe (même style que local-setup) */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </Pressable>
          <Text style={styles.headerTitle}>PARTIE CHALLENGE</Text>
        </View>
      </View>

      {/* Contenu scrollable */}
      <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
        {/* Section: Niveau actuel */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.sectionTitle}>NIVEAU ACTUEL</Text>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)" boxWidth={CONTENT_WIDTH}>
            <View style={styles.levelCard}>
              {/* Badge niveau */}
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeNumber}>{enrollment.currentLevel}</Text>
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelName}>{currentLevel?.name}</Text>
                {currentSubLevel && (
                  <Text style={styles.subLevelName}>
                    {enrollment.currentSubLevel}. {currentSubLevel.name}
                  </Text>
                )}
                {/* Barre de progression */}
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
                    size={16}
                    color={selectedSector.color}
                  />
                </View>
              )}
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Section: Configuration de la partie */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.configSection}>
          <Text style={styles.sectionTitle}>CONFIGURATION</Text>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)" boxWidth={CONTENT_WIDTH}>
            <View style={styles.configContent}>
              {/* Joueur */}
              <View style={styles.playerRow}>
                <View style={[styles.playerAvatar, { borderColor: PLAYER_COLORS.green }]}>
                  <Ionicons name="person" size={18} color={PLAYER_COLORS.green} />
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{user?.displayName || 'Vous'}</Text>
                  <Text style={styles.playerType}>Joueur Humain</Text>
                </View>
                <View style={[styles.colorDot, { backgroundColor: PLAYER_COLORS.green }]} />
              </View>

              {/* VS Divider */}
              <View style={styles.vsDivider}>
                <View style={styles.vsLine} />
                <Text style={styles.vsText}>VS</Text>
                <View style={styles.vsLine} />
              </View>

              {/* IA */}
              <View style={styles.playerRow}>
                <View style={[styles.playerAvatar, { borderColor: PLAYER_COLORS.blue }]}>
                  <Ionicons name="hardware-chip" size={18} color={PLAYER_COLORS.blue} />
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>IA Challenge</Text>
                  <Text style={styles.playerType}>Intelligence Artificielle</Text>
                </View>
                <View style={[styles.colorDot, { backgroundColor: PLAYER_COLORS.blue }]} />
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Types de cartes */}
        {currentSubLevel && currentSubLevel.cardCategories.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>TYPES DE CARTES</Text>
            <View style={styles.categoriesRow}>
              {currentSubLevel.cardCategories.map((cat, i) => (
                <View key={i} style={styles.categoryChip}>
                  <Ionicons name="layers-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.categoryText}>{cat}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Info XP */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <View style={styles.xpInfoBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.xpInfoText}>
              Les XP gagnés seront comptabilisés dans ta progression Challenge
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Bouton fixe en bas */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
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

  // Header (même style que local-setup)
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    fontSize: 22,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 100,
  },

  // Section Title
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.5,
    marginBottom: 14,
    marginTop: 24,
    textTransform: 'uppercase',
  },

  // Level Card
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  levelBadgeNumber: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.background,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
  },
  subLevelName: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  sectorBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Config Section
  configSection: {
    marginTop: 0,
  },
  configContent: {
    padding: 14,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.white,
  },
  playerType: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  vsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  vsText: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: COLORS.textMuted,
    marginHorizontal: 16,
  },

  // Categories
  categoriesSection: {
    marginTop: 0,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.primary,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
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
