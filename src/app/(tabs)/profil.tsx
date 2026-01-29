import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuthStore, useUserStore } from '@/stores';

// Mock achievements
const ACHIEVEMENTS = [
  { id: '1', icon: 'rocket', title: 'Première Partie', unlocked: true },
  { id: '2', icon: 'trophy', title: 'Première Victoire', unlocked: true },
  { id: '3', icon: 'business', title: 'Entrepreneur', unlocked: true },
  { id: '4', icon: 'star', title: '10 Victoires', unlocked: false },
  { id: '5', icon: 'diamond', title: 'Millionnaire', unlocked: false },
  { id: '6', icon: 'flame', title: 'Série de 5', unlocked: false },
];

// Menu items
const MENU_ITEMS = [
  { id: 'settings', icon: 'settings-outline', title: 'Paramètres' },
  { id: 'history', icon: 'time-outline', title: 'Historique des parties' },
  { id: 'help', icon: 'help-circle-outline', title: 'Aide & FAQ' },
];

export default function ProfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading } = useAuthStore();
  const profile = useUserStore((state) => state.profile);
  const rankInfo = useUserStore((state) => state.rankInfo);
  const levelProgress = useUserStore((state) => state.levelProgress);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleEditProfile = () => {
    // TODO: Implémenter l'édition du profil
  };

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case 'settings':
        router.push('/settings' as never);
        break;
      case 'history':
        router.push('/history' as never);
        break;
      case 'help':
        router.push('/help' as never);
        break;
    }
  };

  const handleProgressionPress = () => {
    // TODO: Naviguer vers page détaillée progression
  };

  // Progression XP
  const currentXP = levelProgress?.currentXP ?? 0;
  const xpForNextLevel = levelProgress?.xpForNext ?? 100;
  const xpProgress = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;
  const currentLevel = levelProgress?.level ?? profile?.level ?? 1;

  // Nom affiché
  const displayName = user?.displayName || profile?.displayName || 'INVITÉ';

  return (
    <View style={{ flex: 1, backgroundColor: '#0C243E' }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#194F8A', '#0C243E']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header Fixe avec bouton déconnexion */}
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
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 188, 64, 0.1)',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES['2xl'],
            color: COLORS.text,
          }}
        >
          Profil
        </Text>

        {/* Bouton Déconnexion */}
        <Pressable
          onPress={handleLogout}
          disabled={isLoading}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: SPACING[3],
            paddingVertical: SPACING[2],
            backgroundColor: 'rgba(255, 107, 107, 0.15)',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 107, 107, 0.3)',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <Ionicons name="log-out-outline" size={16} color="#FF6B6B" />
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.xs,
              color: '#FF6B6B',
              marginLeft: 4,
            }}
          >
            Déconnexion
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: SPACING[24],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte Profil Centrée */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 20,
            padding: SPACING[6],
            marginBottom: SPACING[5],
            borderWidth: 1,
            borderColor: 'rgba(255, 188, 64, 0.15)',
          }}
        >
          {/* Avatar avec bouton édition */}
          <View style={{ position: 'relative', marginBottom: SPACING[4] }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255, 188, 64, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#FFBC40',
              }}
            >
              <Text style={{ fontSize: 48 }}>
                {rankInfo?.badge || '🎓'}
              </Text>
            </View>

            {/* Bouton Édition (crayon) */}
            <Pressable
              onPress={handleEditProfile}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#FFBC40',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#0C243E',
              }}
            >
              <Ionicons name="pencil" size={16} color="#0C243E" />
            </Pressable>
          </View>

          {/* Nom en majuscules */}
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.text,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: SPACING[2],
            }}
          >
            {displayName}
          </Text>

          {/* Badge Rang */}
          <View
            style={{
              backgroundColor: `${rankInfo?.color || COLORS.primary}20`,
              paddingHorizontal: SPACING[4],
              paddingVertical: SPACING[1],
              borderRadius: 12,
              borderWidth: 1,
              borderColor: `${rankInfo?.color || COLORS.primary}40`,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.sm,
                color: rankInfo?.color || COLORS.primary,
              }}
            >
              {rankInfo?.title || profile?.rank || 'Stagiaire'}
            </Text>
          </View>
        </Animated.View>

        {/* Section Progression (cliquable) */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable onPress={handleProgressionPress}>
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: SPACING[4],
                marginBottom: SPACING[5],
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: SPACING[3],
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="trending-up" size={20} color="#FFBC40" />
                  <Text
                    style={{
                      fontFamily: FONTS.bodySemiBold,
                      fontSize: FONT_SIZES.md,
                      color: COLORS.text,
                      marginLeft: SPACING[2],
                    }}
                  >
                    Progression
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </View>

              {/* Niveau et XP */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: SPACING[2],
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  Niveau {currentLevel}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.sm,
                    color: '#FFBC40',
                  }}
                >
                  {currentXP} / {xpForNextLevel} XP
                </Text>
              </View>

              {/* Barre de progression */}
              <ProgressBar progress={xpProgress} size="md" variant="default" />
            </View>
          </Pressable>
        </Animated.View>

        {/* Grille Succès */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SPACING[3],
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
              }}
            >
              Succès
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.sm,
                color: COLORS.textSecondary,
              }}
            >
              {ACHIEVEMENTS.filter((a) => a.unlocked).length}/{ACHIEVEMENTS.length}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: SPACING[3],
              marginBottom: SPACING[5],
            }}
          >
            {ACHIEVEMENTS.map((achievement, index) => (
              <Animated.View
                key={achievement.id}
                entering={FadeInDown.delay(350 + index * 50).duration(400)}
                style={{
                  width: '30%',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: achievement.unlocked
                      ? 'rgba(255, 188, 64, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: achievement.unlocked
                      ? 'rgba(255, 188, 64, 0.4)'
                      : 'rgba(255, 255, 255, 0.1)',
                    marginBottom: SPACING[1],
                  }}
                >
                  <Ionicons
                    name={achievement.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={achievement.unlocked ? '#FFBC40' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 10,
                    color: achievement.unlocked ? COLORS.text : COLORS.textSecondary,
                    textAlign: 'center',
                  }}
                  numberOfLines={2}
                >
                  {achievement.title}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          style={{ gap: SPACING[2] }}
        >
          {MENU_ITEMS.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(550 + index * 50).duration(400)}
            >
              <Pressable
                onPress={() => handleMenuPress(item.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: SPACING[4],
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255, 188, 64, 0.15)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: SPACING[3],
                  }}
                >
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color="#FFBC40"
                  />
                </View>

                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.md,
                    color: COLORS.text,
                    flex: 1,
                  }}
                >
                  {item.title}
                </Text>

                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Stats rapides en bas */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: SPACING[6],
            paddingTop: SPACING[4],
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES.xl,
                color: '#FFBC40',
              }}
            >
              {profile?.gamesPlayed ?? 0}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              Parties
            </Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES.xl,
                color: '#4CAF50',
              }}
            >
              {profile?.gamesWon ?? 0}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              Victoires
            </Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES.xl,
                color: '#1F91D0',
              }}
            >
              {profile?.totalTokensEarned ?? 0}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              Jetons
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
