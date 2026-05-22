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

  const {
    soundEnabled,
    musicEnabled,
    hapticsEnabled,
    notifications,
    setSoundEnabled,
    setMusicEnabled,
    setHapticsEnabled,
    setNotifications,
  } = useSettingsStore();

  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const isGuest = user?.isGuest ?? true;

  const displayName = isGuest ? 'Invité' : user?.displayName || profile?.displayName || 'Utilisateur';
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
      'Revoir le tutoriel',
      'Le guide se relancera au début de ta prochaine partie. Lancer une partie maintenant ?',
      [
        { text: 'Plus tard', style: 'cancel' },
        {
          text: 'Lancer une partie',
          onPress: () => router.push('/(game)/mode-selection'),
        },
      ]
    );
  }, [resetTutorial, router]);

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
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de supprimer le compte',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  }, [deleteAccount, router]);

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      {/* Header fixe — aligné sur profil.tsx / network.tsx */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>PARAMÈTRES</Text>
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
        <SettingSection title="COMPTE" delay={100}>
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
                    <Text style={styles.guestBadgeText}>INVITÉ</Text>
                  </View>
                )}
              </View>
              <Text style={styles.accountEmail} numberOfLines={2}>
                {isGuest
                  ? 'Crée un compte pour sauvegarder ta progression'
                  : user?.email || ''}
              </Text>
            </View>
          </View>
        </SettingSection>

        {/* Section Audio & retours */}
        <SettingSection title="AUDIO & RETOURS" delay={180}>
          <SettingRow
            icon="volume-high"
            iconColor="#3498DB"
            title="Sons"
            subtitle="Effets sonores du jeu"
            value={soundEnabled}
            onToggle={setSoundEnabled}
          />
          <SettingRow
            icon="musical-notes"
            iconColor={COLORS.primary}
            title="Musique"
            subtitle="Musique de fond"
            value={musicEnabled}
            onToggle={setMusicEnabled}
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

        {/* Section À propos */}
        <SettingSection title="À PROPOS" delay={260}>
          <SettingRow
            icon="help-circle"
            iconColor="#1ABC9C"
            title="Aide"
            subtitle="FAQ et tutoriels"
            onPress={() => router.push('/help')}
            showArrow
          />
          <SettingRow
            icon="school"
            iconColor="#3498DB"
            title="Revoir le tutoriel"
            subtitle="Relance le guide à ta prochaine partie"
            onPress={handleReplayTutorial}
            showArrow
          />
          <SettingRow
            icon="stats-chart"
            iconColor="#F39C12"
            title="Statistiques"
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

        {/* Zone de danger — masquée pour les invités */}
        {!isGuest && (
          <SettingSection title="ZONE DE DANGER" delay={340}>
            <SettingRow
              icon="trash"
              iconColor="#E74C3C"
              title="Supprimer mon compte"
              subtitle="Cette action est irréversible"
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
                title="CRÉER UN COMPTE"
                variant="yellow"
                fullWidth
                onPress={() => router.push('/(auth)/register')}
              />
              <GameButton
                title="SE CONNECTER"
                variant="blue"
                fullWidth
                onPress={() => router.push('/(auth)/login')}
                style={styles.secondaryAuthButton}
              />
            </>
          ) : (
            <GameButton
              title="SE DÉCONNECTER"
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

            <Text style={styles.modalTitle}>Supprimer mon compte</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir supprimer votre compte ?{'\n\n'}
              Cette action est <Text style={styles.modalWarning}>irréversible</Text> et entraînera la perte de :
            </Text>

            <View style={styles.modalList}>
              {[
                'Toutes vos parties et statistiques',
                'Votre progression dans les challenges',
                "Votre portfolio d'entreprises",
                'Tous vos succès et récompenses',
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
                <Text style={styles.modalButtonTextCancel}>Annuler</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonTextDelete}>
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
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
});
