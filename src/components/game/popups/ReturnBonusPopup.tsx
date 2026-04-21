/**
 * ReturnBonusPopup — Affiché quand le joueur revient après ≥ 24h d'absence.
 * Accorde RETURN_BONUS_XP points d'XP via le bouton "RÉCUPÉRER".
 */

import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { GamePopup, GamePopupGradientBorder, GAME_POPUP_WIDTH } from '@/components/ui/GamePopup';
import { RETURN_BONUS_XP } from '@/hooks/useReturnBonus';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

// ─── Icône party popper (confettis) ──────────────────────────────────────────

function PartyPopperIcon() {
  return (
    <Svg width={62} height={56} viewBox="0 0 62 56" fill="none">
      <Path
        d="M19.6582 14.4971C21.702 11.5492 25.9376 11.6298 28.0479 14.3301C30.2459 17.1429 33.458 21.07 36.416 24.0137C39.1087 26.6933 42.6234 29.5853 45.3711 31.7373C48.3944 34.1052 47.9947 38.9603 44.3438 40.5918C36.3331 44.1715 19.9564 51.271 7.6709 55.1387C5.81495 55.7229 3.86219 55.9553 2.32227 55.0195C0.629215 53.9906 0.293988 52.1281 0.356445 50.626C0.420894 49.0761 0.91072 47.2686 1.60156 45.3965C2.30373 43.4937 3.26655 41.3864 4.37988 39.1963C8.81963 30.4627 15.9317 19.8727 19.6582 14.4971ZM51.4209 23.001C53.582 22.5544 55.7929 23.2882 57.6377 25.124C58.4255 25.9081 58.4255 27.1788 57.6377 27.9629C56.8489 28.7479 55.5691 28.7479 54.7803 27.9629C53.731 26.9187 52.8547 26.8072 52.2432 26.9336C51.5445 27.078 50.7422 27.6297 50.1338 28.667C49.572 29.6245 48.3352 29.9493 47.3711 29.3896C46.4078 28.8301 46.0834 27.6004 46.6445 26.6436C47.6839 24.8716 49.3461 23.4298 51.4209 23.001ZM52.7354 3.98633C55.0088 3.18874 57.4233 3.40052 59.8799 4.86719C60.8363 5.43821 61.146 6.67099 60.5732 7.62109C59.9998 8.57216 58.7582 8.88118 57.8008 8.30957C57.0629 7.86908 56.399 7.6377 55.7793 7.56738C55.1574 7.49689 54.5994 7.5909 54.0791 7.77344C52.8817 8.19353 51.607 9.18668 50.1895 10.7285C48.8959 12.1355 47.6391 13.8212 46.3027 15.6123L45.9502 16.084C44.5178 18.0012 42.9831 20.0222 41.3389 21.6553C40.5492 22.4395 39.2695 22.4382 38.4814 21.6523C37.6946 20.8675 37.6959 19.5977 38.4844 18.8145C39.8867 17.4217 41.2545 15.634 42.708 13.6885L43.082 13.1865H43.083C44.3897 11.434 45.7698 9.58292 47.208 8.01855C48.7733 6.31595 50.5949 4.7373 52.7354 3.98633ZM58.8408 13.7129C60.3939 13.7131 61.6504 14.9663 61.6504 16.5078C61.6502 18.0491 60.3938 19.3016 58.8408 19.3018C57.2877 19.3018 56.0314 18.0492 56.0312 16.5078C56.0312 14.9662 57.2876 13.7129 58.8408 13.7129ZM39.1328 0.494141C40.1697 0.0814081 41.345 0.584284 41.7588 1.61328C42.6518 3.83517 42.8734 5.77498 42.4014 7.48438C41.9265 9.20375 40.8375 10.3714 39.7666 11.209C39.0513 11.7684 38.159 12.3039 37.458 12.7236C37.2111 12.8714 36.9853 13.0057 36.8047 13.1201C36.3535 13.4058 36.064 13.6264 35.877 13.7949C35.6943 13.9595 35.5915 14.0909 35.54 14.2031C35.0784 15.212 33.8806 15.6595 32.8643 15.1992C31.8488 14.739 31.402 13.5481 31.8633 12.54C32.4926 11.1651 33.7319 10.3042 34.6348 9.73242C35.022 9.48717 35.3627 9.28493 35.6768 9.09766C36.2555 8.75257 36.7543 8.45569 37.2695 8.05273C37.9593 7.51322 38.3431 7.01005 38.5059 6.4209C38.6714 5.8215 38.6954 4.81295 38.0088 3.10449C37.5955 2.07618 38.0968 0.906644 39.1328 0.494141ZM27.2451 1.13672C28.7984 1.13672 30.0547 2.38907 30.0547 3.93066C30.0547 5.47225 28.7984 6.72461 27.2451 6.72461C25.692 6.72442 24.4356 5.47213 24.4355 3.93066C24.4355 2.38918 25.692 1.13691 27.2451 1.13672Z"
        fill="#1F91D0"
        stroke="white"
        strokeWidth={0.7}
      />
    </Svg>
  );
}

// ─── Bloc XP bonus ────────────────────────────────────────────────────────────

function XPBonusBlock() {
  const [h, setH] = useState(0);
  const w = GAME_POPUP_WIDTH - SPACING[5] * 2;

  return (
    <View
      style={[styles.xpBlock, { width: w }]}
      onLayout={(e) => setH(e.nativeEvent.layout.height)}
    >
      {h > 0 && (
        <GamePopupGradientBorder
          width={w}
          height={h}
          borderRadius={14}
          gradientId="returnBonusXP"
        />
      )}
      <Text style={styles.xpAmount}>+{RETURN_BONUS_XP}</Text>
      <Text style={styles.xpLabel}>XP bonus retour</Text>
    </View>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface ReturnBonusPopupProps {
  visible: boolean;
  onClaim: () => void;
  onDismiss: () => void;
}

export const ReturnBonusPopup = memo(function ReturnBonusPopup({
  visible,
  onClaim,
  onDismiss,
}: ReturnBonusPopupProps) {
  return (
    <GamePopup
      visible={visible}
      onRequestClose={onDismiss}
      header="Bonus reconnexion"
      icon={<PartyPopperIcon />}
    >
      {/* Titre */}
      <Text style={styles.title}>BON RETOUR !</Text>

      {/* Bloc XP */}
      <View style={styles.xpBlockWrapper}>
        <XPBonusBlock />
      </View>

      {/* Bouton */}
      <View style={styles.buttonWrapper}>
        <GameButton
          variant="yellow"
          fullWidth
          title="RÉCUPÉRER"
          onPress={onClaim}
        />
      </View>
    </GamePopup>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING[4],
  },
  xpBlockWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  xpBlock: {
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderRadius: 14,
    paddingVertical: SPACING[4],
    alignItems: 'center',
    gap: SPACING[1],
  },
  xpAmount: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.text,
    textAlign: 'center',
  },
  xpLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  buttonWrapper: {
    width: '100%',
  },
});
