import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Card } from '@/components/ui/Card';

interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  comingSoon?: boolean;
}

const GAME_MODES: GameMode[] = [
  {
    id: 'solo',
    title: 'Solo vs IA',
    description: 'Affronte notre intelligence artificielle et améliore tes compétences entrepreneuriales',
    icon: 'game-controller',
    color: COLORS.events.quiz,
    route: '/(game)/local-setup?mode=solo',
  },
  {
    id: 'local',
    title: 'Multijoueur Local',
    description: 'Joue avec 2 à 4 amis sur le même appareil, chacun son tour',
    icon: 'people',
    color: COLORS.events.funding,
    route: '/(game)/local-setup?mode=local',
  },
  {
    id: 'online',
    title: 'Multijoueur Online',
    description: 'Rejoins ou crée une partie en ligne et affronte des joueurs du monde entier',
    icon: 'globe',
    color: COLORS.events.opportunity,
    route: '/(game)/online-setup',
    comingSoon: false,
  },
];

export default function ModeSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  const handleSelectMode = (route: string, comingSoon?: boolean) => {
    if (comingSoon) {
      // TODO: Show coming soon toast
      return;
    }
    router.push(route as Parameters<typeof router.push>[0]);
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[4],
        }}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Pressable
            onPress={handleBack}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: SPACING[4],
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
                marginLeft: SPACING[2],
              }}
            >
              Retour
            </Text>
          </Pressable>

          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.text,
              marginBottom: SPACING[2],
            }}
          >
            Choisis ton mode
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.base,
              color: COLORS.textSecondary,
            }}
          >
            Sélectionne comment tu veux jouer
          </Text>
        </Animated.View>

        {/* Game Modes */}
        <View style={{ flex: 1, gap: SPACING[4] }}>
          {GAME_MODES.map((mode, index) => (
            <Animated.View
              key={mode.id}
              entering={FadeInDown.delay(200 + index * 100).duration(500)}
            >
              <Pressable
                onPress={() => handleSelectMode(mode.route, mode.comingSoon)}
                style={{ opacity: mode.comingSoon ? 0.5 : 1 }}
              >
                <Card
                  variant="elevated"
                  padding={5}
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: mode.color,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: mode.color,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: SPACING[4],
                      }}
                    >
                      <Ionicons
                        name={mode.icon as keyof typeof Ionicons.glyphMap}
                        size={28}
                        color={COLORS.white}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                          style={{
                            fontFamily: FONTS.title,
                            fontSize: FONT_SIZES.lg,
                            color: COLORS.text,
                          }}
                        >
                          {mode.title}
                        </Text>
                        {mode.comingSoon && (
                          <View
                            style={{
                              backgroundColor: COLORS.primary,
                              paddingHorizontal: SPACING[2],
                              paddingVertical: 2,
                              borderRadius: 4,
                              marginLeft: SPACING[2],
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: FONTS.bodySemiBold,
                                fontSize: FONT_SIZES.xs,
                                color: COLORS.background,
                              }}
                            >
                              Bientôt
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.textSecondary,
                          marginTop: SPACING[1],
                        }}
                      >
                        {mode.description}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={COLORS.textSecondary}
                    />
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}
