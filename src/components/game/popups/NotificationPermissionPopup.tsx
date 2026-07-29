/**
 * NotificationPermissionPopup — Pré-prompt maison avant le prompt système
 * de permission notifications. Explique la valeur (invitations de parties,
 * récompenses, classement) avant de demander. Basé sur GamePopup.
 */

import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GameButton } from '@/components/ui/GameButton';
import { GamePopup } from '@/components/ui/GamePopup';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

interface NotificationPermissionPopupProps {
  visible: boolean;
  /** L'utilisateur veut activer → déclenche le prompt système. */
  onAccept: () => void;
  /** « Plus tard » — re-proposé plus tard. */
  onDismiss: () => void;
}

export const NotificationPermissionPopup = memo(function NotificationPermissionPopup({
  visible,
  onAccept,
  onDismiss,
}: NotificationPermissionPopupProps) {
  const { t } = useTranslation();

  return (
    <GamePopup
      visible={visible}
      onRequestClose={onDismiss}
      header={t('pushPrompt.header')}
      title={t('pushPrompt.title')}
      icon={<Ionicons name="notifications-outline" size={58} color="#1F91D0" />}
    >
      <Text style={styles.description}>{t('pushPrompt.description')}</Text>

      <View style={styles.buttons}>
        <GameButton
          variant="yellow"
          fullWidth
          title={t('pushPrompt.accept')}
          onPress={onAccept}
        />
        <GameButton
          variant="blue"
          fullWidth
          title={t('pushPrompt.later')}
          onPress={onDismiss}
        />
      </View>
    </GamePopup>
  );
});

const styles = StyleSheet.create({
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[4],
    paddingHorizontal: SPACING[2],
  },
  buttons: {
    width: '100%',
    gap: SPACING[3],
  },
});
