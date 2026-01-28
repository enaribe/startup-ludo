import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores';

const GAME_MODES = [
  {
    id: 'solo',
    title: 'Solo vs IA',
    description: 'Affronte notre IA entrepreneuriale',
    icon: 'game-controller',
    color: COLORS.events.quiz,
  },
  {
    id: 'local',
    title: 'Multijoueur Local',
    description: 'Joue avec tes amis sur le même appareil',
    icon: 'people',
    color: COLORS.events.funding,
  },
  {
    id: 'online',
    title: 'Multijoueur Online',
    description: 'Rejoins des joueurs du monde entier',
    icon: 'globe',
    color: COLORS.events.opportunity,
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const handlePlayMode = (mode: string) => {
    router.push(`/(game)/mode-selection?mode=${mode}`);
  };

  const handlePlay = () => {
    router.push('/(game)/mode-selection');
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING[4],
          paddingBottom: SPACING[4],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING[6],
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.base,
                color: COLORS.textSecondary,
              }}
            >
              Bienvenue,
            </Text>
            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES['2xl'],
                color: COLORS.text,
              }}
            >
              {user?.displayName || 'Entrepreneur'}
            </Text>
          </View>

          <Pressable onPress={() => router.push('/(tabs)/profil')}>
            <Avatar
              name={user?.displayName || 'Invité'}
              source={user?.photoURL}
              size="md"
              showBorder
            />
          </Pressable>
        </Animated.View>

        {/* Play Button */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Card variant="elevated" padding={6}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: COLORS.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: SPACING[4],
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 15,
                }}
              >
                <Ionicons name="play" size={40} color={COLORS.background} />
              </View>

              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES.xl,
                  color: COLORS.text,
                  marginBottom: SPACING[2],
                }}
              >
                Prêt à jouer ?
              </Text>

              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.base,
                  color: COLORS.textSecondary,
                  textAlign: 'center',
                  marginBottom: SPACING[4],
                }}
              >
                Lance une partie et deviens le meilleur entrepreneur !
              </Text>

              <Button
                title="Jouer maintenant"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handlePlay}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Game Modes */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES.lg,
              color: COLORS.text,
              marginBottom: SPACING[4],
            }}
          >
            Modes de jeu
          </Text>

          <View style={{ gap: SPACING[3] }}>
            {GAME_MODES.map((mode, index) => (
              <Animated.View
                key={mode.id}
                entering={FadeInDown.delay(400 + index * 100).duration(500)}
              >
                <Pressable onPress={() => handlePlayMode(mode.id)}>
                  <Card
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: mode.color,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: SPACING[4],
                      }}
                    >
                      <Ionicons
                        name={mode.icon as keyof typeof Ionicons.glyphMap}
                        size={24}
                        color={COLORS.white}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.bodySemiBold,
                          fontSize: FONT_SIZES.md,
                          color: COLORS.text,
                        }}
                      >
                        {mode.title}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.textSecondary,
                        }}
                      >
                        {mode.description}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </Card>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={{ marginTop: SPACING[6] }}
        >
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES.lg,
              color: COLORS.text,
              marginBottom: SPACING[4],
            }}
          >
            Tes statistiques
          </Text>

          <View style={{ flexDirection: 'row', gap: SPACING[3] }}>
            <StatCard title="Parties" value="0" icon="game-controller" />
            <StatCard title="Victoires" value="0" icon="trophy" />
            <StatCard title="Jetons" value="0" icon="cash" />
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', padding: SPACING[4] }}>
      <Ionicons name={icon} size={24} color={COLORS.primary} />
      <Text
        style={{
          fontFamily: FONTS.title,
          fontSize: FONT_SIZES.xl,
          color: COLORS.text,
          marginTop: SPACING[2],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: FONT_SIZES.xs,
          color: COLORS.textSecondary,
        }}
      >
        {title}
      </Text>
    </Card>
  );
}
