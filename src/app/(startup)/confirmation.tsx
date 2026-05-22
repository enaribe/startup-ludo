import { useEffect, useRef, useState } from 'react';
import { Pressable, View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { GamePopup } from '@/components/ui/GamePopup';
import { PortfolioIcon } from '@/components/icons';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { useUserStore, useSettingsStore, useAuthStore } from '@/stores';
import { addStartup as firestoreAddStartup, updateUserStats } from '@/services/firebase/firestore';
import { generateValuation, type ValuationFactor } from '@/services/ai';
import { formatFCFARaw } from '@/utils/currency';
import { TARGET_CARDS, MISSION_CARDS, SECTOR_CARDS } from '@/constants/ideation';
import { XP_REWARDS } from '@/config/progression';
import type { Startup, TargetCard, MissionCard } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Valorisation initiale en FCFA à la création du projet
const BASE_VALUATION = 10_000; // 10 000 FCFA de base (modulé par les multiplicateurs de cartes)

const SECTOR_INFO: Record<string, { name: string; icon: string }> = {
  fintech: { name: 'Fintech', icon: 'cash' },
  mobilite: { name: 'Mobilité', icon: 'bus' },
  proptech: { name: 'Proptech', icon: 'home' },
  'e-commerce': { name: 'E-commerce', icon: 'cart' },
  gaming: { name: 'Gaming', icon: 'game-controller' },
  greentech: { name: 'Greentech', icon: 'leaf' },
  foodtech: { name: 'Foodtech', icon: 'restaurant' },
  'entertainment-media': { name: 'Entertainment & Media', icon: 'film' },
  agritech: { name: 'AgriTech', icon: 'leaf' },
  cybersecurite: { name: 'Cybersécurité', icon: 'shield-checkmark' },
  'energie-renouvelable': { name: 'Énergie renouvelable', icon: 'flash' },
  'sport-fitness': { name: 'Sport & Fitness', icon: 'fitness' },
  tourisme: { name: 'Tourisme', icon: 'airplane' },
  'mobile-telecommunications': { name: 'Mobile & Télécom', icon: 'phone-portrait' },
  'logistique-supply-chain': { name: 'Logistique', icon: 'cube' },
  edtech: { name: 'EdTech', icon: 'school' },
  'cleantech-environnement': { name: 'CleanTech', icon: 'earth' },
};

function generateId(): string {
  return `startup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatValorisation(val: number): string {
  return formatFCFARaw(val);
}

export default function StartupConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const addStartup = useUserStore((state) => state.addStartup);
  const addXP = useUserStore((state) => state.addXP);
  const userId = useAuthStore((state) => state.user?.id);
  const userName = useAuthStore((state) => state.user?.displayName);
  const hasApplied = useRef(false);
  const hasRequestedValuation = useRef(false);
  const [showValuationInfo, setShowValuationInfo] = useState(false);
  const [isLoadingValuation, setIsLoadingValuation] = useState(true);
  const [aiValuation, setAiValuation] = useState<number | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiFactors, setAiFactors] = useState<ValuationFactor[] | null>(null);

  const params = useLocalSearchParams<{
    startupName?: string;
    startupDescription?: string;
    startupSector?: string;
    targetCardId?: string;
    targetCardTitle?: string;
    targetCardDesc?: string;
    missionCardId?: string;
    missionCardTitle?: string;
    missionCardDesc?: string;
  }>();

  const startupName = params.startupName || 'Nouvelle Entreprise';
  const startupDescription = params.startupDescription || '';
  const sectorId = params.startupSector || 'fintech';
  const sectorInfo = SECTOR_INFO[sectorId] ?? { name: 'Fintech', icon: 'cash' };
  const createdAt = Date.now();

  // Look up real card data from constants for multipliers
  const targetCardData = params.targetCardId
    ? TARGET_CARDS.find((c) => c.id === params.targetCardId)
    : undefined;
  const missionCardData = params.missionCardId
    ? MISSION_CARDS.find((c) => c.id === params.missionCardId)
    : undefined;
  const sectorCardData = SECTOR_CARDS.find((c) => c.id === sectorId);

  const targetMultiplier = targetCardData?.xpMultiplier ?? 1.0;
  const missionMultiplier = missionCardData?.xpMultiplier ?? 1.0;
  const sectorMultiplier = sectorCardData?.xpMultiplier ?? 1.0;

  // Fallback valorisation based on card multipliers (utilisée si l'IA échoue ou en attente)
  const fallbackValorisation = Math.round(
    BASE_VALUATION * targetMultiplier * missionMultiplier * sectorMultiplier
  );
  // Valorisation finale : IA si dispo, sinon fallback
  const valorisation = aiValuation ?? fallbackValorisation;

  // Real XP reward based on card multipliers
  const baseXP = XP_REWARDS.STARTUP_CREATED?.amount ?? 25;
  const xpReward = Math.round(
    baseXP * ((targetMultiplier + missionMultiplier + sectorMultiplier) / 3)
  );

  // Reconstruct cards from params (use real data if found)
  const targetCard: TargetCard | undefined = params.targetCardId
    ? {
        id: params.targetCardId,
        category: targetCardData?.category ?? 'demographic',
        title: targetCardData?.title ?? params.targetCardTitle ?? '',
        description: targetCardData?.description ?? params.targetCardDesc ?? '',
        rarity: targetCardData?.rarity ?? 'common',
        xpMultiplier: targetMultiplier,
      }
    : undefined;

  const missionCard: MissionCard | undefined = params.missionCardId
    ? {
        id: params.missionCardId,
        category: missionCardData?.category ?? 'efficiency',
        title: missionCardData?.title ?? params.missionCardTitle ?? '',
        description: missionCardData?.description ?? params.missionCardDesc ?? '',
        rarity: missionCardData?.rarity ?? 'common',
        xpMultiplier: missionMultiplier,
      }
    : undefined;

  // Appel IA pour générer la valorisation initiale (avec fallback automatique)
  useEffect(() => {
    if (hasRequestedValuation.current) return;
    hasRequestedValuation.current = true;

    const fetchValuation = async () => {
      try {
        const result = await generateValuation({
          target: params.targetCardTitle,
          mission: params.missionCardTitle,
          sector: sectorInfo.name,
          startupName,
          startupDescription,
        });
        if (result) {
          setAiValuation(result.valorisation);
          setAiExplanation(result.explanation);
          setAiFactors(result.factors);
        }
      } catch (err) {
        console.warn('[Confirmation] Valuation fetch failed:', err);
      } finally {
        setIsLoadingValuation(false);
      }
    };

    fetchValuation();
  }, [params.targetCardTitle, params.missionCardTitle, sectorInfo.name, startupName, startupDescription]);

  // Création de la startup une fois la valorisation finale connue
  useEffect(() => {
    if (hasApplied.current) return;
    if (isLoadingValuation) return;
    hasApplied.current = true;

    // Create and save the startup with real valorisation
    const newStartup: Startup = {
      id: generateId(),
      name: startupName,
      sector: sectorId,
      description: startupDescription,
      targetCard,
      missionCard,
      createdAt,
      tokensInvested: valorisation,
      valorisation,
      level: 1,
      creatorId: userId ?? undefined,
      creatorName: userName ?? undefined,
    };

    // Save locally (Zustand store)
    addStartup(newStartup);

    // Save to Firestore + sync XP (fire-and-forget, only if authenticated)
    if (userId) {
      firestoreAddStartup(userId, newStartup).catch((err) => {
        console.error('[Firestore] Failed to save startup:', err);
      });
      updateUserStats(userId, { xpGained: xpReward }).catch((err) => {
        console.error('[Firestore] Failed to sync XP:', err);
      });
    }

    // Award XP locally
    addXP(xpReward);

    // Celebration haptic
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingValuation]);

  const handlePlay = () => {
    router.replace('/(tabs)/home');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  const headerTopPadding = insets.top + 10;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>STARTUP CRÉÉE</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTopPadding + 60, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Startup info card */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.cardContent}>
              {/* Portfolio icon (same as tab bar) */}
              <View style={styles.iconBadge}>
                <PortfolioIcon color="#FFBC40" size={36} />
              </View>
              {/* Startup name */}
              <Text style={styles.startupName}>
                {startupName.toUpperCase()}
              </Text>

              {/* Description */}
              {startupDescription ? (
                <Text style={styles.startupDescription}>
                  {startupDescription}
                </Text>
              ) : null}

              {/* Divider */}
              <View style={styles.divider} />

              {/* Info rows */}
              {targetCard ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="people" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.infoLabelText}>Cible</Text>
                  </View>
                  <Text style={styles.infoValue}>{targetCard.title}</Text>
                </View>
              ) : null}

              {missionCard ? (
                <>
                  <View style={styles.infoSeparator} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabel}>
                      <Ionicons name="flag" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.infoLabelText}>Mission</Text>
                    </View>
                    <Text style={styles.infoValue}>{missionCard.title}</Text>
                  </View>
                </>
              ) : null}

              <View style={styles.infoSeparator} />
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons
                    name={sectorInfo.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.infoLabelText}>Secteur</Text>
                </View>
                <Text style={styles.infoValue}>{sectorInfo.name}</Text>
              </View>

              <View style={styles.infoSeparator} />
              <View style={styles.infoRow}>
                <Pressable
                  style={styles.infoLabel}
                  onPress={() => !isLoadingValuation && setShowValuationInfo(true)}
                  hitSlop={8}
                  disabled={isLoadingValuation}
                >
                  <Ionicons name="diamond" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.infoLabelText}>Valorisation initiale</Text>
                  {!isLoadingValuation && (
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color="#FFBC40"
                      style={{ marginLeft: 2 }}
                    />
                  )}
                </Pressable>
                {isLoadingValuation ? (
                  <Text style={styles.valuationLoading}>Estimation…</Text>
                ) : (
                  <Text style={styles.infoValueHighlight}>{formatValorisation(valorisation)}</Text>
                )}
              </View>

              <View style={styles.infoSeparator} />
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="calendar" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.infoLabelText}>Créée le</Text>
                </View>
                <Text style={styles.infoValue}>{formatDate(createdAt)}</Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Rewards section */}
        <Animated.View entering={FadeInDown.delay(450).duration(500)}>
          <Text style={styles.rewardsTitle}>Récompenses obtenues</Text>

          <View style={styles.rewardsRow}>
            <DynamicGradientBorder
              borderRadius={16}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={(SCREEN_WIDTH - 36 - 24) / 3}
              style={styles.rewardCard}
            >
              <View style={styles.rewardContent}>
                <Text style={styles.rewardIcon}>⭐</Text>
                <Text style={styles.rewardValue}>+{xpReward} PX</Text>
              </View>
            </DynamicGradientBorder>

            <DynamicGradientBorder
              borderRadius={16}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={(SCREEN_WIDTH - 36 - 24) / 3}
              style={styles.rewardCard}
            >
              <View style={styles.rewardContent}>
                <PortfolioIcon color="#FFBC40" size={22} />
                <Text style={styles.rewardValue}>PORTFOLIO</Text>
                <Text style={styles.rewardSub}>+1</Text>
              </View>
            </DynamicGradientBorder>

            <DynamicGradientBorder
              borderRadius={16}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={(SCREEN_WIDTH - 36 - 24) / 3}
              style={styles.rewardCard}
            >
              <View style={styles.rewardContent}>
                <Text style={styles.rewardIcon}>🏆</Text>
                <Text style={styles.rewardValue}>RANG</Text>
                <Text style={styles.rewardSub}>+2</Text>
              </View>
            </DynamicGradientBorder>
          </View>
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: SPACING[6] }} />

        {/* Action buttons */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.buttonsContainer}>
          <GameButton
            title="JOUER MAINTENANT"
            variant="yellow"
            fullWidth
            onPress={handlePlay}
          />
          <GameButton
            title="RETOUR A L'ACCUEIL"
            variant="blue"
            fullWidth
            onPress={handleGoHome}
          />
        </Animated.View>
      </ScrollView>

      {/* Modale d'explication de la valorisation initiale (F10) */}
      <GamePopup
        visible={showValuationInfo}
        onRequestClose={() => setShowValuationInfo(false)}
        header="Comment c'est calculé ?"
        icon={<Ionicons name="diamond" size={56} color="#FFBC40" />}
        title="VALORISATION INITIALE"
        footer={
          <GameButton
            variant="yellow"
            fullWidth
            title="J'ai compris"
            onPress={() => setShowValuationInfo(false)}
          />
        }
      >
        <View style={styles.valuationModalBody}>
          {aiFactors && aiFactors.length > 0 ? (
            <>
              <Text style={styles.valuationIntro}>
                {aiExplanation ?? "Analyse de ton projet par notre IA."}
              </Text>
              <View style={styles.valuationFormulaCard}>
                {aiFactors.map((factor, idx) => (
                  <View key={`${factor.label}-${idx}`}>
                    {idx > 0 && <View style={styles.valuationFormulaSep} />}
                    <View style={styles.valuationFormulaRow}>
                      <Text style={styles.valuationFormulaLabel}>{factor.label}</Text>
                      <Text style={styles.valuationFormulaMultiplier}>{factor.value}</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.valuationFormulaSep} />
                <View style={styles.valuationFormulaRow}>
                  <Text style={styles.valuationFormulaTotal}>= Total</Text>
                  <Text style={styles.valuationFormulaTotalValue}>{formatValorisation(valorisation)}</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.valuationIntro}>
                Ta valorisation initiale dépend de 3 multiplicateurs liés à tes cartes d'inspiration.
              </Text>
              <View style={styles.valuationFormulaCard}>
                <View style={styles.valuationFormulaRow}>
                  <Text style={styles.valuationFormulaLabel}>Base</Text>
                  <Text style={styles.valuationFormulaValue}>{formatValorisation(BASE_VALUATION)}</Text>
                </View>
                <View style={styles.valuationFormulaSep} />
                <View style={styles.valuationFormulaRow}>
                  <Text style={styles.valuationFormulaLabel}>× Cible</Text>
                  <Text style={styles.valuationFormulaMultiplier}>×{targetMultiplier.toFixed(2)}</Text>
                </View>
                <View style={styles.valuationFormulaSep} />
                <View style={styles.valuationFormulaRow}>
                  <Text style={styles.valuationFormulaLabel}>× Mission</Text>
                  <Text style={styles.valuationFormulaMultiplier}>×{missionMultiplier.toFixed(2)}</Text>
                </View>
                <View style={styles.valuationFormulaSep} />
                <View style={styles.valuationFormulaRow}>
                  <Text style={styles.valuationFormulaLabel}>× Secteur</Text>
                  <Text style={styles.valuationFormulaMultiplier}>×{sectorMultiplier.toFixed(2)}</Text>
                </View>
                <View style={styles.valuationFormulaSep} />
                <View style={styles.valuationFormulaRow}>
                  <Text style={styles.valuationFormulaTotal}>= Total</Text>
                  <Text style={styles.valuationFormulaTotalValue}>{formatValorisation(valorisation)}</Text>
                </View>
              </View>
            </>
          )}

          <Text style={styles.valuationNote}>
            C'est une estimation de départ. Elle évoluera selon tes performances en partie : levées de fonds, événements, croissance de ton entreprise.
          </Text>
        </View>
      </GamePopup>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    flexGrow: 1,
  },
  cardContent: {
    padding: SPACING[5],
  },
  iconBadge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  startupName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: SPACING[2],
  },
  startupDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING[3],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  infoLabelText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '55%',
  },
  infoValueHighlight: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  infoSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  rewardsTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING[6],
    marginBottom: SPACING[4],
    letterSpacing: 0.5,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING[3],
  },
  rewardCard: {
    flex: 1,
  },
  rewardContent: {
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[2],
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 24,
    marginBottom: SPACING[2],
  },
  rewardValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    textAlign: 'center',
  },
  rewardSub: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: 2,
  },
  buttonsContainer: {
    gap: SPACING[3],
    marginTop: SPACING[6],
  },
  // Modale F10 — Explication de la valorisation initiale
  valuationModalBody: {
    width: '100%',
    paddingHorizontal: SPACING[2],
    gap: SPACING[3],
  },
  valuationIntro: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
  },
  valuationFormulaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[3],
  },
  valuationFormulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  valuationFormulaSep: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  valuationFormulaLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  valuationFormulaValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
  },
  valuationFormulaMultiplier: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#1F91D0',
  },
  valuationFormulaTotal: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#FFBC40',
  },
  valuationFormulaTotalValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFBC40',
    letterSpacing: 0.5,
  },
  valuationNote: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    lineHeight: 17,
    fontStyle: 'italic',
  },
  valuationLoading: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 188, 64, 0.7)',
    fontStyle: 'italic',
  },
});
