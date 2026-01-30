import { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeOut, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore, useUserStore, useSettingsStore } from '@/stores';
import { DynamicGradientBorder, GameButton } from '@/components/ui';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Thèmes disponibles
const THEMES = {
  classic: {
    background: ['#0F3A6B', '#081A2A'],
    accent: '#FFBC40',
    cardFill: 'rgba(0, 0, 0, 0.35)', // même fond que le bouton Nouvelle partie (accueil)
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
  },
  agriculture: {
    background: ['#F6E8CC', '#FBF8F0'],
    accent: '#AC700C',
    cardFill: '#FFFFFF',
    text: '#8B6A3C',
    textSecondary: 'rgba(139, 106, 60, 0.7)',
  },
};

const Background = ({ isAgriMode }: { isAgriMode: boolean }) => {
  if (isAgriMode) {
    return (
      <LinearGradient
        colors={THEMES.agriculture.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    );
  }

  return (
    <Svg style={StyleSheet.absoluteFill} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
      <Defs>
        <RadialGradient id="radialBg" cx="50%" cy="50%" r="80%">
          <Stop offset="0%" stopColor="#0F3A6B" stopOpacity="1" />
          <Stop offset="100%" stopColor="#081A2A" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#radialBg)" />
    </Svg>
  );
};

export default function GameModeSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);

  const isAgriMode = challenge === 'agriculture';
  const theme = isAgriMode ? THEMES.agriculture : THEMES.classic;
  const isGuest = user?.isGuest || !user;
  const hasProject = (profile?.startups?.length ?? 0) > 0;
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const [showNoProjectPopup, setShowNoProjectPopup] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);

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

  return (
    <View style={styles.container}>
      <Background isAgriMode={isAgriMode} />

      {/* Header avec Back Button intégré au style */}
      <View
        style={[
          styles.headerContainer,
          { 
            paddingTop: insets.top + SPACING[2],
            backgroundColor: isAgriMode ? 'rgba(246, 232, 204, 0.9)' : '#0A1929',
            borderBottomWidth: isAgriMode ? 1 : 0,
            borderBottomColor: '#E8E5DF',
            borderBottomLeftRadius: isAgriMode ? 0 : 24,
            borderBottomRightRadius: isAgriMode ? 0 : 24,
          }
        ]}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.text}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isAgriMode ? 'CHALLENGE AGRI' : 'NOUVELLE PARTIE'}
          </Text>
        </View>
      </View>

      <View style={[styles.contentContainer, { paddingTop: insets.top + 80 + SPACING[4] }]}>
        
        {/* Badge Mode de jeu */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{
            alignSelf: 'center',
            backgroundColor: isAgriMode ? 'rgba(172, 112, 12, 0.1)' : 'rgba(255, 188, 64, 0.15)',
            paddingHorizontal: SPACING[4],
            paddingVertical: SPACING[2],
            borderRadius: 20,
            marginBottom: SPACING[6],
            borderWidth: 1,
            borderColor: isAgriMode ? 'rgba(172, 112, 12, 0.2)' : 'rgba(255, 188, 64, 0.3)',
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.sm,
              color: theme.accent,
            }}
          >
            SÉLECTIONNE LE MODE DE JEU
          </Text>
        </Animated.View>

        {/* Option: Partie Locale */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable onPress={handleLocalGame}>
            <DynamicGradientBorder
              borderRadius={24}
              fill={theme.cardFill}
              boxWidth={contentWidth}
              style={{ marginBottom: SPACING[4] }}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconBox, { backgroundColor: isAgriMode ? '#FFF7E6' : 'rgba(255, 188, 64, 0.15)' }]}>
                  <Ionicons name="people" size={32} color={theme.accent} />
                </View>
                
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Partie Locale</Text>
                  <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                    Joue avec tes amis sur le même appareil, chacun son tour.
                  </Text>
                  
                  <View style={styles.tagsRow}>
                    <View style={[styles.tag, { backgroundColor: isAgriMode ? '#F6E8CC' : 'rgba(255, 255, 255, 0.1)' }]}>
                      <Ionicons name="people-outline" size={12} color={theme.textSecondary} />
                      <Text style={[styles.tagText, { color: theme.textSecondary }]}>2-4 Joueurs</Text>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
              </View>
            </DynamicGradientBorder>
          </Pressable>
        </Animated.View>

        {/* Option: Partie en Ligne */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Pressable onPress={handleOnlineGame}>
            <DynamicGradientBorder
              borderRadius={24}
              fill={theme.cardFill}
              boxWidth={contentWidth}
              style={{ opacity: isGuest ? 0.8 : 1 }}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconBox, { backgroundColor: isAgriMode ? '#FFF7E6' : 'rgba(31, 145, 208, 0.15)' }]}>
                  <Ionicons name="globe" size={32} color={isAgriMode ? '#AC700C' : '#1F91D0'} />
                </View>
                
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Partie en Ligne</Text>
                  <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                    Affronte des joueurs du monde entier en temps réel.
                  </Text>
                  
                  <View style={styles.tagsRow}>
                    <View style={[styles.tag, { backgroundColor: isAgriMode ? '#F6E8CC' : 'rgba(255, 255, 255, 0.1)' }]}>
                      <Ionicons name="trophy-outline" size={12} color={theme.textSecondary} />
                      <Text style={[styles.tagText, { color: theme.textSecondary }]}>Classement</Text>
                    </View>
                    {isGuest && (
                      <View style={[styles.tag, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                        <Ionicons name="lock-closed" size={12} color="#FF6B6B" />
                        <Text style={[styles.tagText, { color: '#FF6B6B' }]}>Compte requis</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[4],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  contentContainer: {
    paddingHorizontal: SPACING[4],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[4],
  },
  cardTextContainer: {
    flex: 1,
    marginRight: SPACING[2],
  },
  cardTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontFamily: FONTS.body,
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
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
