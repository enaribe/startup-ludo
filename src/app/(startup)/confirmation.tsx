import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSettingsStore } from '@/stores';

const SECTOR_INFO: Record<string, { name: string; icon: string }> = {
  tech: { name: 'Technologie', icon: 'hardware-chip' },
  agri: { name: 'Agriculture', icon: 'leaf' },
  health: { name: 'Santé', icon: 'medkit' },
  education: { name: 'Éducation', icon: 'school' },
  finance: { name: 'Finance', icon: 'cash' },
  commerce: { name: 'Commerce', icon: 'cart' },
};

export default function StartupConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const params = useLocalSearchParams<{
    startupName?: string;
    startupSector?: string;
  }>();

  const startupName = params.startupName || 'Nouvelle Startup';
  const sectorId = params.startupSector || 'tech';
  const sectorInfo = SECTOR_INFO[sectorId] || SECTOR_INFO.tech;

  useEffect(() => {
    // Celebration haptic
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [hapticsEnabled]);

  const handleViewPortfolio = () => {
    router.replace('/(tabs)/portfolio');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
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
          justifyContent: 'center',
        }}
      >
        {/* Success Animation */}
        <Animated.View
          entering={ZoomIn.delay(100).duration(600)}
          style={{ alignItems: 'center', marginBottom: SPACING[8] }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: COLORS.success,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: COLORS.success,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
            }}
          >
            <Ionicons name="checkmark" size={60} color={COLORS.white} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={{ alignItems: 'center', marginBottom: SPACING[6] }}
        >
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['3xl'],
              color: COLORS.text,
              textAlign: 'center',
              marginBottom: SPACING[2],
            }}
          >
            Félicitations !
          </Text>

          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.md,
              color: COLORS.textSecondary,
              textAlign: 'center',
            }}
          >
            Ta startup a été créée avec succès
          </Text>
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Card variant="elevated" padding={5}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: COLORS.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: SPACING[4],
                }}
              >
                <Ionicons
                  name={sectorInfo.icon as keyof typeof Ionicons.glyphMap}
                  size={32}
                  color={COLORS.background}
                />
              </View>

              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES.xl,
                  color: COLORS.text,
                  marginBottom: SPACING[1],
                  textAlign: 'center',
                }}
              >
                {startupName}
              </Text>

              <View
                style={{
                  backgroundColor: `${COLORS.primary}20`,
                  paddingHorizontal: SPACING[3],
                  paddingVertical: SPACING[1],
                  borderRadius: 12,
                  marginBottom: SPACING[4],
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.xs,
                    color: COLORS.primary,
                  }}
                >
                  {sectorInfo.name}
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.base,
                  color: COLORS.textSecondary,
                  textAlign: 'center',
                  marginBottom: SPACING[4],
                }}
              >
                Tu peux maintenant développer ta startup en jouant et en gagnant des jetons !
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: SPACING[6],
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontFamily: FONTS.title,
                      fontSize: FONT_SIZES['2xl'],
                      color: COLORS.primary,
                    }}
                  >
                    1
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: FONT_SIZES.xs,
                      color: COLORS.textSecondary,
                    }}
                  >
                    Niveau
                  </Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontFamily: FONTS.title,
                      fontSize: FONT_SIZES['2xl'],
                      color: COLORS.primary,
                    }}
                  >
                    0
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: FONT_SIZES.xs,
                      color: COLORS.textSecondary,
                    }}
                  >
                    Jetons investis
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Actions */}
        <Animated.View
          entering={FadeInUp.delay(800).duration(600)}
          style={{ gap: SPACING[3] }}
        >
          <Button
            title="Voir mon portfolio"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleViewPortfolio}
          />

          <Button
            title="Retour à l'accueil"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleGoHome}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
