/**
 * StealTargetSelectPopup — Sélection de la cible du joker « VOL ÉCLAIR »
 *
 * Calqué sur DuelSelectOpponentPopup : le joueur choisit directement
 * l'adversaire à qui voler des jetons. Affiche les jetons de chaque cible
 * pour permettre un choix éclairé.
 */
import { memo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { SlideInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from '@/i18n';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import type { Player } from '@/types';

const STEAL_COLOR = '#F35145';
/** Nombre de jetons volés (doit rester aligné sur la description du joker). */
export const STEAL_AMOUNT = 3;

interface StealTargetSelectPopupProps {
  visible: boolean;
  opponents: Player[];
  onSelectTarget: (target: Player) => void;
  onClose: () => void;
}

export const StealTargetSelectPopup = memo(function StealTargetSelectPopup({
  visible,
  opponents,
  onSelectTarget,
  onClose,
}: StealTargetSelectPopupProps) {
  const { t } = useTranslation();
  usePlaySoundOnOpen(visible, 'popup-open');

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="flash" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>{t('stealTarget.headerTitle')}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.messageBox}>
            <Text style={styles.message}>
              {t('stealTarget.message', {
                count: STEAL_AMOUNT,
                tokens: t(STEAL_AMOUNT > 1 ? 'stealTarget.tokenPlural' : 'stealTarget.tokenSingular'),
              })}
            </Text>
          </View>

          <View style={styles.opponentsSection}>
            {opponents.map((opponent, index) => {
              const stealable = Math.min(STEAL_AMOUNT, opponent.tokens);
              const canSteal = stealable > 0;
              return (
                <Animated.View key={opponent.id} entering={FadeIn.delay(index * 80)}>
                  <Pressable onPress={() => onSelectTarget(opponent)} disabled={!canSteal}>
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.opponentCard,
                          pressed && canSteal && styles.opponentCardPressed,
                          !canSteal && styles.opponentCardDisabled,
                        ]}
                      >
                        <View style={styles.avatarWrap}>
                          <Avatar name={opponent.name} playerColor={opponent.color} size="md" showBorder />
                        </View>
                        <View style={styles.playerCardText}>
                          <Text style={styles.playerCardName} numberOfLines={1}>
                            {opponent.startupName || t('stealTarget.company')}
                          </Text>
                          <Text style={styles.playerCardSubtitle}>
                            {opponent.isAI ? t('stealTarget.ai') : opponent.name} • {opponent.tokens}{' '}
                            {t(opponent.tokens > 1 ? 'stealTarget.tokenPlural' : 'stealTarget.tokenSingular')}
                          </Text>
                        </View>
                        <View style={[styles.selectBadge, !canSteal && styles.selectBadgeDisabled]}>
                          <Ionicons name="flash" size={13} color={COLORS.white} />
                          <Text style={styles.selectBadgeText}>
                            {canSteal ? t('stealTarget.steal') : '0'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <Pressable onPress={onClose} style={styles.cancelButton} hitSlop={8}>
            <Text style={styles.cancelText}>{t('stealTarget.cancel')}</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    maxWidth: 360,
    width: '92%',
    maxHeight: '88%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[4],
    backgroundColor: STEAL_COLOR,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    letterSpacing: 1,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[5],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  messageBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[4],
  },
  message: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
  },
  opponentsSection: {
    width: '100%',
  },
  avatarWrap: {
    marginRight: SPACING[3],
  },
  playerCardText: {
    flex: 1,
  },
  playerCardName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#2C3E50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerCardSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#8E99A4',
    marginTop: 2,
  },
  opponentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[2],
    borderWidth: 2,
    borderColor: '#E8EEF4',
    ...SHADOWS.sm,
  },
  opponentCardPressed: {
    borderColor: STEAL_COLOR,
    backgroundColor: 'rgba(243, 81, 69, 0.08)',
  },
  opponentCardDisabled: {
    opacity: 0.5,
  },
  selectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEAL_COLOR,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
  },
  selectBadgeDisabled: {
    backgroundColor: '#B0B7BF',
  },
  selectBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  cancelButton: {
    marginTop: SPACING[2],
    paddingVertical: SPACING[3],
  },
  cancelText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
  },
});
