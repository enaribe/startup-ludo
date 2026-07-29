import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { useTranslation } from '@/i18n';
import { Modal } from '@/components/ui/Modal';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import type { Player } from '@/types';

import { PopupHeader } from './PopupHeader';

// ─── Icône smiley triste (header) — SVG Figma ────────────────────────────────
const SAD_ICON = (
  <G translateX={17} translateY={23}>
    <Path
      d="M19 0.5C29.2173 0.5 37.5 8.78273 37.5 19C37.5 29.2173 29.2173 37.5 19 37.5C8.78273 37.5 0.5 29.2173 0.5 19C0.5 8.78273 8.78273 0.5 19 0.5ZM19 22.7754C15.6826 22.7754 13.3645 23.8934 11.8604 25.0967C11.1206 25.6885 10.5945 26.2865 10.2461 26.751C10.1179 26.9219 10.0141 27.0769 9.93066 27.207L9.90137 27.1924L9.68066 27.6338L9.67969 27.6357C9.6794 27.6362 9.67937 27.6374 9.67871 27.6387C9.20327 28.5896 9.58821 29.7462 10.5391 30.2217C11.4807 30.6925 12.6225 30.3185 13.1064 29.3877L13.1074 29.3887L13.1094 29.3848C13.1122 29.3797 13.1222 29.3631 13.1387 29.3359C13.1721 29.2809 13.2336 29.185 13.3262 29.0615C13.5121 28.8136 13.8173 28.4615 14.2646 28.1035C15.1354 27.4069 16.6176 26.625 19 26.625C21.3824 26.625 22.8646 27.4069 23.7354 28.1035C24.1827 28.4615 24.4879 28.8136 24.6738 29.0615C24.7664 29.185 24.8279 29.2809 24.8613 29.3359L24.8906 29.3848L24.8926 29.3887V29.3877C25.3764 30.3188 26.5191 30.6926 27.4609 30.2217C28.3985 29.7528 28.785 28.6228 28.3398 27.6797C28.3347 27.6665 28.3302 27.656 28.3271 27.6494C28.3258 27.6465 28.323 27.6421 28.3223 27.6406L28.3213 27.6377L28.3203 27.6357L28.0986 27.1924L28.0684 27.207C27.985 27.077 27.882 26.9217 27.7539 26.751C27.4055 26.2865 26.8794 25.6885 26.1396 25.0967C24.6355 23.8934 22.3174 22.7754 19 22.7754ZM12.3496 10.9004C10.4996 10.9006 9 12.4 9 14.25C9 16.1 10.4996 17.5994 12.3496 17.5996C14.1998 17.5996 15.7002 16.1002 15.7002 14.25C15.7002 12.3998 14.1998 10.9004 12.3496 10.9004ZM25.6504 10.9004C23.8002 10.9004 22.2998 12.3998 22.2998 14.25C22.2998 16.1002 23.8002 17.5996 25.6504 17.5996C27.5004 17.5994 29 16.1 29 14.25C29 12.4 27.5004 10.9006 25.6504 10.9004Z"
      fill="white"
      stroke="#AF2121"
    />
  </G>
);

// Label header (texte "ATTRAPÉ !" traduisible)
function AttrapeLabel({ text }: { text: string }) {
  return (
    <SvgText
      x="65"
      y="50"
      fill="white"
      fontSize="22"
      fontFamily="LuckiestGuy_400Regular"
      letterSpacing="1"
    >
      {text}
    </SvgText>
  );
}

// Décoration droite (dés, repris du EventPopup)
const DECOR_RIGHT = (
  <>
    <Path fillRule="evenodd" clipRule="evenodd" d="M298.767 19.2242L292.25 25.668C289.25 28.6336 289.25 33.4419 292.25 36.4075L298.767 42.8513C301.767 45.8169 306.63 45.8169 309.629 42.8513L316.147 36.4075C319.146 33.4419 319.146 28.6336 316.147 25.668L309.629 19.2242C306.63 16.2586 301.767 16.2586 298.767 19.2242ZM301.928 21.6475C300.679 22.8832 300.679 24.8866 301.928 26.1223C303.178 27.358 305.205 27.358 306.454 26.1223L306.467 26.1094C307.717 24.8737 307.717 22.8703 306.467 21.6346C305.218 20.3989 303.191 20.3989 301.941 21.6346L301.928 21.6475ZM294.687 33.2815C293.437 32.0459 293.437 30.0424 294.687 28.8067L294.7 28.7938C295.95 27.5582 297.976 27.5582 299.226 28.7938C300.476 30.0295 300.476 32.033 299.226 33.2687L299.213 33.2815C297.963 34.5172 295.937 34.5172 294.687 33.2815ZM301.928 35.9668C300.679 37.2024 300.679 39.2059 301.928 40.4416C303.178 41.6773 305.205 41.6773 306.454 40.4416L306.467 40.4287C307.717 39.193 307.717 37.1896 306.467 35.9539C305.218 34.7182 303.191 34.7182 301.941 35.9539L301.928 35.9668ZM309.17 33.2815C307.92 32.0459 307.92 30.0424 309.17 28.8067L309.183 28.7939C310.433 27.5582 312.459 27.5582 313.709 28.7939C314.959 30.0295 314.959 32.033 313.709 33.2687L313.696 33.2815C312.446 34.5172 310.42 34.5172 309.17 33.2815Z" fill="black" fillOpacity="0.15" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M312.421 49.2932V58.406C312.421 62.6 315.86 66 320.102 66H329.319C333.561 66 337 62.6 337 58.406V49.2932C337 45.0991 333.561 41.6992 329.319 41.6992H320.102C315.86 41.6992 312.421 45.0991 312.421 49.2932ZM316.39 48.7961C316.39 50.5436 317.823 51.9602 319.59 51.9602C321.358 51.9602 322.791 50.5436 322.791 48.7961V48.7778C322.791 47.0303 321.358 45.6137 319.59 45.6137C317.823 45.6137 316.39 47.0303 316.39 48.7778V48.7961ZM329.831 62.086C328.064 62.086 326.631 60.6694 326.631 58.9219V58.9036C326.631 57.1561 328.064 55.7395 329.831 55.7395C331.599 55.7395 333.032 57.1561 333.032 58.9036V58.9219C333.032 60.6694 331.599 62.086 329.831 62.086Z" fill="black" fillOpacity="0.15" />
  </>
);

// ─── Icônes options (Figma) ──────────────────────────────────────────────────
function HomeIcon({ color = '#71808E' }: { color?: string }) {
  return (
    <Svg width={20} height={19} viewBox="0 0 20 19" fill="none">
      <Path
        d="M1.50125 5.54597L7.33805 0.876524C8.79893 -0.292175 10.8747 -0.292175 12.3356 0.876525L18.1724 5.54597C19.2128 6.37826 19.7705 7.67391 19.6598 9.00163L18.9897 17.0436C18.9033 18.0802 18.0367 18.8775 16.9966 18.8775H13.1117C11.7466 18.8775 10.7826 17.5401 11.2143 16.245L11.4672 15.4864C11.895 14.2029 10.9397 12.8775 9.58683 12.8775C8.23395 12.8775 7.27864 14.2029 7.70646 15.4864L7.95935 16.245C8.39104 17.5401 7.4271 18.8775 6.06198 18.8775H2.6771C1.63692 18.8775 0.770391 18.0802 0.684009 17.0436L0.0138451 9.00163C-0.0967978 7.67391 0.460884 6.37826 1.50125 5.54597Z"
        fill={color}
      />
    </Svg>
  );
}

function CoinIcon({ color = '#71808E' }: { color?: string }) {
  return (
    <Svg width={22} height={20} viewBox="0 0 22 20" fill="none">
      <Path
        d="M14.6667 12.9412C14.6667 16.8397 11.3834 20 7.33333 20C3.28325 20 0 16.8397 0 12.9412C0 9.0427 3.28325 5.88235 7.33333 5.88235C11.3834 5.88235 14.6667 9.0427 14.6667 12.9412Z"
        fill={color}
      />
      <Path
        d="M15.8145 14.0317C19.3194 13.5014 22 10.5814 22 7.05882C22 3.16034 18.7168 0 14.6667 0C11.47 0 8.75108 1.96877 7.74715 4.71535C12.2801 4.92314 15.8889 8.52649 15.8889 12.9412C15.8889 13.3109 15.8636 13.6749 15.8145 14.0317Z"
        fill={color}
      />
    </Svg>
  );
}

// ─── Header complet ──────────────────────────────────────────────────────────
function AttrapeHeader({ label }: { label: string }) {
  return (
    <PopupHeader
      color="#F35145"
      icon={SAD_ICON}
      label={<AttrapeLabel text={label} />}
      decorRight={DECOR_RIGHT}
    />
  );
}

// ─── Option Card (design clair) ──────────────────────────────────────────────
interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function OptionCard({ icon, title, subtitle, selected, onPress, disabled }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.optionCard,
        selected && styles.optionCardSelected,
        disabled && styles.optionCardDisabled,
      ]}
    >
      <View style={styles.optionIconWrap}>{icon}</View>
      <View style={styles.optionTextWrap}>
        <Text style={styles.optionTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.optionSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

// ─── Popup principal ─────────────────────────────────────────────────────────
// RÈGLE : ce popup s'adresse à l'ATTRAPÉ (`captured`) — c'est LUI qui choisit son
// sort. `capturer` sert uniquement à afficher le nom de l'adversaire (« attrapé
// par X ») ; c'est aussi le bénéficiaire des jetons en cas de « donner », mais
// l'attribution est gérée par l'écran (voir handleCaptureChoiceResolve).
interface CaptureChoicePopupProps {
  visible: boolean;
  capturer?: Player | null;
  captured: Player | null;
  onChoice: (choice: 'steal_tokens' | 'send_home') => void;
  /** Nom de l'attrapé à qui passer l'appareil (mode local hot-seat uniquement).
   *  Si fourni, affiche « Passe le téléphone à X ». Non fourni en solo/online. */
  handoffName?: string | null;
}

export const CaptureChoicePopup = memo(function CaptureChoicePopup({
  visible,
  capturer,
  captured,
  onChoice,
  handoffName,
}: CaptureChoicePopupProps) {
  const { t } = useTranslation();
  const tokensAvailable = captured?.tokens ?? 0;
  const capturerName = capturer?.name ?? t('captureChoice.defaultOpponent');

  const [selected, setSelected] = useState<'send_home' | 'steal_tokens'>('send_home');

  useEffect(() => {
    if (visible) setSelected('send_home');
  }, [visible]);

  // Badges jetons (8 slots — même pile que dans le jeu)
  const tokenSlots = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => i < tokensAvailable);
  }, [tokensAvailable]);

  return (
    <Modal visible={visible} onClose={() => {}} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <AttrapeHeader label={t('captureChoice.header')} />

        <View style={styles.body}>
          {/* Passe-plat hot-seat : indique à qui donner l'appareil (local uniquement) */}
          {handoffName ? (
            <Text style={styles.handoffHint}>{t('captureChoice.handoff', { name: handoffName })}</Text>
          ) : null}

          {/* Message principal en rouge — s'adresse à l'ATTRAPÉ */}
          <OutlinedText
            text={t('captureChoice.caughtBy', { name: capturerName.toUpperCase() })}
            style={styles.subtitle}
            outlineColor="#AF2121"
            outlineWidth={1}
          />

          {/* Jetons que TU possèdes encore */}
          <Text style={styles.tokensLabel}>
            {tokensAvailable > 0
              ? t('captureChoice.tokensLeft', {
                  count: tokensAvailable,
                  token: t(tokensAvailable > 1 ? 'captureChoice.tokenPlural' : 'captureChoice.tokenSingular'),
                })
              : t('captureChoice.noTokens')}
          </Text>
          <View style={styles.tokensRow}>
            {tokenSlots.map((filled, i) => (
              <View
                key={i}
                style={[styles.tokenSlot, filled ? styles.tokenFilled : styles.tokenEmpty]}
              >
                {filled && (
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12L10 17L20 7"
                      stroke="#FFFFFF"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </View>
            ))}
          </View>

          {/* Options */}
          <View style={styles.optionsWrap}>
            <OptionCard
              icon={<HomeIcon />}
              title={t('captureChoice.goHomeTitle')}
              subtitle={t('captureChoice.goHomeSubtitle')}
              selected={selected === 'send_home'}
              onPress={() => setSelected('send_home')}
            />
            <OptionCard
              icon={<CoinIcon />}
              title={t('captureChoice.giveTokensTitle')}
              subtitle={
                tokensAvailable > 0
                  ? t('captureChoice.giveTokensSubtitle', {
                      count: tokensAvailable,
                      token: t(tokensAvailable > 1 ? 'captureChoice.tokenPlural' : 'captureChoice.tokenSingular'),
                    })
                  : t('captureChoice.giveTokensNone')
              }
              selected={selected === 'steal_tokens'}
              onPress={() => setSelected('steal_tokens')}
              disabled={tokensAvailable <= 0}
            />
          </View>

          {/* Bouton CONTINUER */}
          <View style={styles.buttonWrap}>
            <GameButton
              title={t('captureChoice.continue')}
              variant="yellow"
              fullWidth
              onPress={() => onChoice(selected)}
            />
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
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  body: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[5],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: '#F35145',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: SPACING[4],
  },
  handoffHint: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#1F91D0',
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  tokensLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#1B314A',
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  tokensRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: SPACING[5],
  },
  tokenSlot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenFilled: {
    backgroundColor: '#4CAF50',
  },
  tokenEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  optionsWrap: {
    width: '100%',
    gap: SPACING[3],
    marginBottom: SPACING[5],
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F8FC',
    borderRadius: 12,
    paddingVertical: 13,
    paddingLeft: 13,
    paddingRight: 20,
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionCardSelected: {
    borderColor: '#FFBC40',
  },
  optionCardDisabled: {
    opacity: 0.45,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  optionTextWrap: {
    flex: 1,
    gap: 5,
  },
  optionTitle: {
    fontFamily: FONTS.title,
    fontSize: 13,
    color: '#1B314A',
    letterSpacing: 0.5,
  },
  optionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#71808E',
  },
  buttonWrap: {
    width: '100%',
  },
});
