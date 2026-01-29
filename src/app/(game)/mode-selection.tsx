/**
 * game-mode-selection - Sélection du mode de jeu
 *
 * Affiche les options Partie locale et Partie en ligne
 * avec gestion du mode Challenge (Agriculture, etc.)
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
import { useAuthStore, useUserStore } from '@/stores';

// Thèmes disponibles
const THEMES = {
  classic: {
    background: ['#194F8A', '#0C243E'] as [string, string],
    accent: '#FFBC40',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
  },
  agriculture: {
    background: ['#F6E8CC', '#FBF8F0'] as [string, string],
    accent: '#AC700C',
    cardBg: '#FFFFFF',
    cardBorder: '#E8E5DF',
  },
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
    router.push('/(startup)/inspiration-cards');
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

      {/* Lumière animée SVG (mode classique seulement) */}
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
          <Ionicons
            name="arrow-back"
            size={24}
            color={isAgriMode ? '#8B6A3C' : COLORS.text}
          />
        </Pressable>

        <Text
          style={{
            flex: 1,
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES.xl,
            color: isAgriMode ? '#8B6A3C' : COLORS.text,
            textAlign: 'center',
          }}
        >
          {isAgriMode ? 'Challenge Agriculture' : 'Nouvelle partie'}
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
        {/* Badge Mode de jeu (inactif) */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{
            alignSelf: 'center',
            backgroundColor: isAgriMode ? 'rgba(172, 112, 12, 0.1)' : 'rgba(255, 188, 64, 0.15)',
            paddingHorizontal: SPACING[4],
            paddingVertical: SPACING[2],
            borderRadius: 20,
            marginBottom: SPACING[8],
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.sm,
              color: theme.accent,
            }}
          >
            MODE DE JEU
          </Text>
        </Animated.View>

        {/* Carte Partie Locale */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable onPress={handleLocalGame}>
            <View
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: 20,
                padding: SPACING[5],
                marginBottom: SPACING[4],
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* Icône */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: isAgriMode ? '#FFF7E6' : 'rgba(255, 188, 64, 0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: SPACING[4],
                  }}
                >
                  <Ionicons name="people" size={28} color={theme.accent} />
                </View>

                <View style={{ flex: 1 }}>
                  {/* Tag */}
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: isAgriMode ? '#AC700C' : '#FFBC40',
                      paddingHorizontal: SPACING[2],
                      paddingVertical: 2,
                      borderRadius: 6,
                      marginBottom: SPACING[2],
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bodySemiBold,
                        fontSize: 10,
                        color: isAgriMode ? '#FFFFFF' : '#0C243E',
                      }}
                    >
                      CLASSIQUE
                    </Text>
                  </View>

                  {/* Titre */}
                  <Text
                    style={{
                      fontFamily: FONTS.title,
                      fontSize: FONT_SIZES.lg,
                      color: isAgriMode ? '#8B6A3C' : COLORS.text,
                      marginBottom: SPACING[1],
                    }}
                  >
                    Partie locale
                  </Text>

                  {/* Description */}
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: FONT_SIZES.sm,
                      color: isAgriMode ? '#8B6A3C' : COLORS.textSecondary,
                      marginBottom: SPACING[3],
                    }}
                  >
                    Joue avec tes amis sur le même appareil, chacun son tour
                  </Text>

                  {/* Badges */}
                  <View style={{ flexDirection: 'row', gap: SPACING[2] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isAgriMode ? '#F6E8CC' : 'rgba(255, 255, 255, 0.1)',
                        paddingHorizontal: SPACING[2],
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name="people-outline"
                        size={14}
                        color={isAgriMode ? '#8B6A3C' : COLORS.textSecondary}
                      />
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.xs,
                          color: isAgriMode ? '#8B6A3C' : COLORS.textSecondary,
                          marginLeft: 4,
                        }}
                      >
                        2-4 joueurs
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isAgriMode ? '#F6E8CC' : 'rgba(255, 255, 255, 0.1)',
                        paddingHorizontal: SPACING[2],
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={14}
                        color={isAgriMode ? '#8B6A3C' : COLORS.textSecondary}
                      />
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.xs,
                          color: isAgriMode ? '#8B6A3C' : COLORS.textSecondary,
                          marginLeft: 4,
                        }}
                      >
                        Privé
                      </Text>
                    </View>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={isAgriMode ? '#8B6A3C' : COLORS.textSecondary}
                />
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Carte Partie en ligne */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Pressable onPress={handleOnlineGame}>
            <View
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: 20,
                padding: SPACING[5],
                borderWidth: 1,
                borderColor: isGuest ? 'rgba(255, 107, 107, 0.3)' : theme.cardBorder,
                opacity: isGuest ? 0.8 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Overlay cadenas pour invités */}
              {isGuest && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: 'rgba(255, 107, 107, 0.9)',
                    paddingHorizontal: SPACING[3],
                    paddingVertical: SPACING[1],
                    borderBottomLeftRadius: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                    <Text
                      style={{
                        fontFamily: FONTS.bodySemiBold,
                        fontSize: 10,
                        color: '#FFFFFF',
                        marginLeft: 4,
                      }}
                    >
                      Crée un compte
                    </Text>
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* Icône */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: isAgriMode ? '#FFF7E6' : 'rgba(31, 145, 208, 0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: SPACING[4],
                  }}
                >
                  <Ionicons
                    name="globe"
                    size={28}
                    color={isAgriMode ? '#AC700C' : '#1F91D0'}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  {/* Tag */}
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: '#1F91D0',
                      paddingHorizontal: SPACING[2],
                      paddingVertical: 2,
                      borderRadius: 6,
                      marginBottom: SPACING[2],
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bodySemiBold,
                        fontSize: 10,
                        color: '#FFFFFF',
                      }}
                    >
                      MULTIJOUEUR
                    </Text>
                  </View>

                  {/* Titre */}
                  <Text
                    style={{
                      fontFamily: FONTS.title,
                      fontSize: FONT_SIZES.lg,
                      color: isAgriMode ? '#8B6A3C' : COLORS.text,
                      marginBottom: SPACING[1],
                    }}
                  >
                    Partie en ligne
                  </Text>

                  {/* Description */}
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: FONT_SIZES.sm,
                      color: isAgriMode ? '#8B6A3C' : COLORS.textSecondary,
                      marginBottom: SPACING[3],
                    }}
                  >
                    Affronte des joueurs du monde entier en temps réel
                  </Text>

                  {/* Badges */}
                  <View style={{ flexDirection: 'row', gap: SPACING[2] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isAgriMode ? '#F6E8CC' : 'rgba(255, 255, 255, 0.1)',
                        paddingHorizontal: SPACING[2],
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name="people-outline"
                        size={14}
                        color={isAgriMode ? '#8B6A3C' : COLORS.textSecondary}
                      />
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.xs,
                          color: isAgriMode ? '#8B6A3C' : COLORS.textSecondary,
                          marginLeft: 4,
                        }}
                      >
                        2-4 joueurs
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isAgriMode ? '#F6E8CC' : 'rgba(255, 255, 255, 0.1)',
                        paddingHorizontal: SPACING[2],
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name="trophy-outline"
                        size={14}
                        color={isAgriMode ? '#8B6A3C' : COLORS.textSecondary}
                      />
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.xs,
                          color: isAgriMode ? '#8B6A3C' : COLORS.textSecondary,
                          marginLeft: 4,
                        }}
                      >
                        Classement
                      </Text>
                    </View>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={isAgriMode ? '#8B6A3C' : COLORS.textSecondary}
                />
              </View>
            </View>
          </Pressable>
        </Animated.View>
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

      {/* Popup - Restriction invité */}
      <Modal
        visible={showGuestPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuestPopup(false)}
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
              borderColor: 'rgba(255, 107, 107, 0.3)',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SPACING[4],
              }}
            >
              <Ionicons name="lock-closed" size={32} color="#FF6B6B" />
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
              Compte requis
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
              Crée un compte pour jouer en ligne et sauvegarder ta progression !
            </Text>

            <Pressable
              onPress={handleCreateAccount}
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
                Créer un compte
              </Text>
            </Pressable>

            <Pressable onPress={() => setShowGuestPopup(false)}>
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
