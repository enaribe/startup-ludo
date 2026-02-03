import { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { SlideInUp, FadeIn } from 'react-native-reanimated';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { PopupDuelIcon } from '@/components/game/popups/PopupIcons';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
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
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      closeOnBackdrop={false}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <View style={styles.content}>
          {/* Icône */}
          <View style={styles.iconCircle}>
            <PopupDuelIcon size={48} />
          </View>

          {/* Titre */}
          <Text style={styles.title}>DUEL</Text>

          {/* Description */}
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>
              Choisis ton adversaire pour le duel !
            </Text>
          </View>

          {/* Joueur actuel */}
          <View style={styles.currentPlayerSection}>
            <Text style={styles.sectionLabel}>Challenger</Text>
            <View style={styles.playerCard}>
              <Avatar
                name={currentPlayer.name}
                playerColor={currentPlayer.color}
                size="md"
                showBorder
              />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{currentPlayer.startupName}</Text>
                <Text style={styles.playerSubtitle}>{currentPlayer.name}</Text>
              </View>
            </View>
          </View>

          {/* Liste des adversaires */}
          <View style={styles.opponentsSection}>
            <Text style={styles.sectionLabel}>Adversaires</Text>
            {opponents.map((opponent, index) => (
              <Animated.View
                key={opponent.id}
                entering={FadeIn.delay(index * 100)}
              >
                <Pressable
                  onPress={() => onSelectOpponent(opponent)}
                  style={({ pressed }) => [
                    styles.opponentCard,
                    pressed && styles.opponentCardPressed,
                  ]}
                >
                  {({ pressed }) => (
                    <View style={[styles.opponentCardInner, pressed && styles.opponentCardInnerPressed]}>
                      <Avatar
                        name={opponent.name}
                        playerColor={opponent.color}
                        size="md"
                        showBorder
                      />
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{opponent.startupName}</Text>
                        <Text style={styles.playerSubtitle}>
                          {opponent.isAI ? 'IA' : opponent.name}
                        </Text>
                      </View>
                      <View style={styles.selectBadge}>
                        <Text style={styles.selectBadgeText}>Défier</Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ))}
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
    maxWidth: 360,
    width: '92%',
    maxHeight: '90%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  content: {
    paddingTop: SPACING[5],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.success,
    letterSpacing: 2,
    marginBottom: SPACING[3],
  },
  descriptionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[4],
  },
  description: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
  },
  currentPlayerSection: {
    width: '100%',
    marginBottom: SPACING[4],
  },
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[2],
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[3],
    ...SHADOWS.sm,
  },
  playerInfo: {
    flex: 1,
    marginLeft: SPACING[3],
  },
  playerName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
  },
  playerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
  },
  opponentsSection: {
    width: '100%',
    gap: SPACING[2],
  },
  opponentCard: {
    marginBottom: SPACING[2],
  },
  opponentCardPressed: {},
  opponentCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[3],
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  opponentCardInnerPressed: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  selectBadge: {
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
