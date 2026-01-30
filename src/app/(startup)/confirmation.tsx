import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { PortfolioIcon } from '@/components/icons';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { useUserStore, useSettingsStore } from '@/stores';
import type { Startup, TargetCard, MissionCard } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function StartupConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const addStartup = useUserStore((state) => state.addStartup);
  const addXP = useUserStore((state) => state.addXP);

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

  const startupName = params.startupName || 'Nouvelle Startup';
  const startupDescription = params.startupDescription || '';
  const sectorId = params.startupSector || 'fintech';
  const sectorInfo = SECTOR_INFO[sectorId] ?? { name: 'Fintech', icon: 'cash' };
  const createdAt = Date.now();

  // Reconstruct cards from params
  const targetCard: TargetCard | undefined = params.targetCardId
    ? {
        id: params.targetCardId,
        category: 'demographic',
        title: params.targetCardTitle || '',
        description: params.targetCardDesc || '',
        rarity: 'common',
      }
    : undefined;

  const missionCard: MissionCard | undefined = params.missionCardId
    ? {
        id: params.missionCardId,
        category: 'efficiency',
        title: params.missionCardTitle || '',
        description: params.missionCardDesc || '',
        rarity: 'common',
      }
    : undefined;

  useEffect(() => {
    // Create and save the startup
    const newStartup: Startup = {
      id: generateId(),
      name: startupName,
      sector: sectorId,
      description: startupDescription,
      targetCard,
      missionCard,
      createdAt,
      tokensInvested: 0,
      level: 1,
    };
    addStartup(newStartup);

    // Award XP for creating a startup
    addXP(200);

    // Celebration haptic
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                <View style={styles.infoLabel}>
                  <Ionicons name="diamond" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.infoLabelText}>Valorisation initiale</Text>
                </View>
                <Text style={styles.infoValueHighlight}>150K€</Text>
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
                <Text style={styles.rewardValue}>+200 PX</Text>
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
});
