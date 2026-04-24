import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { G, Path, Text as SvgText } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { Modal } from '@/components/ui/Modal';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';

import { PopupHeader } from './PopupHeader';

// ─── Icône pièces (header) — SVG Figma 22×20 ─────────────────────────────────
const COINS_ICON = (
  <G translateX={22} translateY={28}>
    <Path
      d="M14.6667 12.9412C14.6667 16.8397 11.3834 20 7.33333 20C3.28325 20 0 16.8397 0 12.9412C0 9.0427 3.28325 5.88235 7.33333 5.88235C11.3834 5.88235 14.6667 9.0427 14.6667 12.9412Z"
      fill="white"
    />
    <Path
      d="M15.8145 14.0317C19.3194 13.5014 22 10.5814 22 7.05882C22 3.16034 18.7168 0 14.6667 0C11.47 0 8.75108 1.96877 7.74715 4.71535C12.2801 4.92314 15.8889 8.52649 15.8889 12.9412C15.8889 13.3109 15.8636 13.6749 15.8145 14.0317Z"
      fill="white"
    />
  </G>
);

// Label "JETONS CÉDÉS !"
const LABEL = (
  <SvgText
    x="65"
    y="50"
    fill="white"
    fontSize="20"
    fontFamily="LuckiestGuy_400Regular"
    letterSpacing="1"
  >
    JETONS CÉDÉS !
  </SvgText>
);

// Décoration droite (dés)
const DECOR_RIGHT = (
  <>
    <Path fillRule="evenodd" clipRule="evenodd" d="M298.767 19.2242L292.25 25.668C289.25 28.6336 289.25 33.4419 292.25 36.4075L298.767 42.8513C301.767 45.8169 306.63 45.8169 309.629 42.8513L316.147 36.4075C319.146 33.4419 319.146 28.6336 316.147 25.668L309.629 19.2242C306.63 16.2586 301.767 16.2586 298.767 19.2242ZM301.928 21.6475C300.679 22.8832 300.679 24.8866 301.928 26.1223C303.178 27.358 305.205 27.358 306.454 26.1223L306.467 26.1094C307.717 24.8737 307.717 22.8703 306.467 21.6346C305.218 20.3989 303.191 20.3989 301.941 21.6346L301.928 21.6475ZM294.687 33.2815C293.437 32.0459 293.437 30.0424 294.687 28.8067L294.7 28.7938C295.95 27.5582 297.976 27.5582 299.226 28.7938C300.476 30.0295 300.476 32.033 299.226 33.2687L299.213 33.2815C297.963 34.5172 295.937 34.5172 294.687 33.2815ZM301.928 35.9668C300.679 37.2024 300.679 39.2059 301.928 40.4416C303.178 41.6773 305.205 41.6773 306.454 40.4416L306.467 40.4287C307.717 39.193 307.717 37.1896 306.467 35.9539C305.218 34.7182 303.191 34.7182 301.941 35.9539L301.928 35.9668ZM309.17 33.2815C307.92 32.0459 307.92 30.0424 309.17 28.8067L309.183 28.7939C310.433 27.5582 312.459 27.5582 313.709 28.7939C314.959 30.0295 314.959 32.033 313.709 33.2687L313.696 33.2815C312.446 34.5172 310.42 34.5172 309.17 33.2815Z" fill="black" fillOpacity="0.15" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M312.421 49.2932V58.406C312.421 62.6 315.86 66 320.102 66H329.319C333.561 66 337 62.6 337 58.406V49.2932C337 45.0991 333.561 41.6992 329.319 41.6992H320.102C315.86 41.6992 312.421 45.0991 312.421 49.2932ZM316.39 48.7961C316.39 50.5436 317.823 51.9602 319.59 51.9602C321.358 51.9602 322.791 50.5436 322.791 48.7961V48.7778C322.791 47.0303 321.358 45.6137 319.59 45.6137C317.823 45.6137 316.39 47.0303 316.39 48.7778V48.7961ZM329.831 62.086C328.064 62.086 326.631 60.6694 326.631 58.9219V58.9036C326.631 57.1561 328.064 55.7395 329.831 55.7395C331.599 55.7395 333.032 57.1561 333.032 58.9036V58.9219C333.032 60.6694 331.599 62.086 329.831 62.086Z" fill="black" fillOpacity="0.15" />
  </>
);

// ─── Popup principal ─────────────────────────────────────────────────────────
interface TokensStolenPopupProps {
  visible: boolean;
  /** Nombre de jetons cédés (pour affichage optionnel) */
  amount?: number;
  onContinue: () => void;
}

export const TokensStolenPopup = memo(function TokensStolenPopup({
  visible,
  amount,
  onContinue,
}: TokensStolenPopupProps) {
  return (
    <Modal visible={visible} onClose={onContinue} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <PopupHeader
          color="#F35145"
          icon={COINS_ICON}
          label={LABEL}
          decorRight={DECOR_RIGHT}
        />

        <View style={styles.body}>
          {/* Badge "JETONS SAUVÉS" */}
          <View style={styles.badgeRow}>
            <View style={styles.badgeIconWrap}>
              <Text style={styles.badgeCheck}>✓</Text>
            </View>
            <OutlinedText
              text="JETONS SAUVÉS"
              style={styles.badgeLabel}
              outlineColor="#AF2121"
              outlineWidth={1}
            />
          </View>

          {/* Description */}
          <Text style={styles.question}>
            Ton adversaire t&apos;a laissé en jeu en échange de tes jetons.
          </Text>

          {/* Option révélée (passive — pas cliquable) */}
          <View style={styles.optionCard}>
            <Text style={styles.optionTitle}>CÉDER TOUS VOS JETONS</Text>
            <Text style={styles.optionSubtitle}>
              {amount != null && amount > 0
                ? `Tu as cédé ${amount} jeton${amount > 1 ? 's' : ''} — mais tu restes en jeu`
                : 'Le prix fort — mais vous restez en jeu'}
            </Text>
          </View>

          {/* Bouton CONTINUER */}
          <View style={styles.buttonWrap}>
            <GameButton
              title="CONTINUER"
              variant="yellow"
              fullWidth
              onPress={onContinue}
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
    paddingTop: SPACING[5],
    paddingBottom: SPACING[5],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  badgeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F35145',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCheck: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  badgeLabel: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: '#F35145',
    letterSpacing: 1,
  },
  question: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: '#1B314A',
    textAlign: 'center',
    marginBottom: SPACING[5],
  },
  optionCard: {
    width: '100%',
    backgroundColor: '#F4F8FC',
    borderRadius: 12,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[5],
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#1B314A',
    letterSpacing: 0.5,
    marginBottom: SPACING[2],
  },
  optionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#71808E',
    lineHeight: 20,
  },
  buttonWrap: {
    width: '100%',
  },
});
