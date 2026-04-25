import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { G, Path, Text as SvgText } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { Modal } from '@/components/ui/Modal';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { JOKER_CATALOG } from '@/data/jokers';
import type { JokerType } from '@/types';

import { PopupHeader } from './PopupHeader';

// ─── Icône étoile pour le header ─────────────────────────────────────────────
const STAR_ICON = (
  <G translateX={18} translateY={24}>
    <Path
      d="M18 1L22.5 13.5L35 14L25.5 22L28.5 34.5L18 27.5L7.5 34.5L10.5 22L1 14L13.5 13.5L18 1Z"
      fill="#FFFFFF"
      stroke="#D4A017"
      strokeWidth="1.5"
    />
  </G>
);

const LABEL = (
  <SvgText
    x="65"
    y="50"
    fill="white"
    fontSize="18"
    fontFamily="LuckiestGuy_400Regular"
    letterSpacing="1"
  >
    JOKER OBTENU !
  </SvgText>
);

const DECOR_RIGHT = (
  <>
    <Path fillRule="evenodd" clipRule="evenodd" d="M298.767 19.2242L292.25 25.668C289.25 28.6336 289.25 33.4419 292.25 36.4075L298.767 42.8513C301.767 45.8169 306.63 45.8169 309.629 42.8513L316.147 36.4075C319.146 33.4419 319.146 28.6336 316.147 25.668L309.629 19.2242C306.63 16.2586 301.767 16.2586 298.767 19.2242Z" fill="black" fillOpacity="0.15" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M312.421 49.2932V58.406C312.421 62.6 315.86 66 320.102 66H329.319C333.561 66 337 62.6 337 58.406V49.2932C337 45.0991 333.561 41.6992 329.319 41.6992H320.102C315.86 41.6992 312.421 45.0991 312.421 49.2932Z" fill="black" fillOpacity="0.15" />
  </>
);

// ─── Popup ───────────────────────────────────────────────────────────────────
interface JokerAcquiredPopupProps {
  visible: boolean;
  jokerType: JokerType | null;
  onContinue: () => void;
}

export const JokerAcquiredPopup = memo(function JokerAcquiredPopup({
  visible,
  jokerType,
  onContinue,
}: JokerAcquiredPopupProps) {
  const meta = jokerType ? JOKER_CATALOG[jokerType] : null;

  return (
    <Modal visible={visible} onClose={onContinue} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <PopupHeader color="#FFBC40" icon={STAR_ICON} label={LABEL} decorRight={DECOR_RIGHT} />

        <View style={styles.body}>
          {meta && (
            <>
              <View style={[styles.iconBadge, { backgroundColor: meta.color }]}>
                <Ionicons name={meta.iconName as never} size={44} color="#FFFFFF" />
              </View>

              <OutlinedText
                text={meta.title}
                style={styles.title}
                outlineColor="#AF7900"
                outlineWidth={1}
              />

              <View style={styles.descriptionBox}>
                <Text style={styles.description}>{meta.description}</Text>
              </View>
            </>
          )}

          <View style={styles.buttonWrap}>
            <GameButton title="COLLECTER" variant="yellow" fullWidth onPress={onContinue} />
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
  iconBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: '#FFBC40',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: SPACING[3],
  },
  descriptionBox: {
    width: '100%',
    backgroundColor: '#F4F8FC',
    borderRadius: 12,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[4],
  },
  description: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#1B314A',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonWrap: {
    width: '100%',
  },
});
