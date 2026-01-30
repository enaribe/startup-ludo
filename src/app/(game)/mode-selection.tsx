import { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore, useUserStore } from '@/stores';
import { DynamicGradientBorder } from '@/components/ui';

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

  const [showNoProjectPopup, setShowNoProjectPopup] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);

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
    setShowGuestPopup(false);
    router.push('/(auth)/register');
  };

  const handleCreateStartup = () => {
    setShowNoProjectPopup(false);
    router.push('/(startup)/ideation');
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

      {/* Popups (kept functional logic, styled slightly) */}
      {/* Popup - Pas de projet */}
      <Modal
        visible={showNoProjectPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoProjectPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="business-outline" size={32} color="#FFBC40" />
            </View>
            <Text style={styles.modalTitle}>Aucun projet</Text>
            <Text style={styles.modalText}>
              Tu dois créer une startup avant de jouer en ligne. Les jetons gagnés seront investis dans ton projet !
            </Text>
            <Pressable onPress={handleCreateStartup} style={styles.modalPrimaryButton}>
              <Text style={styles.modalPrimaryButtonText}>Créer ma startup</Text>
            </Pressable>
            <Pressable onPress={() => setShowNoProjectPopup(false)} style={styles.modalSecondaryButton}>
              <Text style={styles.modalSecondaryButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Popup - Restriction invité */}
      <Modal
        visible={showGuestPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuestPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: 'rgba(255, 107, 107, 0.3)' }]}>
            <View style={[styles.modalIconBox, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
              <Ionicons name="lock-closed" size={32} color="#FF6B6B" />
            </View>
            <Text style={styles.modalTitle}>Compte requis</Text>
            <Text style={styles.modalText}>
              Crée un compte pour jouer en ligne et sauvegarder ta progression !
            </Text>
            <Pressable onPress={handleCreateAccount} style={styles.modalPrimaryButton}>
              <Text style={styles.modalPrimaryButtonText}>Créer un compte</Text>
            </Pressable>
            <Pressable onPress={() => setShowGuestPopup(false)} style={styles.modalSecondaryButton}>
              <Text style={styles.modalSecondaryButtonText}>Annuler</Text>
            </Pressable>
          </View>
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
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalContent: {
    backgroundColor: '#0C243E',
    borderRadius: 24,
    padding: SPACING[6],
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.2)',
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 188, 64, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  modalTitle: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING[2],
    textTransform: 'uppercase',
  },
  modalText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[6],
    lineHeight: 20,
  },
  modalPrimaryButton: {
    width: '100%',
    backgroundColor: '#FFBC40',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: SPACING[3],
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#0C243E',
    textTransform: 'uppercase',
  },
  modalSecondaryButton: {
    paddingVertical: 8,
  },
  modalSecondaryButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
