import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore, useSettingsStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  showArrow?: boolean;
}

function SettingRow({
  icon,
  iconColor = COLORS.primary,
  title,
  subtitle,
  value,
  onToggle,
  onPress,
  showArrow,
}: SettingRowProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const handlePress = () => {
    if (onPress) {
      if (hapticsEnabled) {
        Haptics.selectionAsync();
      }
      onPress();
    }
  };

  const handleToggle = (newValue: boolean) => {
    if (onToggle) {
      if (hapticsEnabled) {
        Haptics.selectionAsync();
      }
      onToggle(newValue);
    }
  };

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING[3],
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: `${iconColor}20`,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: SPACING[3],
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.bodySemiBold,
            fontSize: FONT_SIZES.base,
            color: COLORS.text,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.sm,
              color: COLORS.textSecondary,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {onToggle !== undefined && (
        <Switch
          value={value}
          onValueChange={handleToggle}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      )}
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={handlePress}>{content}</Pressable>;
  }

  return content;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    soundEnabled,
    hapticsEnabled,
    notifications,
    setSoundEnabled,
    setHapticsEnabled,
    setNotifications,
  } = useSettingsStore();

  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
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
            }}
          >
            Paramètres
          </Text>
        </Animated.View>

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.sm,
              color: COLORS.textSecondary,
              marginBottom: SPACING[2],
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Compte
          </Text>
          <Card style={{ marginBottom: SPACING[4] }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: SPACING[2],
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: COLORS.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: SPACING[3],
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES.lg,
                    color: COLORS.white,
                  }}
                >
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.base,
                    color: COLORS.text,
                  }}
                >
                  {user?.displayName || 'Utilisateur'}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  {user?.isGuest ? 'Compte invité' : user?.email || ''}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Audio & Feedback Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.sm,
              color: COLORS.textSecondary,
              marginBottom: SPACING[2],
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Audio & Retours
          </Text>
          <Card style={{ marginBottom: SPACING[4] }}>
            <SettingRow
              icon="volume-high"
              title="Sons"
              subtitle="Effets sonores du jeu"
              value={soundEnabled}
              onToggle={setSoundEnabled}
            />
            <View style={{ height: 1, backgroundColor: COLORS.border }} />
            <SettingRow
              icon="phone-portrait"
              title="Vibrations"
              subtitle="Retours haptiques"
              value={hapticsEnabled}
              onToggle={setHapticsEnabled}
            />
            <View style={{ height: 1, backgroundColor: COLORS.border }} />
            <SettingRow
              icon="notifications"
              title="Notifications"
              subtitle="Alertes et rappels"
              value={notifications}
              onToggle={setNotifications}
            />
          </Card>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.sm,
              color: COLORS.textSecondary,
              marginBottom: SPACING[2],
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            A propos
          </Text>
          <Card style={{ marginBottom: SPACING[4] }}>
            <SettingRow
              icon="help-circle"
              iconColor={COLORS.info}
              title="Aide"
              subtitle="FAQ et tutoriels"
              onPress={() => router.push('/help')}
              showArrow
            />
            <View style={{ height: 1, backgroundColor: COLORS.border }} />
            <SettingRow
              icon="time"
              iconColor={COLORS.warning}
              title="Historique"
              subtitle="Voir tes parties passées"
              onPress={() => router.push('/history')}
              showArrow
            />
            <View style={{ height: 1, backgroundColor: COLORS.border }} />
            <SettingRow
              icon="document-text"
              iconColor={COLORS.textSecondary}
              title="Conditions d'utilisation"
              onPress={() => {}}
              showArrow
            />
            <View style={{ height: 1, backgroundColor: COLORS.border }} />
            <SettingRow
              icon="shield-checkmark"
              iconColor={COLORS.textSecondary}
              title="Politique de confidentialité"
              onPress={() => {}}
              showArrow
            />
          </Card>
        </Animated.View>

        {/* Version */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.sm,
              color: COLORS.textSecondary,
              textAlign: 'center',
              marginBottom: SPACING[4],
            }}
          >
            Startup Ludo v1.0.0
          </Text>
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Button
            title="Se déconnecter"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleLogout}
            leftIcon={<Ionicons name="log-out" size={20} color={COLORS.error} />}
            style={{ borderColor: COLORS.error }}
            textStyle={{ color: COLORS.error }}
          />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}
