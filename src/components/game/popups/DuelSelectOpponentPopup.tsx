import { memo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { SlideInUp, SlideInLeft, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { DuelHeader, VsBadge } from '@/components/game/popups/DuelHeader';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import type { Player } from '@/types';

interface DuelSelectOpponentPopupProps {
  visible: boolean;
  currentPlayer: Player;
  opponents: Player[];
  onSelectOpponent: (opponent: Player) => void;
  onClose: () => void;
}

export const DuelSelectOpponentPopup = memo(function DuelSelectOpponentPopup({
  visible,
  currentPlayer,
  opponents,
  onSelectOpponent,
  onClose,
}: DuelSelectOpponentPopupProps) {
  usePlaySoundOnOpen(visible, 'popup-open');

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      closeOnBackdrop={false}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <DuelHeader />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Carte challenger */}
          <Animated.View entering={SlideInLeft.duration(280)} style={styles.playerCardRow}>
            <View style={styles.avatarWrap}>
              <Avatar name={currentPlayer.name} playerColor={currentPlayer.color} size="md" showBorder />
            </View>
            <View style={styles.playerCardText}>
              <Text style={styles.playerCardName} numberOfLines={1}>
                {currentPlayer.startupName || 'Entreprise'}
              </Text>
              <Text style={styles.playerCardSubtitle}>{currentPlayer.name}</Text>
            </View>
            <View style={styles.challengerTag}>
              <Text style={styles.challengerTagText}>TOI</Text>
            </View>
          </Animated.View>

          {/* VS Badge */}
          <VsBadge />

          {/* Message */}
          <View style={styles.messageBox}>
            <Text style={styles.message}>Choisis ton adversaire pour le duel !</Text>
          </View>

          {/* Liste des adversaires */}
          <View style={styles.opponentsSection}>
            {opponents.map((opponent, index) => (
              <Animated.View
                key={opponent.id}
                entering={FadeIn.delay(index * 100)}
              >
                <Pressable onPress={() => onSelectOpponent(opponent)}>
                  {({ pressed }) => (
                    <View style={[styles.opponentCard, pressed && styles.opponentCardPressed]}>
                      <View style={styles.avatarWrap}>
                        <Avatar name={opponent.name} playerColor={opponent.color} size="md" showBorder />
                      </View>
                      <View style={styles.playerCardText}>
                        <Text style={styles.playerCardName} numberOfLines={1}>
                          {opponent.startupName || 'Entreprise'}
                        </Text>
                        <Text style={styles.playerCardSubtitle}>
                          {opponent.isAI ? 'IA' : opponent.name}
                        </Text>
                      </View>
                      <View style={styles.selectBadge}>
                        <Ionicons name="flash" size={13} color={COLORS.white} />
                        <Text style={styles.selectBadgeText}>Défier</Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ))}
          </View>
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
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  // Carte joueur — même design que DuelPreparePopup
  playerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[2],
    borderWidth: 1,
    borderColor: '#E8EEF4',
    ...SHADOWS.sm,
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
  challengerTag: {
    backgroundColor: '#EAF4FB',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[2],
  },
  challengerTagText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  messageBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginTop: SPACING[2],
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
    borderColor: COLORS.success,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  selectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
  },
  selectBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
});
