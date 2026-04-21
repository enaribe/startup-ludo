import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalModeIcon, OnlineModeIcon } from '@/components/game/ModeSelectionIcons';
import { DynamicGradientBorder, GameButton, ProgressionPopup, RadialBackground } from '@/components/ui';
import { useAuthStore, useSettingsStore, useUserStore } from '@/stores';
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
            <Ionicons name="chevron-back" size={26} color={THEME.accent} />
          </Pressable>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>NOUVELLE PARTIE</Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <View style={[styles.contentContainer, { paddingTop: headerBlockHeight + SPACING[5] }]}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.subtitleWrap}>
          <Text style={styles.subtitle}>Sélectionner le mode de jeu</Text>
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

      {/* Popup - Aucun projet (design system) */}
      <Modal
        visible={showNoProjectPopup}
        transparent
        animationType="fade"
        onRequestClose={handleCloseNoProjectPopup}
      >
        <View style={styles.popupOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseNoProjectPopup} />
          <Animated.View
            entering={SlideInUp.duration(100).springify().damping(32)}
            exiting={FadeOut.duration(100)}
            style={styles.popupWrapper}
          >
            <DynamicGradientBorder
              borderRadius={24}
              fill="#0D2744"
              style={styles.popupCardBorder}
            >
              <View style={styles.popupInner}>
                <View style={styles.popupHeaderRow}>
                  <View style={styles.popupHeaderLeft}>
                    <View style={[styles.popupIconBox, styles.popupIconBoxYellow]}>
                      <Ionicons name="business-outline" size={18} color="#FFBC40" />
                    </View>
                    <Text style={styles.popupTitle}>Aucun projet</Text>
                  </View>
                  <Pressable onPress={handleCloseNoProjectPopup} hitSlop={12} style={styles.popupCloseBtn}>
                    <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>
                <View style={styles.popupDivider} />
                <Text style={styles.popupSubtitle}>
                  Tu dois créer une startup avant de jouer en ligne. Les jetons gagnés seront investis dans ton projet !
                </Text>
                <GameButton
                  variant="yellow"
                  fullWidth
                  title="Créer ma startup"
                  onPress={handleCreateStartup}
                  style={styles.popupPrimaryBtn}
                />
                <GameButton
                  variant="blue"
                  fullWidth
                  title="Annuler"
                  onPress={handleCloseNoProjectPopup}
                  style={styles.popupSecondaryBtn}
                />
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        </View>
      </Modal>

      {/* Popup - Compte requis (design system) */}
      <Modal
        visible={showGuestPopup}
        transparent
        animationType="fade"
        onRequestClose={handleCloseGuestPopup}
      >
        <View style={styles.popupOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseGuestPopup} />
          <Animated.View
            entering={SlideInUp.duration(100).springify().damping(32)}
            exiting={FadeOut.duration(100)}
            style={styles.popupWrapper}
          >
            <DynamicGradientBorder
              borderRadius={24}
              fill="#0D2744"
              style={styles.popupCardBorder}
            >
              <View style={styles.popupInner}>
                <View style={styles.popupHeaderRow}>
                  <View style={styles.popupHeaderLeft}>
                    <View style={styles.popupIconBox}>
                      <Ionicons name="lock-closed" size={18} color="#FF6B6B" />
                    </View>
                    <Text style={styles.popupTitle}>Compte requis</Text>
                  </View>
                  <Pressable onPress={handleCloseGuestPopup} hitSlop={12} style={styles.popupCloseBtn}>
                    <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>
                <View style={styles.popupDivider} />
                <Text style={styles.popupSubtitle}>
                  Crée un compte pour jouer en ligne et sauvegarder ta progression !
                </Text>
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
                  style={styles.popupSecondaryBtn}
                />
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        </View>
      </Modal>

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
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: THEME.accent,
    textAlign: 'center',
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
  // Modal "Aucun projet" (conservé tel quel pour l’instant)
  // Popups (design system)
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  popupWrapper: {
    width: '100%',
    maxWidth: 340,
  },
  popupCardBorder: {
    width: '100%',
    overflow: 'hidden',
  },
  popupInner: {
    padding: SPACING[5],
  },
  popupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  popupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  popupIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupIconBoxYellow: {
    backgroundColor: 'rgba(255, 188, 64, 0.2)',
  },
  popupTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  popupCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING[4],
  },
  popupSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[5],
  },
  popupPrimaryBtn: {
    marginBottom: SPACING[3],
  },
  popupSecondaryBtn: {},
});
