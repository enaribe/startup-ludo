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
import { EmptyState } from '@/components/common/EmptyState';
import { useUserStore } from '@/stores';

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);

  const startups = profile?.startups ?? [];

  const handleCreateStartup = () => {
    router.push('/(startup)/inspiration-cards');
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
          flexGrow: 1,
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
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES['2xl'],
                color: COLORS.text,
              }}
            >
              Mon Portfolio
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.base,
                color: COLORS.textSecondary,
              }}
            >
              {startups.length} startup{startups.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <Button
            title="+ Créer"
            variant="primary"
            size="sm"
            onPress={handleCreateStartup}
          />
        </Animated.View>

        {/* Content */}
        {startups.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <EmptyState
              icon="rocket-outline"
              title="Aucune startup"
              description="Crée ta première startup en jouant et en gagnant des jetons !"
              actionLabel="Créer une startup"
              onAction={handleCreateStartup}
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{ gap: SPACING[4] }}
          >
            {startups.map((startup, index) => (
              <Animated.View
                key={startup.id}
                entering={FadeInDown.delay(300 + index * 100).duration(500)}
              >
                <Pressable onPress={() => {}}>
                  <Card>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          backgroundColor: COLORS.primary,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: SPACING[4],
                        }}
                      >
                        <Ionicons
                          name="business"
                          size={28}
                          color={COLORS.background}
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
                          {startup.name}
                        </Text>
                        <Text
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: FONT_SIZES.sm,
                            color: COLORS.textSecondary,
                          }}
                        >
                          {startup.sector}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: SPACING[1],
                          }}
                        >
                          <Ionicons
                            name="star"
                            size={14}
                            color={COLORS.primary}
                          />
                          <Text
                            style={{
                              fontFamily: FONTS.bodySemiBold,
                              fontSize: FONT_SIZES.sm,
                              color: COLORS.primary,
                              marginLeft: 4,
                            }}
                          >
                            Niveau {startup.level}
                          </Text>
                        </View>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={COLORS.textSecondary}
                      />
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
