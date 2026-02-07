/**
 * SettingsScreen - Écran des paramètres
 *
 * Design basé sur le système de design avec RadialBackground,
 * GradientBorder, GameButton et les styles cohérents.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RadialBackground } from '@/components/ui/RadialBackground';
import { DynamicGradientBorder } from '@/components/ui/GradientBorder';
import { GameButton } from '@/components/ui/GameButton';
import { useAuthStore, useSettingsStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import des assets
const shapeImage = require('@/../assets/images/shape.png');

// Padding horizontal des écrans (design system)
const SCREEN_PADDING_H = 18;

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  showArrow?: boolean;
  isLast?: boolean;
}

const SettingRow = memo(function SettingRow({
  icon,
  iconColor = '#FFBC40',
  title,
  subtitle,
  value,
  onToggle,
  onPress,
  showArrow,
  isLast = false,
}: SettingRowProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const handlePress = useCallback(() => {
    if (onPress) {
      if (hapticsEnabled) {
        Haptics.selectionAsync();
      }
      onPress();
    }
  }, [onPress, hapticsEnabled]);

  const handleToggle = useCallback((newValue: boolean) => {
    if (onToggle) {
      if (hapticsEnabled) {
        Haptics.selectionAsync();
      }
      onToggle(newValue);
    }
  }, [onToggle, hapticsEnabled]);

  const content = (
    <View style={[styles.settingRow, !isLast && styles.settingRowBorder]}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {onToggle !== undefined && (
        <Switch
          value={value}
          onValueChange={handleToggle}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#FFBC40' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="rgba(255, 255, 255, 0.2)"
        />
      )}
      {showArrow && (
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => pressed && styles.settingRowPressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
});

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

const SettingSection = memo(function SettingSection({
  title,
  children,
  delay = 200,
}: SettingSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500)}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <DynamicGradientBorder
        boxWidth={SCREEN_WIDTH - SCREEN_PADDING_H * 2}
        borderRadius={16}
        fill="rgba(0, 0, 0, 0.3)"
        style={styles.sectionCard}
      >
        <View style={styles.sectionContent}>
          {children}
        </View>
      </DynamicGradientBorder>
    </Animated.View>
  );
});

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

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/');
  }, [logout, router]);

  return (
    <View style={styles.container}>
      {/* Fond radial */}
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      {/* Shape (rayons) en arrière-plan */}
      <View style={styles.shapeContainer}>
        <Image
          source={shapeImage}
          style={styles.shapeImage}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + SPACING[4],
            paddingBottom: insets.bottom + SPACING[6],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.header}
        >
          <Pressable onPress={handleBack} style={styles.backButton}>
            <View style={styles.backIconContainer}>
              <Ionicons name="arrow-back" size={20} color="#FFBC40" />
            </View>
            <Text style={styles.backText}>Retour</Text>
          </Pressable>

          <Text style={styles.title}>PARAMÈTRES</Text>
        </Animated.View>

        {/* Account Section */}
        <SettingSection title="COMPTE" delay={200}>
          <View style={styles.accountRow}>
            <View style={styles.avatarContainer}>
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={styles.avatar}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>
                {user?.displayName || 'Utilisateur'}
              </Text>
              <Text style={styles.accountEmail}>
                {user?.isGuest ? 'Compte invité' : user?.email || ''}
              </Text>
            </View>
            <Pressable style={styles.editButton}>
              <Ionicons name="pencil" size={16} color="#FFBC40" />
            </Pressable>
          </View>
        </SettingSection>

        {/* Audio & Feedback Section */}
        <SettingSection title="AUDIO & RETOURS" delay={300}>
          <SettingRow
            icon="volume-high"
            iconColor="#3498DB"
            title="Sons"
            subtitle="Effets sonores du jeu"
            value={soundEnabled}
            onToggle={setSoundEnabled}
          />
          <SettingRow
            icon="phone-portrait"
            iconColor="#9B59B6"
            title="Vibrations"
            subtitle="Retours haptiques"
            value={hapticsEnabled}
            onToggle={setHapticsEnabled}
          />
          <SettingRow
            icon="notifications"
            iconColor="#E67E22"
            title="Notifications"
            subtitle="Alertes et rappels"
            value={notifications}
            onToggle={setNotifications}
            isLast
          />
        </SettingSection>

        {/* About Section */}
        <SettingSection title="À PROPOS" delay={400}>
          <SettingRow
            icon="help-circle"
            iconColor="#1ABC9C"
            title="Aide"
            subtitle="FAQ et tutoriels"
            onPress={() => router.push('/help')}
            showArrow
          />
          <SettingRow
            icon="time"
            iconColor="#F39C12"
            title="Historique"
            subtitle="Voir tes parties passées"
            onPress={() => router.push('/history')}
            showArrow
          />
          <SettingRow
            icon="document-text"
            iconColor="#95A5A6"
            title="Conditions d'utilisation"
            onPress={() => {}}
            showArrow
          />
          <SettingRow
            icon="shield-checkmark"
            iconColor="#27AE60"
            title="Politique de confidentialité"
            onPress={() => {}}
            showArrow
            isLast
          />
        </SettingSection>

        {/* Version */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          style={styles.versionContainer}
        >
          <Text style={styles.versionText}>Startup Ludo v1.0.0</Text>
          <Text style={styles.copyrightText}>by concree</Text>
        </Animated.View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Logout Button */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.logoutContainer}
        >
          <GameButton
            title="SE DÉCONNECTER"
            variant="red"
            fullWidth
            onPress={handleLogout}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shapeContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    top: -Dimensions.get('window').height * 0.4,
  },
  shapeImage: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    opacity: 0.1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_PADDING_H,
  },
  header: {
    marginBottom: SPACING[6],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  backIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[2],
  },
  backText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  section: {
    marginBottom: SPACING[5],
  },
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
    marginBottom: SPACING[2],
    marginLeft: SPACING[1],
  },
  sectionCard: {
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionContent: {
    padding: SPACING[4],
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingRowPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: '#FFFFFF',
  },
  settingSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  arrowContainer: {
    marginLeft: SPACING[2],
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFBC40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#0A1929',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
  },
  accountEmail: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: SPACING[4],
  },
  versionText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  copyrightText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: SPACING[1],
  },
  spacer: {
    flex: 1,
    minHeight: SPACING[6],
  },
  logoutContainer: {
    marginTop: SPACING[4],
  },
});
