/**
 * SettingsScreen - Écran des paramètres
 *
 * Design aligné sur les autres écrans de l'app (profil, statistiques, réseau) :
 * header fixe #0A1929 arrondi, cartes DynamicGradientBorder fond rgba(0,0,0,0.35).
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RadialBackground } from '@/components/ui/RadialBackground';
import { DynamicGradientBorder } from '@/components/ui/GradientBorder';
import { GameButton } from '@/components/ui/GameButton';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore, useSettingsStore, useUserStore, useTutorialStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Largeur de contenu — alignée sur profil.tsx / network.tsx. */
const CONTENT_WIDTH = SCREEN_WIDTH - SPACING[4] * 2;

/** Version affichée — lue depuis app.json. */
const APP_VERSION = Constants.expoConfig?.version ?? '2.0.8';

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
  iconColor = COLORS.primary,
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
      if (hapticsEnabled) Haptics.selectionAsync();
      onPress();
    }
  }, [onPress, hapticsEnabled]);

  const handleToggle = useCallback((newValue: boolean) => {
    if (onToggle) {
      if (hapticsEnabled) Haptics.selectionAsync();
      onToggle(newValue);
    }
  }, [onToggle, hapticsEnabled]);

  const content = (
    <View style={[styles.settingRow, !isLast && styles.settingRowBorder]}>
      <Ionicons name={icon} size={22} color={iconColor} style={styles.settingIcon} />
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {onToggle !== undefined && (
        <Switch
          value={value}
          onValueChange={handleToggle}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: COLORS.primary }}
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
      entering={FadeInDown.delay(delay).duration(450)}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <DynamicGradientBorder
        boxWidth={CONTENT_WIDTH}
        borderRadius={16}
        fill="rgba(0, 0, 0, 0.35)"
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
  const { t } = useTranslation();

  const {
    soundEnabled,
    musicEnabled,
    hapticsEnabled,
    notifications,
    language,
    setSoundEnabled,
    setMusicEnabled,
    setHapticsEnabled,
    setNotifications,
    setLanguage,
  } = useSettingsStore();

  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const isGuest = user?.isGuest ?? true;

  const displayName = isGuest ? t('settings.guest') : user?.displayName || profile?.displayName || t('settings.user');
  const avatarUrl = profile?.avatarUrl || user?.photoURL || null;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetTutorial = useTutorialStore((s) => s.reset);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const handleReplayTutorial = useCallback(() => {
    // Réarme le tutoriel puis propose de lancer une partie pour le tester tout de suite
    resetTutorial();
    Alert.alert(
      t('settings.replayTutorial'),
      t('settings.replayTutorialMessage'),
      [
        { text: t('settings.later'), style: 'cancel' },
        {
          text: t('settings.startGame'),
          onPress: () => router.push('/(game)/mode-selection'),
        },
      ]
    );
  }, [resetTutorial, router, t]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/');
  }, [logout, router]);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      router.replace('/');
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('settings.deleteAccountError'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  }, [deleteAccount, router, t]);

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      {/* Header fixe — aligné sur profil.tsx / network.tsx */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + SPACING[8],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Compte */}
        <SettingSection title={t('settings.account')} delay={100}>
          <View style={styles.accountRow}>
            {avatarUrl ? (
              <Avatar source={avatarUrl} name={displayName} size="lg" showBorder />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {isGuest ? 'I' : displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.accountInfo}>
              <View style={styles.accountNameRow}>
                <Text style={styles.accountName} numberOfLines={1}>
                  {displayName}
                </Text>
                {isGuest && (
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>{t('settings.guestBadge')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.accountEmail} numberOfLines={2}>
                {isGuest
                  ? t('settings.guestAccountDesc')
                  : user?.email || ''}
              </Text>
            </View>
          </View>
        </SettingSection>

        {/* Section Audio & retours */}
        <SettingSection title={t('settings.audioFeedback')} delay={180}>
          <SettingRow
            icon="volume-high"
            iconColor="#3498DB"
            title={t('settings.sounds')}
            subtitle={t('settings.soundsDesc')}
            value={soundEnabled}
            onToggle={setSoundEnabled}
          />
          <SettingRow
            icon="musical-notes"
            iconColor={COLORS.primary}
            title={t('settings.music')}
            subtitle={t('settings.musicDesc')}
            value={musicEnabled}
            onToggle={setMusicEnabled}
          />
          <SettingRow
            icon="phone-portrait"
            iconColor="#9B59B6"
            title={t('settings.vibrations')}
            subtitle={t('settings.vibrationsDesc')}
            value={hapticsEnabled}
            onToggle={setHapticsEnabled}
          />
          <SettingRow
            icon="notifications"
            iconColor="#E67E22"
            title={t('settings.notifications')}
            subtitle={t('settings.notificationsDesc')}
            value={notifications}
            onToggle={setNotifications}
            isLast
          />
        </SettingSection>

        {/* Section Langue */}
        <SettingSection title={t('settings.language')} delay={220}>
          <View style={styles.langRow}>
            {([
              { code: 'fr' as const, label: 'Français' },
              { code: 'en' as const, label: 'English' },
            ]).map((l) => {
              const selected = language === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => setLanguage(l.code)}
                  style={[styles.langOption, selected && styles.langOptionSelected]}
                >
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={selected ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.langLabel, selected && styles.langLabelSelected]}>{l.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.langHint}>
            {t('settings.languageHint')}
          </Text>
        </SettingSection>

        {/* Section À propos */}
        <SettingSection title={t('settings.about')} delay={260}>
          <SettingRow
            icon="help-circle"
            iconColor="#1ABC9C"
            title={t('settings.help')}
            subtitle={t('settings.helpDesc')}
            onPress={() => router.push('/help')}
            showArrow
          />
          <SettingRow
            icon="school"
            iconColor="#3498DB"
            title={t('settings.replayTutorial')}
            subtitle={t('settings.replayTutorialDesc')}
            onPress={handleReplayTutorial}
            showArrow
          />
          <SettingRow
            icon="stats-chart"
            iconColor="#F39C12"
            title={t('settings.statistics')}
            subtitle={t('settings.historyDesc')}
            onPress={() => router.push('/history')}
            showArrow
          />
          <SettingRow
            icon="document-text"
            iconColor="#95A5A6"
            title={t('settings.terms')}
            onPress={() => {}}
            showArrow
          />
          <SettingRow
            icon="shield-checkmark"
            iconColor="#27AE60"
            title={t('settings.privacy')}
            onPress={() => {}}
            showArrow
            isLast
          />
        </SettingSection>

        {/* Zone de danger — masquée pour les invités */}
        {!isGuest && (
          <SettingSection title={t('settings.dangerZone')} delay={340}>
            <SettingRow
              icon="trash"
              iconColor="#E74C3C"
              title={t('settings.deleteAccount')}
              subtitle={t('settings.deleteAccountDesc')}
              onPress={() => setShowDeleteModal(true)}
              showArrow
              isLast
            />
          </SettingSection>
        )}

        {/* Action d'authentification */}
        <Animated.View
          entering={FadeInDown.delay(420).duration(450)}
          style={styles.logoutContainer}
        >
          {isGuest ? (
            <>
              <GameButton
                title={t('settings.createAccount')}
                variant="yellow"
                fullWidth
                onPress={() => router.push('/(auth)/register')}
              />
              <GameButton
                title={t('settings.signIn')}
                variant="blue"
                fullWidth
                onPress={() => router.push('/(auth)/login')}
                style={styles.secondaryAuthButton}
              />
            </>
          ) : (
            <GameButton
              title={t('settings.signOut')}
              variant="red"
              fullWidth
              onPress={handleLogout}
            />
          )}
        </Animated.View>

        {/* Version */}
        <Animated.View
          entering={FadeIn.delay(500).duration(450)}
          style={styles.versionContainer}
        >
          <Text style={styles.versionText}>Startup Ludo v{APP_VERSION}</Text>
          <Text style={styles.copyrightText}>by concree</Text>
        </Animated.View>
      </ScrollView>

      {/* Modale de confirmation de suppression */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="warning" size={48} color="#E74C3C" />
              </View>
            </View>

            <Text style={styles.modalTitle}>{t('settings.deleteAccount')}</Text>
            <Text style={styles.modalMessage}>
              {t('settings.deleteConfirmIntro')}{'\n\n'}
              {t('settings.deleteConfirmBefore')} <Text style={styles.modalWarning}>{t('settings.deleteConfirmIrreversible')}</Text> {t('settings.deleteConfirmAfter')}
            </Text>

            <View style={styles.modalList}>
              {[
                t('settings.deleteLossGames'),
                t('settings.deleteLossChallenges'),
                t('settings.deleteLossPortfolio'),
                t('settings.deleteLossAchievements'),
              ].map((item) => (
                <View key={item} style={styles.modalListItem}>
                  <Ionicons name="close-circle" size={16} color="#E74C3C" />
                  <Text style={styles.modalListText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonTextDelete}>
                  {isDeleting ? t('settings.deleting') : t('settings.delete')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },

  // Header — aligné sur profil.tsx / network.tsx
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backBtnPlaceholder: { width: 40, height: 40 },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING[4],
  },

  // Sections
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
  sectionContent: {
    padding: SPACING[4],
    width: '100%',
  },

  // Lignes de réglage
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
  settingIcon: {
    width: 24,
    marginRight: SPACING[3],
    textAlign: 'center',
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

  // Bloc compte
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: SPACING[3],
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#0A1929',
  },
  accountInfo: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  guestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 188, 64, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.45)',
  },
  guestBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  accountEmail: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },

  // Bas de page
  logoutContainer: {
    marginTop: SPACING[2],
  },
  secondaryAuthButton: {
    marginTop: SPACING[3],
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: SPACING[6],
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

  // Modale
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalContainer: {
    backgroundColor: '#1B314A',
    borderRadius: 20,
    padding: SPACING[6],
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  modalMessage: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: SPACING[4],
    lineHeight: 22,
  },
  modalWarning: {
    fontFamily: FONTS.bodySemiBold,
    color: '#E74C3C',
  },
  modalList: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: SPACING[3],
    marginBottom: SPACING[5],
    gap: SPACING[2],
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  modalListText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING[3],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtonDelete: {
    backgroundColor: '#E74C3C',
  },
  modalButtonTextCancel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: '#FFFFFF',
  },
  modalButtonTextDelete: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: '#FFFFFF',
  },
  langRow: {
    flexDirection: 'row',
    gap: SPACING[3],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  langOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[3],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  langOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,188,64,0.12)',
  },
  langLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  langLabelSelected: {
    color: COLORS.white,
  },
  langHint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    lineHeight: 18,
  },
});
