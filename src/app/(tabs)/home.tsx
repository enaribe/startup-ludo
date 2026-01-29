import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore, useUserStore } from '@/stores';
import { getRankFromXP, getLevelFromXP, getRankProgress, formatXP } from '@/config/progression';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);

  // Calculs de progression
  const totalXP = profile?.xp ?? 0;
  const rankInfo = getRankFromXP(totalXP);
  const levelInfo = getLevelFromXP(totalXP);
  const rankProgress = getRankProgress(totalXP);

  // Stats du portfolio
  const startupsCount = profile?.startups?.length ?? 0;
  const portfolioValue = profile?.startups?.reduce((sum, s) => sum + s.tokensInvested, 0) ?? 0;

  const isGuest = user?.isGuest ?? true;
  const displayName = user?.displayName || profile?.displayName || 'Entrepreneur';

  const handlePlay = () => {
    router.push('/(game)/mode-selection');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0C243E' }}>
      {/* Background Gradient Radial */}
      <LinearGradient
        colors={['#194F8A', '#0C243E']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header Fixe Semi-transparent */}
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
          backgroundColor: 'rgba(12, 36, 62, 0.85)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 188, 64, 0.1)',
        }}
      >
        {/* Badge Invité ou espace */}
        <View style={{ width: 70 }}>
          {isGuest && (
            <View
              style={{
                backgroundColor: 'rgba(255, 188, 64, 0.15)',
                paddingHorizontal: SPACING[2],
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 188, 64, 0.3)',
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: 10,
                  color: '#FFBC40',
                  textAlign: 'center',
                }}
              >
                INVITÉ
              </Text>
            </View>
          )}
        </View>

        {/* Logo Centré */}
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES.lg,
            color: '#FFBC40',
            letterSpacing: 1,
          }}
        >
          STARTUP LUDO
        </Text>

        {/* Bouton Paramètres */}
        <Pressable
          onPress={() => router.push('/settings')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="settings-outline" size={20} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 70,
          paddingBottom: SPACING[6],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profil Utilisateur */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ marginBottom: SPACING[5], marginTop: SPACING[4] }}
        >
          <Pressable
            onPress={() => router.push('/(tabs)/profil')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 20,
              padding: SPACING[4],
              borderWidth: 1,
              borderColor: 'rgba(255, 188, 64, 0.15)',
            }}
          >
            <Avatar
              name={displayName}
              source={user?.photoURL}
              size="lg"
              showBorder
            />

            <View style={{ flex: 1, marginLeft: SPACING[4] }}>
              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES.xl,
                  color: COLORS.text,
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {displayName}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
                {/* Badge Rang */}
                <View
                  style={{
                    backgroundColor: rankInfo.color,
                    paddingHorizontal: SPACING[2],
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodySemiBold,
                      fontSize: 10,
                      color: '#0C243E',
                    }}
                  >
                    {rankInfo.title.toUpperCase()}
                  </Text>
                </View>

                {/* Niveau */}
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  Niveau {levelInfo.level}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* Grille Statistiques */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={{ marginBottom: SPACING[5] }}
        >
          <View style={{ flexDirection: 'row', gap: SPACING[3], marginBottom: SPACING[3] }}>
            {/* Entreprises créées */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: SPACING[4],
                borderWidth: 1,
                borderColor: 'rgba(255, 188, 64, 0.1)',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 188, 64, 0.15)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: SPACING[2],
                }}
              >
                <Ionicons name="business" size={18} color="#FFBC40" />
              </View>
              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES['2xl'],
                  color: COLORS.text,
                }}
              >
                {startupsCount}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.xs,
                  color: COLORS.textSecondary,
                }}
              >
                Entreprises
              </Text>
            </View>

            {/* Valorisation Portfolio */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: SPACING[4],
                borderWidth: 1,
                borderColor: 'rgba(255, 188, 64, 0.1)',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(76, 175, 80, 0.15)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: SPACING[2],
                }}
              >
                <Ionicons name="diamond" size={18} color="#4CAF50" />
              </View>
              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES['2xl'],
                  color: COLORS.text,
                }}
              >
                {portfolioValue}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.xs,
                  color: COLORS.textSecondary,
                }}
              >
                Valorisation
              </Text>
            </View>
          </View>

          {/* Barre XP */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: SPACING[4],
              borderWidth: 1,
              borderColor: 'rgba(255, 188, 64, 0.1)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING[2],
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={16} color="#FFBC40" style={{ marginRight: 6 }} />
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.text,
                  }}
                >
                  Progression XP
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.sm,
                  color: '#FFBC40',
                }}
              >
                {formatXP(totalXP)} XP
              </Text>
            </View>

            {/* Barre de progression */}
            <View
              style={{
                height: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${rankProgress}%`,
                  backgroundColor: '#FFBC40',
                  borderRadius: 4,
                }}
              />
            </View>

            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
                marginTop: SPACING[1],
              }}
            >
              {rankProgress}% vers le prochain rang
            </Text>
          </View>
        </Animated.View>

        {/* Bouton Nouvelle Partie */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={{ marginBottom: SPACING[5] }}
        >
          <Pressable onPress={handlePlay}>
            <LinearGradient
              colors={['#FFBC40', '#F5A623']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 20,
                padding: SPACING[4],
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#FFBC40',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: 'rgba(12, 36, 62, 0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: SPACING[4],
                }}
              >
                <Ionicons name="play" size={28} color="#0C243E" />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES.xl,
                    color: '#0C243E',
                    marginBottom: 2,
                  }}
                >
                  Nouvelle partie
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: 'rgba(12, 36, 62, 0.7)',
                  }}
                >
                  Lance-toi dans l'aventure
                </Text>
              </View>

              <Ionicons name="arrow-forward-circle" size={32} color="#0C243E" />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Challenge AgriTech en Vedette */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES.lg,
              color: COLORS.text,
              marginBottom: SPACING[3],
            }}
          >
            Challenge en vedette
          </Text>

          <Pressable
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(76, 175, 80, 0.3)',
            }}
          >
            <LinearGradient
              colors={['rgba(76, 175, 80, 0.2)', 'rgba(255, 188, 64, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: SPACING[4] }}
            >
              {/* Badge AgriTech */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[3] }}>
                <LinearGradient
                  colors={['#4CAF50', '#FFBC40']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: SPACING[3],
                    paddingVertical: SPACING[1],
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="leaf" size={14} color="#0C243E" style={{ marginRight: 4 }} />
                  <Text
                    style={{
                      fontFamily: FONTS.bodySemiBold,
                      fontSize: FONT_SIZES.xs,
                      color: '#0C243E',
                    }}
                  >
                    AGRITECH
                  </Text>
                </LinearGradient>

                <View
                  style={{
                    backgroundColor: 'rgba(255, 188, 64, 0.2)',
                    paddingHorizontal: SPACING[2],
                    paddingVertical: 4,
                    borderRadius: 8,
                    marginLeft: SPACING[2],
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodySemiBold,
                      fontSize: 10,
                      color: '#FFBC40',
                    }}
                  >
                    NOUVEAU
                  </Text>
                </View>
              </View>

              {/* Titre et description */}
              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES.xl,
                  color: COLORS.text,
                  marginBottom: SPACING[1],
                }}
              >
                Révolution Agricole
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING[4],
                }}
              >
                Développe une startup qui transforme l'agriculture en Afrique
              </Text>

              {/* Récompenses et participants */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 188, 64, 0.15)',
                      paddingHorizontal: SPACING[2],
                      paddingVertical: SPACING[1],
                      borderRadius: 8,
                      marginRight: SPACING[2],
                    }}
                  >
                    <Ionicons name="star" size={14} color="#FFBC40" style={{ marginRight: 4 }} />
                    <Text
                      style={{
                        fontFamily: FONTS.bodySemiBold,
                        fontSize: FONT_SIZES.sm,
                        color: '#FFBC40',
                      }}
                    >
                      +500 XP
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      paddingHorizontal: SPACING[2],
                      paddingVertical: SPACING[1],
                      borderRadius: 8,
                    }}
                  >
                    <Ionicons name="gift" size={14} color="#4CAF50" style={{ marginRight: 4 }} />
                    <Text
                      style={{
                        fontFamily: FONTS.bodySemiBold,
                        fontSize: FONT_SIZES.sm,
                        color: '#4CAF50',
                      }}
                    >
                      Récompenses
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="people" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: FONT_SIZES.sm,
                      color: COLORS.textSecondary,
                    }}
                  >
                    1.2k participants
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
