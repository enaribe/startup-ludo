/**
 * online-game-hub - Hub partie en ligne
 *
 * Affiche les 3 options: Match Rapide, Créer un Salon, Rejoindre un Salon
 * + statut de connexion + bouton principal
 */

import { useState } from 'react';
import { View, Text, Pressable, Modal, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useUserStore } from '@/stores';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

// Options de jeu en ligne
const ONLINE_OPTIONS = [
  {
    id: 'quick-match' as const,
    title: 'MATCH RAPIDE',
    description: 'Trouve automatiquement des adversaires et lance une partie',
    icon: 'flash' as keyof typeof Ionicons.glyphMap,
    color: '#FFBC40',
  },
  {
    id: 'create-room' as const,
    title: 'CREER UN SALON',
    description: 'Cree ta partie et invite tes amis avec un code',
    icon: 'add-circle' as keyof typeof Ionicons.glyphMap,
    color: '#4CAF50',
  },
  {
    id: 'join-room' as const,
    title: 'REJOINDRE UN SALON',
    description: 'Entre un code pour rejoindre la partie d\'un ami',
    icon: 'people' as keyof typeof Ionicons.glyphMap,
    color: '#1F91D0',
  },
];

export default function OnlineHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const profile = useUserStore((state) => state.profile);

  const hasProject = (profile?.startups?.length ?? 0) > 0;

  const [showNoProjectPopup, setShowNoProjectPopup] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleOptionPress = (option: typeof ONLINE_OPTIONS[number]) => {
    if (!hasProject) {
      setShowNoProjectPopup(true);
      return;
    }

    const routeMap = {
      'quick-match': '/(game)/quick-match',
      'create-room': '/(game)/create-room',
      'join-room': '/(game)/join-room',
    } as const;

    router.push({
      pathname: routeMap[option.id],
      params: challenge ? { challenge } : undefined,
    });
  };

  const handleCreateStartup = () => {
    setShowNoProjectPopup(false);
    router.push('/(startup)/ideation');
  };

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>PARTIE EN LIGNE</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ marginBottom: SPACING[5] }}>
          <Text style={styles.sectionTitle}>CHOISIS TON MODE EN LIGNE</Text>
        </Animated.View>

        {/* Options */}
        <View style={{ gap: SPACING[3] }}>
          {ONLINE_OPTIONS.map((option, index) => {
            return (
              <Animated.View
                key={option.id}
                entering={FadeInDown.delay(200 + index * 100).duration(500)}
              >
                <Pressable onPress={() => handleOptionPress(option)}>
                  <DynamicGradientBorder
                    borderRadius={20}
                    fill="rgba(0, 0, 0, 0.35)"
                    boxWidth={contentWidth}
                  >
                    <View style={styles.optionContent}>
                      {/* Icon */}
                      <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                        <Ionicons name={option.icon} size={28} color={option.color} />
                      </View>

                      {/* Text */}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>
                          {option.title}
                        </Text>
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      </View>

                      {/* Chevron */}
                      <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
                    </View>
                  </DynamicGradientBorder>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Connection Status */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={{ marginTop: SPACING[5] }}>
          <DynamicGradientBorder
            borderRadius={16}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={contentWidth}
          >
            <View style={styles.statusContent}>
              <View style={styles.statusDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>STATUT DE CONNEXION</Text>
                <Text style={styles.statusText}>Connecte - Pret a jouer</Text>
              </View>
              <Ionicons name="wifi" size={20} color="#4CAF50" />
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </ScrollView>

      {/* Popup - Pas de projet */}
      <Modal
        visible={showNoProjectPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoProjectPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="business-outline" size={32} color="#FFBC40" />
            </View>

            <Text style={styles.modalTitle}>Aucun projet</Text>
            <Text style={styles.modalDescription}>
              Tu dois creer une startup avant de jouer en ligne. Les jetons gagnes seront investis dans ton projet !
            </Text>

            <GameButton
              variant="yellow"
              fullWidth
              title="CREER MA STARTUP"
              onPress={handleCreateStartup}
              style={{ marginBottom: SPACING[3] }}
            />

            <Pressable onPress={() => setShowNoProjectPopup(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: 'white',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    gap: SPACING[3],
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    gap: SPACING[3],
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  statusTitle: {
    fontFamily: FONTS.title,
    fontSize: 12,
    color: 'white',
    marginBottom: 2,
  },
  statusText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalContent: {
    backgroundColor: '#0A1929',
    borderRadius: 24,
    padding: SPACING[6],
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.2)',
  },
  modalIconContainer: {
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
    fontSize: FONT_SIZES.xl,
    color: 'white',
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  modalDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: SPACING[5],
  },
  cancelText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
