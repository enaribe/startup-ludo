/**
 * online-game-hub - Hub partie en ligne
 *
 * Affiche les 3 options: Match Rapide, Créer un Salon, Rejoindre un Salon
 */

import { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useUserStore } from '@/stores';

// Thèmes
const THEMES = {
  classic: {
    background: ['#194F8A', '#0C243E'] as [string, string],
    accent: '#FFBC40',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
  },
  agriculture: {
    background: ['#F6E8CC', '#FBF8F0'] as [string, string],
    accent: '#AC700C',
    cardBg: '#FFFFFF',
    cardBorder: '#E8E5DF',
    text: '#8B6A3C',
    textSecondary: '#A89070',
  },
};

// Options de jeu en ligne
const ONLINE_OPTIONS = [
  {
    id: 'quick-match',
    title: 'Match Rapide',
    description: 'Trouve automatiquement des adversaires et lance une partie',
    icon: 'flash',
    color: '#FFBC40',
    borderColor: '#1F91D0',
    route: '/(game)/quick-match',
  },
  {
    id: 'create-room',
    title: 'Créer un Salon',
    description: 'Crée ta partie et invite tes amis avec un code',
    icon: 'add-circle',
    color: '#4CAF50',
    borderColor: '#4CAF50',
    route: '/(game)/create-room',
  },
  {
    id: 'join-room',
    title: 'Rejoindre un Salon',
    description: 'Entre un code pour rejoindre la partie d\'un ami',
    icon: 'enter',
    color: '#1F91D0',
    borderColor: '#1F91D0',
    route: '/(game)/join-room',
  },
];

export default function OnlineHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const profile = useUserStore((state) => state.profile);

  const isAgriMode = challenge === 'agriculture';
  const theme = isAgriMode ? THEMES.agriculture : THEMES.classic;
  const hasProject = (profile?.startups?.length ?? 0) > 0;

  const [showNoProjectPopup, setShowNoProjectPopup] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleOptionPress = (option: (typeof ONLINE_OPTIONS)[0]) => {
    if (!hasProject) {
      setShowNoProjectPopup(true);
      return;
    }
    router.push({
      pathname: option.route as '/(game)/quick-match' | '/(game)/create-room' | '/(game)/join-room',
      params: challenge ? { challenge } : undefined,
    });
  };

  const handleCreateStartup = () => {
    setShowNoProjectPopup(false);
    router.push('/(startup)/ideation');
  };

  return (
    <View style={{ flex: 1, backgroundColor: isAgriMode ? '#F6E8CC' : '#0C243E' }}>
      {/* Background */}
      <LinearGradient
        colors={theme.background}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Lumière animée (mode classique) */}
      {!isAgriMode && (
        <Animated.View
          entering={FadeIn.delay(200).duration(1000)}
          style={{
            position: 'absolute',
            top: -100,
            left: '50%',
            marginLeft: -150,
            width: 300,
            height: 300,
            opacity: 0.3,
          }}
        >
          <Svg width="300" height="300">
            <Defs>
              <RadialGradient id="lightGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFBC40" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFBC40" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="150" cy="150" r="150" fill="url(#lightGrad)" />
          </Svg>
        </Animated.View>
      )}

      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: insets.top + SPACING[2],
          paddingBottom: SPACING[3],
          paddingHorizontal: SPACING[4],
          backgroundColor: isAgriMode ? 'rgba(246, 232, 204, 0.9)' : 'rgba(12, 36, 62, 0.85)',
          borderBottomWidth: 1,
          borderBottomColor: isAgriMode ? '#E8E5DF' : 'rgba(255, 188, 64, 0.1)',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>

        <Text
          style={{
            flex: 1,
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES.xl,
            color: theme.text,
            textAlign: 'center',
          }}
        >
          {isAgriMode ? 'Challenge Agriculture' : 'Partie en ligne'}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Contenu */}
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[4],
          justifyContent: 'center',
        }}
      >
        {/* Titre section */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.md,
              color: theme.textSecondary,
              textAlign: 'center',
            }}
          >
            Choisis ton Mode En Ligne
          </Text>
        </Animated.View>

        {/* Options */}
        <View style={{ gap: SPACING[4] }}>
          {ONLINE_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeInDown.delay(200 + index * 100).duration(500)}
            >
              <Pressable onPress={() => handleOptionPress(option)}>
                <View
                  style={{
                    backgroundColor: isAgriMode ? '#FFFFFF' : theme.cardBg,
                    borderRadius: 20,
                    padding: SPACING[5],
                    borderWidth: 2,
                    borderColor: isAgriMode ? '#E8E5DF' : option.borderColor,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  {/* Icône */}
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: isAgriMode ? '#FFF7E6' : `${option.color}20`,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: SPACING[4],
                    }}
                  >
                    <Ionicons
                      name={option.icon as keyof typeof Ionicons.glyphMap}
                      size={28}
                      color={option.color}
                    />
                  </View>

                  {/* Texte */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.title,
                        fontSize: FONT_SIZES.lg,
                        color: option.id === 'create-room' ? '#4CAF50' : theme.text,
                        marginBottom: SPACING[1],
                      }}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.sm,
                        color: theme.textSecondary,
                      }}
                    >
                      {option.description}
                    </Text>
                  </View>

                  {/* Chevron */}
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={theme.textSecondary}
                  />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Popup - Pas de projet */}
      <Modal
        visible={showNoProjectPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoProjectPopup(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING[4],
          }}
        >
          <View
            style={{
              backgroundColor: '#0C243E',
              borderRadius: 20,
              padding: SPACING[6],
              width: '100%',
              maxWidth: 340,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 188, 64, 0.2)',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(255, 188, 64, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SPACING[4],
              }}
            >
              <Ionicons name="business-outline" size={32} color="#FFBC40" />
            </View>

            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES.xl,
                color: COLORS.text,
                textAlign: 'center',
                marginBottom: SPACING[2],
              }}
            >
              Aucun projet
            </Text>

            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.sm,
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginBottom: SPACING[5],
              }}
            >
              Tu dois créer une startup avant de jouer en ligne. Les jetons gagnés seront investis dans ton projet !
            </Text>

            <Pressable
              onPress={handleCreateStartup}
              style={{
                width: '100%',
                backgroundColor: '#FFBC40',
                paddingVertical: SPACING[3],
                borderRadius: 12,
                marginBottom: SPACING[3],
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.md,
                  color: '#0C243E',
                  textAlign: 'center',
                }}
              >
                Créer ma startup
              </Text>
            </Pressable>

            <Pressable onPress={() => setShowNoProjectPopup(false)}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.textSecondary,
                }}
              >
                Annuler
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
