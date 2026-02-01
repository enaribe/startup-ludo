import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { SlideInUp, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { GameButton } from '@/components/ui/GameButton';
import { PopupDuelIcon } from '@/components/game/popups/PopupIcons';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import type { Player } from '@/types';

interface DuelPreparePopupProps {
  visible: boolean;
  phase: 'intro' | 'opponent_prepare';
  challenger: Player | null;
  opponent: Player | null;
  currentPlayerId: string;
  onStart: () => void;
}

export const DuelPreparePopup = memo(function DuelPreparePopup({
  visible,
  phase,
  challenger,
  opponent,
  currentPlayerId,
  onStart,
}: DuelPreparePopupProps) {
  if (!challenger || !opponent) return null;

  // Déterminer qui doit jouer
  const isIntroPhase = phase === 'intro';
  const isCurrentPlayerChallenger = currentPlayerId === challenger.id;
  const isCurrentPlayerOpponent = currentPlayerId === opponent.id;

  // En phase intro, c'est le challenger qui joue
  // En phase opponent_prepare, c'est l'opponent qui joue
  const activePlayer = isIntroPhase ? challenger : opponent;
  const isMyTurn = isIntroPhase ? isCurrentPlayerChallenger : isCurrentPlayerOpponent;

  const title = isIntroPhase ? 'DUEL' : 'À TON TOUR';
  const message = isMyTurn
    ? 'Prépare-toi à répondre\naux 3 questions !'
    : `C'est au tour de\n${activePlayer.name}`;

  return (
    <Modal
      visible={visible}
      onClose={() => {}}
      closeOnBackdrop={false}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={SlideInUp.springify().damping(18)} style={styles.card}>
        <View style={styles.content}>
          {/* Icône */}
          <View style={styles.iconCircle}>
            <PopupDuelIcon size={48} />
          </View>

          {/* Titre */}
          <Text style={styles.title}>{title}</Text>

          {/* Affichage VS pour l'intro */}
          {isIntroPhase && (
            <View style={styles.vsSection}>
              <Animated.View entering={SlideInLeft.springify()} style={styles.playerSide}>
                <Avatar
                  name={challenger.name}
                  playerColor={challenger.color}
                  size="md"
                  showBorder
                />
                <Text style={styles.vsPlayerName}>{challenger.startupName}</Text>
              </Animated.View>

              <View style={styles.vsCircle}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <Animated.View entering={SlideInRight.springify()} style={styles.playerSide}>
                <Avatar
                  name={opponent.name}
                  playerColor={opponent.color}
                  size="md"
                  showBorder
                />
                <Text style={styles.vsPlayerName}>{opponent.startupName}</Text>
              </Animated.View>
            </View>
          )}

          {/* Carte joueur actif pour opponent_prepare */}
          {!isIntroPhase && (
            <View style={styles.playerCard}>
              <Avatar
                name={activePlayer.name}
                playerColor={activePlayer.color}
                size="lg"
                showBorder
              />
              <Text style={styles.playerName}>{activePlayer.startupName}</Text>
              <Text style={styles.playerSubtitle}>{activePlayer.name}</Text>
            </View>
          )}

          {/* Message */}
          <View style={styles.messageBox}>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Bouton (seulement si c'est notre tour) */}
          {isMyTurn && (
            <View style={styles.buttonWrapper}>
              <GameButton
                title="Commencer"
                onPress={onStart}
                variant="green"
                fullWidth
              />
            </View>
          )}
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
    marginBottom: SPACING[4],
  },
  vsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING[4],
  },
  playerSide: {
    flex: 1,
    alignItems: 'center',
  },
  vsPlayerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#2C3E50',
    marginTop: SPACING[2],
    textAlign: 'center',
    maxWidth: 80,
  },
  vsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  vsText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  playerCard: {
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[5],
    width: '100%',
    marginBottom: SPACING[4],
    ...SHADOWS.sm,
  },
  playerName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#2C3E50',
    marginTop: SPACING[2],
  },
  playerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
  },
  messageBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[5],
  },
  message: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonWrapper: {
    width: '100%',
  },
});
