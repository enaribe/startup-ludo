import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { DynamicGradientBorder } from '@/components/ui/GradientBorder';
import { GameButton } from '@/components/ui/GameButton';
import { useInvitationStore } from '@/stores';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

/**
 * Popup affiché lorsqu'une invitation de partie est reçue alors que l'app est ouverte.
 * Monté une seule fois au niveau racine de l'app.
 */
export function GameInvitationPopup() {
  const router = useRouter();
  const activeInvitation = useInvitationStore((state) => state.activeInvitation);
  const accept = useInvitationStore((state) => state.accept);
  const decline = useInvitationStore((state) => state.decline);
  const dismissActive = useInvitationStore((state) => state.dismissActive);

  const handleAccept = useCallback(() => {
    if (!activeInvitation) return;
    const code = activeInvitation.roomCode;
    accept(activeInvitation);
    router.push({
      pathname: '/(game)/join-room',
      params: { code },
    });
  }, [activeInvitation, accept, router]);

  const handleDecline = useCallback(() => {
    if (!activeInvitation) return;
    decline(activeInvitation);
  }, [activeInvitation, decline]);

  if (!activeInvitation) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissActive}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissActive} />
        <Animated.View entering={SlideInDown.duration(220)} style={styles.wrapper}>
          <DynamicGradientBorder borderRadius={24} fill="#0D2744">
            <View style={styles.inner}>
              <View style={styles.iconWrap}>
                <Ionicons name="game-controller" size={32} color="#FFBC40" />
              </View>

              <Text style={styles.title}>INVITATION REÇUE</Text>
              <Text style={styles.message}>
                <Text style={styles.fromName}>{activeInvitation.fromUserName}</Text>
                {' '}t'invite à rejoindre sa partie en ligne !
              </Text>

              <View style={styles.codeRow}>
                <Text style={styles.codeLabel}>Code du salon</Text>
                <Text style={styles.codeValue}>{activeInvitation.roomCode}</Text>
              </View>

              <GameButton
                variant="yellow"
                fullWidth
                title="Rejoindre la partie"
                onPress={handleAccept}
                style={styles.primaryBtn}
              />
              <GameButton
                variant="blue"
                fullWidth
                title="Refuser"
                onPress={handleDecline}
              />
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  wrapper: {
    width: '100%',
    maxWidth: 340,
  },
  inner: {
    padding: SPACING[5],
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: SPACING[2],
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[3],
  },
  fromName: {
    fontFamily: FONTS.bodySemiBold,
    color: '#FFBC40',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: SPACING[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  codeLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  codeValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  primaryBtn: {
    marginBottom: SPACING[3],
  },
});
