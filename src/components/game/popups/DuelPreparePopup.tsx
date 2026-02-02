import { PopupDuelIcon } from '@/components/game/popups/PopupIcons';
import { Avatar } from '@/components/ui/Avatar';
import { GameButton } from '@/components/ui/GameButton';
import { Modal } from '@/components/ui/Modal';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { Player } from '@/types';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInLeft, SlideInRight, SlideInUp } from 'react-native-reanimated';

interface DuelPreparePopupProps {
  visible: boolean;
  phase: 'intro' | 'opponent_prepare';
  challenger: Player | null;
  opponent: Player | null;
  currentPlayerId: string;
  isOnline?: boolean;
  onStart: () => void;
}

export const DuelPreparePopup = memo(function DuelPreparePopup({
  visible,
  phase,
  challenger,
  opponent,
  currentPlayerId,
  isOnline = false,
  onStart,
}: DuelPreparePopupProps) {
  if (!challenger || !opponent) return null;

  // Déterminer qui doit jouer
  const isIntroPhase = phase === 'intro';
  const isCurrentPlayerChallenger = currentPlayerId === challenger.id;
  const isCurrentPlayerOpponent = currentPlayerId === opponent.id;

  const handleStart = () => {
    if (__DEV__) console.log('[DuelPreparePopup] onStart (Commencer) pressed', { phase, isMyTurn: !isOnline || (isIntroPhase ? isCurrentPlayerChallenger : isCurrentPlayerOpponent) });
    onStart();
  };

  // En phase intro, c'est le challenger qui joue
  // En phase opponent_prepare, c'est l'opponent qui joue
  // En mode local, tous les joueurs partagent le même écran → le bouton s'affiche toujours
  const activePlayer = isIntroPhase ? challenger : opponent;
  const isMyTurn = !isOnline || (isIntroPhase ? isCurrentPlayerChallenger : isCurrentPlayerOpponent);

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
          {/* Header: icône gauche + titre DuEL droite (design system) */}
          <View style={styles.header}>
            <PopupDuelIcon size={32} />
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Phase intro: deux cartes joueur + VS au centre */}
          {isIntroPhase && (
            <>
              <Animated.View entering={SlideInLeft.springify()} style={styles.playerCardRow}>
                <View style={styles.avatarWrap}>
                  <Avatar name={challenger.name} playerColor={challenger.color} size="md" showBorder />
                </View>
                <View style={styles.playerCardText}>
                  <Text style={styles.playerCardName} numberOfLines={1}>{challenger.startupName || 'Startup'}</Text>
                  <Text style={styles.playerCardSubtitle}>{challenger.name}</Text>
                </View>
              </Animated.View>

              <View style={styles.vsCircle}>
                <PopupDuelIcon size={28} />
              </View>

              <Animated.View entering={SlideInRight.springify()} style={styles.playerCardRow}>
                <View style={styles.avatarWrap}>
                  <Avatar name={opponent.name} playerColor={opponent.color} size="md" showBorder />
                </View>
                <View style={styles.playerCardText}>
                  <Text style={styles.playerCardName} numberOfLines={1}>{opponent.startupName || 'Startup'}</Text>
                  <Text style={styles.playerCardSubtitle}>{opponent.name}</Text>
                </View>
              </Animated.View>
            </>
          )}

          {/* Phase opponent_prepare: une carte joueur actif */}
          {!isIntroPhase && (
            <View style={styles.playerCardRow}>
              <View style={styles.avatarWrap}>
                <Avatar name={activePlayer.name} playerColor={activePlayer.color} size="md" showBorder />
              </View>
              <View style={styles.playerCardText}>
                <Text style={styles.playerCardName} numberOfLines={1}>{activePlayer.startupName || 'Startup'}</Text>
                <Text style={styles.playerCardSubtitle}>{activePlayer.name}</Text>
              </View>
            </View>
          )}

          {/* Message */}
          <View style={styles.messageBox}>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Bouton Commencer — gradient jaune/orange (design system: variant yellow) */}
          {isMyTurn && (
            <View style={styles.buttonWrapper}>
              <GameButton title="Commencer" onPress={handleStart} variant="yellow" fullWidth />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: SPACING[4],
    gap: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.success,
    letterSpacing: 2,
  },
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
  vsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(28, 107, 59, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING[2],
  },
  messageBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginTop: SPACING[2],
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
