import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';
import { GameButton } from '@/components/ui/GameButton';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';

interface QuitConfirmPopupProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isOnline?: boolean;
}

export const QuitConfirmPopup = memo(function QuitConfirmPopup({
  visible,
  onCancel,
  onConfirm,
  isOnline = false,
}: QuitConfirmPopupProps) {
  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      closeOnBackdrop={true}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={FadeIn.duration(280)} style={styles.card}>
        <View style={styles.content}>
          {/* Icône */}
          <View style={styles.iconCircle}>
            <Ionicons name="exit-outline" size={40} color={COLORS.error} />
          </View>

          {/* Titre */}
          <Text style={styles.title}>QUITTER ?</Text>

          {/* Description */}
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>
              {isOnline
                ? 'Si tu quittes, tu perds la partie par forfait.'
                : 'Ta progression sera perdue si tu quittes maintenant.'}
            </Text>
          </View>

          {/* Boutons */}
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <GameButton
                title="Annuler"
                onPress={onCancel}
                variant="blue"
                fullWidth
              />
            </View>
            <View style={styles.buttonWrapper}>
              <GameButton
                title="Quitter"
                onPress={onConfirm}
                variant="red"
                fullWidth
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    maxWidth: 340,
    width: '90%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  content: {
    paddingTop: SPACING[6],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(244, 67, 54, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.error,
    letterSpacing: 2,
    marginBottom: SPACING[4],
  },
  descriptionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[5],
  },
  description: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING[3],
    width: '100%',
  },
  buttonWrapper: {
    flex: 1,
  },
});
