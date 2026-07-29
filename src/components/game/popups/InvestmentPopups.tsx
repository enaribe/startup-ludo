/**
 * InvestmentPopups — Popups du joker « Investissement ».
 *
 * - InvestmentStakePickerPopup : le joueur choisit sa mise (1 ou 2 jetons).
 * - InvestmentResultPopup : annonce le résultat du pari (réussi / perdu) à la
 *   fin du tour suivant.
 */
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GameButton } from '@/components/ui';
import { GamePopup } from '@/components/ui/GamePopup';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const INVEST_COLOR = '#9C27B0';

// ===== PICKER DE MISE =====

interface InvestmentStakePickerPopupProps {
  visible: boolean;
  /** Mise maximale autorisée (selon les jetons du joueur), plafonnée à 2. */
  maxStake?: number;
  onPick: (stake: number) => void;
  onCancel: () => void;
}

export const InvestmentStakePickerPopup = memo(function InvestmentStakePickerPopup({
  visible,
  maxStake = 2,
  onPick,
  onCancel,
}: InvestmentStakePickerPopupProps) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    if (visible) setPending(null);
  }, [visible]);

  const options = maxStake >= 2 ? [1, 2] : [1];

  const handleConfirm = () => {
    if (pending != null) onPick(pending);
    else onCancel();
  };

  return (
    <GamePopup
      visible={visible}
      onRequestClose={onCancel}
      icon={<Ionicons name="trending-up" size={64} color={INVEST_COLOR} />}
      title={t('investment.title')}
      header={t('investment.pickerHeader')}
      footer={
        <GameButton
          title={
            pending != null
              ? t('investment.confirmInvest', {
                  count: pending,
                  token: pending > 1 ? t('investment.tokensUpper') : t('investment.tokenUpper'),
                })
              : t('investment.cancel')
          }
          variant={pending != null ? 'yellow' : 'blue'}
          fullWidth
          onPress={handleConfirm}
        />
      }
    >
      <View style={styles.stakeRow}>
        {options.map((s) => {
          const selected = pending === s;
          return (
            <Pressable
              key={s}
              onPress={() => setPending((prev) => (prev === s ? null : s))}
              style={[styles.stakeCard, selected && styles.stakeCardActive]}
            >
              <Text style={[styles.stakeValue, selected && styles.stakeValueActive]}>{s}</Text>
              <Text style={[styles.stakeLabel, selected && styles.stakeLabelActive]}>
                {s > 1 ? t('investment.tokens') : t('investment.token')}
              </Text>
              <Text style={styles.stakeGain}>{t('investment.ifWon', { amount: s * 2 })}</Text>
            </Pressable>
          );
        })}
      </View>
    </GamePopup>
  );
});

// ===== RÉSULTAT DU PARI =====

interface InvestmentResultPopupProps {
  visible: boolean;
  won: boolean;
  stake: number;
  gain: number;
  onClose: () => void;
}

export const InvestmentResultPopup = memo(function InvestmentResultPopup({
  visible,
  won,
  stake,
  gain,
  onClose,
}: InvestmentResultPopupProps) {
  const { t } = useTranslation();
  return (
    <GamePopup
      visible={visible}
      onRequestClose={onClose}
      icon={
        <Ionicons
          name={won ? 'trending-up' : 'trending-down'}
          size={64}
          color={won ? COLORS.success : COLORS.error}
        />
      }
      title={won ? t('investment.wonTitle') : t('investment.lostTitle')}
      header={
        won
          ? t('investment.wonHeader', {
              stake,
              token: stake > 1 ? t('investment.tokens') : t('investment.token'),
              gain,
            })
          : t('investment.lostHeader', {
              stake,
              token: stake > 1 ? t('investment.tokens') : t('investment.token'),
            })
      }
      footer={<GameButton title={t('investment.continue')} variant="yellow" fullWidth onPress={onClose} />}
    />
  );
});

const styles = StyleSheet.create({
  stakeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING[4],
    width: '100%',
    marginVertical: SPACING[2],
  },
  stakeCard: {
    width: 96,
    paddingVertical: SPACING[4],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    gap: 2,
  },
  stakeCardActive: {
    borderColor: INVEST_COLOR,
    backgroundColor: 'rgba(156,39,176,0.15)',
  },
  stakeValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.text,
  },
  stakeValueActive: {
    color: INVEST_COLOR,
  },
  stakeLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  stakeLabelActive: {
    color: COLORS.text,
  },
  stakeGain: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.success,
    marginTop: 4,
  },
});
