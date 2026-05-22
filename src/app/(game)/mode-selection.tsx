import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalModeIcon, OnlineModeIcon } from '@/components/game/ModeSelectionIcons';
import { RocketIcon } from '@/components/icons';
import { DynamicGradientBorder, GameButton, GamePopup, OutlinedText, ProgressionPopup, RadialBackground } from '@/components/ui';
import { useAuthStore, useSettingsStore, useUserStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEME = {
  accent: '#FFBC40',
  cardFill: 'rgba(0, 0, 0, 0.35)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textMuted: 'rgba(127, 142, 158, 0.95)',
};

export default function GameModeSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { challenge, showProgression: showProgressionParam, xpGained: xpGainedParam, valorisationGain: valorisationGainParam } =
    useLocalSearchParams<{ challenge?: string; showProgression?: string; xpGained?: string; valorisationGain?: string }>();
  const progressionXpGained = xpGainedParam ? parseInt(xpGainedParam, 10) : undefined;
  const progressionValorisationGain = valorisationGainParam ? parseInt(valorisationGainParam, 10) : undefined;
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);

  const isGuest = user?.isGuest || !user;
  const hasProject = (profile?.startups?.length ?? 0) > 0;
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const [showNoProjectPopup, setShowNoProjectPopup] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [showProgression, setShowProgression] = useState(false);

  useEffect(() => {
    if (showProgressionParam === '1') setShowProgression(true);
  }, [showProgressionParam]);

  useEffect(() => {
    if (showGuestPopup && hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [showGuestPopup, hapticsEnabled]);

  useEffect(() => {
    if (showNoProjectPopup && hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [showNoProjectPopup, hapticsEnabled]);

  const handleBack = () => {
    router.back();
  };

  const handleLocalGame = () => {
    router.push({
      pathname: '/(game)/local-setup',
      params: challenge ? { challenge } : undefined,
    });
  };

  const handleOnlineGame = () => {
    if (isGuest) {
      setShowGuestPopup(true);
      return;
    }
    if (!hasProject) {
      setShowNoProjectPopup(true);
      return;
    }
    router.push({
      pathname: '/(game)/online-hub',
      params: challenge ? { challenge } : undefined,
    });
  };

  const handleCreateAccount = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowGuestPopup(false);
    router.push('/(auth)/register');
  };

  const handleCloseGuestPopup = () => {
    setShowGuestPopup(false);
  };

  const handleCreateStartup = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowNoProjectPopup(false);
    router.push('/(startup)/ideation');
  };

  const handleCloseNoProjectPopup = () => {
    setShowNoProjectPopup(false);
  };

  const contentWidth = SCREEN_WIDTH - SPACING[4] * 2;

  const headerBlockHeight = insets.top + 72;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header — titre centré, retour jaune */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + SPACING[2],
            backgroundColor: '#0A1929',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={THEME.text} />
          </Pressable>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>NOUVELLE PARTIE</Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <View style={[styles.contentContainer, { paddingTop: headerBlockHeight + SPACING[5] }]}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.subtitleWrap}>
          <OutlinedText
            text="SÉLECTIONNER LE MODE DE JEU"
            style={styles.subtitle}
            outlineColor="#0A1929"
            outlineWidth={2}
          />
        </Animated.View>

        {/* Partie locale — icône téléphone jaune */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable onPress={handleLocalGame}>
            <DynamicGradientBorder
              borderRadius={24}
              fill={THEME.cardFill}
              boxWidth={contentWidth}
              style={{ marginBottom: SPACING[4] }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconColumn}>
                  <LocalModeIcon size={40} />
                </View>

                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>PARTIE LOCALE</Text>
                  <Text style={styles.cardDescription}>
                    Joue avec tes amis sur le même appareil, chacun son tour.
                  </Text>

                  <View style={styles.tagsRow}>
                    <View style={styles.tag}>
                      <Ionicons name="people-outline" size={12} color={THEME.textMuted} />
                      <Text style={styles.tagText}>2-4 joueurs</Text>
                    </View>
                  </View>
                </View>
              </View>
            </DynamicGradientBorder>
          </Pressable>
        </Animated.View>

        {/* Partie en ligne — icône signal bleu */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Pressable onPress={handleOnlineGame}>
            <DynamicGradientBorder
              borderRadius={24}
              fill={THEME.cardFill}
              boxWidth={contentWidth}
              style={{ opacity: isGuest ? 0.85 : 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconColumn}>
                  <OnlineModeIcon size={52} />
                </View>

                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>PARTIE EN LIGNE</Text>
                  <Text style={styles.cardDescription}>
                    Affronte des joueurs du monde entier en temps réel.
                  </Text>

                  <View style={styles.tagsRow}>
                    <View style={styles.tag}>
                      <Ionicons name="trophy-outline" size={12} color={THEME.textMuted} />
                      <Text style={styles.tagText}>Classement</Text>
                    </View>
                    {isGuest ? (
                      <View style={[styles.tag, styles.tagGuest]}>
                        <Ionicons name="lock-closed" size={12} color="#FF6B6B" />
                        <Text style={[styles.tagText, styles.tagTextGuest]}>Compte requis</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </DynamicGradientBorder>
          </Pressable>
        </Animated.View>
      </View>

      {/* Popup - Aucun projet (GamePopup design system) */}
      <GamePopup
        visible={showNoProjectPopup}
        onRequestClose={handleCloseNoProjectPopup}
        header="Nouveau projet requis"
        icon={<RocketIcon color="#1F91D0" size={72} withShadow={false} />}
        title="AUCUN PROJET"
        footer={
          <>
            <GameButton
              variant="yellow"
              fullWidth
              title="Créer mon entreprise"
              onPress={handleCreateStartup}
              style={styles.popupPrimaryBtn}
            />
            <GameButton
              variant="blue"
              fullWidth
              title="Annuler"
              onPress={handleCloseNoProjectPopup}
            />
          </>
        }
      >
        <Text style={styles.popupBodyText}>
          Tu dois créer une entreprise avant de jouer en ligne. Les jetons gagnés seront investis dans ton projet !
        </Text>
      </GamePopup>

      {/* Popup - Compte requis (GamePopup design system) */}
      <GamePopup
        visible={showGuestPopup}
        onRequestClose={handleCloseGuestPopup}
        header="Mode en ligne"
        title="COMPTE REQUIS"
        footer={
          <>
            <GameButton
              variant="yellow"
              fullWidth
              title="Créer un compte"
              onPress={handleCreateAccount}
              style={styles.popupPrimaryBtn}
            />
            <GameButton
              variant="blue"
              fullWidth
              title="Annuler"
              onPress={handleCloseGuestPopup}
            />
          </>
        }
      >
        <Text style={styles.popupBodyText}>
          Crée un compte pour jouer en ligne et sauvegarder ta progression !
        </Text>
      </GamePopup>

      {/* Popup progression post-partie */}
      <ProgressionPopup
        visible={showProgression}
        onContinue={() => setShowProgression(false)}
        xpGained={progressionXpGained}
        valorisationGain={progressionValorisationGain}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[4],
    paddingHorizontal: SPACING[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(5, 25, 50, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTitleWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  headerRightSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: THEME.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  contentContainer: {
    paddingHorizontal: SPACING[4],
  },
  subtitleWrap: {
    marginBottom: SPACING[6],
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[5],
    paddingHorizontal: SPACING[4],
    gap: SPACING[4],
  },
  iconColumn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING[2],
    color: THEME.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING[3],
    lineHeight: 20,
    color: THEME.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagGuest: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  tagText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: THEME.textMuted,
    textTransform: 'capitalize',
  },
  tagTextGuest: {
    color: '#FF6B6B',
    textTransform: 'none',
  },
  popupBodyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[3],
    paddingHorizontal: SPACING[2],
  },
  popupPrimaryBtn: {
    marginBottom: SPACING[3],
  },
});
