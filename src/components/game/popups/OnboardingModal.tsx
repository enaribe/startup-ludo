/**
 * OnboardingModal — Flow d'onboarding affiché une seule fois à la première connexion.
 *
 * 4 slides, chacun avec un header SVG coloré pleine largeur :
 *  1. Bienvenue       — header bleu,   dés LUDO
 *  2. Créer startups  — header rouge,  fusée
 *  3. Meilleur entre. — header vert,   médaille  (à venir)
 *  4. Gagnez des XP   — header jaune,  jeton XP  (à venir)
 *
 * Navigation : PASSER (skip → ferme) | SUIVANT / TERMINER
 */

import { memo, useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const POPUP_WIDTH = Math.min(screenWidth - SPACING[8], 340);

// ─── Header générique (fond coloré arrondi en haut + icônes) ─────────────────

/**
 * Wrapper commun pour tous les headers : fond coloré, overlays dégradés.
 * Les enfants (icônes) sont passés en slot.
 */
function SlideHeader({
  width,
  bgColor,
  strokeColor,
  linearId,
  radialId,
  children,
}: {
  width: number;
  bgColor: string;
  strokeColor: string;
  linearId: string;
  radialId: string;
  children: React.ReactNode;
}) {
  const height = Math.round((191 / 356) * width);
  return (
    <Svg width={width} height={height} viewBox="0 0 356 191" fill="none">
      {/* Fond coloré */}
      <Path
        d="M0 20C0 8.95431 8.95431 0 20 0H336C347.046 0 356 8.9543 356 20V191H0V20Z"
        fill={bgColor}
      />
      {/* Overlay dégradé linéaire */}
      <Path
        d="M0 20C0 8.95431 8.95431 0 20 0H336C347.046 0 356 8.9543 356 20V191H0V20Z"
        fill={`url(#${linearId})`}
        fillOpacity={0.2}
      />
      {/* Overlay dégradé radial */}
      <Path
        d="M0 20C0 8.95431 8.95431 0 20 0H336C347.046 0 356 8.9543 356 20V191H0V20Z"
        fill={`url(#${radialId})`}
        fillOpacity={0.2}
      />
      {/* Icônes spécifiques au slide */}
      {children}
      <Defs>
        <LinearGradient id={linearId} x1="178" y1="0" x2="178" y2="191" gradientUnits="userSpaceOnUse">
          <Stop stopColor="white" />
          <Stop offset="1" stopColor="white" stopOpacity={0} />
        </LinearGradient>
        <RadialGradient id={radialId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(178 33.33) rotate(90) scale(157.67 178)">
          <Stop stopColor="white" />
          <Stop offset="1" stopColor="white" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* Stroke invisible pour satisfaire le prop */}
      <Path d="" stroke={strokeColor} />
    </Svg>
  );
}

// ─── Header slide 1 — Bleu, dés LUDO ─────────────────────────────────────────

function HeaderWelcome({ width }: { width: number }) {
  return (
    <SlideHeader width={width} bgColor="#1F91D0" strokeColor="#1C436D" linearId="lin_s1" radialId="rad_s1">
      {/* Losange dés */}
      <Path fillRule="evenodd" clipRule="evenodd"
        d="M146.653 47.8116L132.787 61.7511C126.404 68.1666 126.404 78.5681 132.787 84.9836L146.653 98.9231C153.035 105.339 163.383 105.339 169.765 98.9231L183.632 84.9836C190.014 78.5681 190.014 68.1666 183.632 61.7511L169.765 47.8116C163.383 41.3961 153.035 41.3961 146.653 47.8116ZM153.38 53.0538C150.721 55.7269 150.721 60.0608 153.38 62.734C156.039 65.4071 160.35 65.4071 163.009 62.734L163.037 62.7061C165.696 60.033 165.696 55.699 163.037 53.0259C160.378 50.3528 156.067 50.3528 153.407 53.0259L153.38 53.0538ZM137.972 78.2213C135.313 75.5482 135.313 71.2142 137.972 68.5411L138 68.5132C140.659 65.8401 144.971 65.8401 147.63 68.5132C150.289 71.1863 150.289 75.5203 147.63 78.1934L147.602 78.2213C144.943 80.8944 140.632 80.8944 137.972 78.2213ZM153.38 84.0301C150.721 86.7032 150.721 91.0372 153.38 93.7103C156.039 96.3834 160.35 96.3834 163.009 93.7103L163.037 93.6825C165.696 91.0093 165.696 86.6754 163.037 84.0022C160.378 81.3291 156.067 81.3291 153.407 84.0022L153.38 84.0301ZM168.788 78.2213C166.128 75.5482 166.128 71.2142 168.788 68.5411L168.815 68.5132C171.475 65.8401 175.786 65.8401 178.445 68.5132C181.104 71.1863 181.104 75.5203 178.445 78.1934L178.417 78.2213C175.758 80.8944 171.447 80.8944 168.788 78.2213Z"
        fill="white" stroke="#1C436D" />
      {/* Carré dés */}
      <Path fillRule="evenodd" clipRule="evenodd"
        d="M175.705 112.859V132.572C175.705 141.645 183.022 149 192.047 149H211.658C220.683 149 228 141.645 228 132.572V112.859C228 103.786 220.683 96.4308 211.658 96.4308H192.047C183.022 96.4308 175.705 103.786 175.705 112.859ZM184.149 111.783C184.149 115.564 187.197 118.628 190.958 118.628C194.718 118.628 197.767 115.564 197.767 111.783V111.744C197.767 107.964 194.718 104.899 190.958 104.899C187.197 104.899 184.149 107.964 184.149 111.744V111.783ZM212.747 140.533C208.987 140.533 205.938 137.468 205.938 133.688V133.649C205.938 129.868 208.987 126.804 212.747 126.804C216.508 126.804 219.557 129.868 219.557 133.649V133.688C219.557 137.468 216.508 140.533 212.747 140.533Z"
        fill="white" stroke="#1C436D" />
    </SlideHeader>
  );
}

// ─── Header slide 2 — Rouge, fusée ───────────────────────────────────────────

function HeaderRocket({ width }: { width: number }) {
  return (
    <SlideHeader width={width} bgColor="#F35145" strokeColor="#AF2121" linearId="lin_s2" radialId="rad_s2">
      <Path fillRule="evenodd" clipRule="evenodd"
        d="M184.789 58.2081C180.379 53.9306 173.545 53.9306 169.134 58.2081C163.316 63.851 156.909 73.7031 153.854 88.5949C152.638 88.9886 151.486 89.6554 150.448 90.4686C148.727 91.816 147.12 93.7112 145.746 96.0158C143.012 100.601 141.064 107.035 141.035 114.788C140.87 116.348 141.296 117.988 142.234 119.258C143.276 120.668 145.067 121.724 147.289 121.384C149.33 121.072 151.133 119.665 152.687 117.658L152.78 117.536C153.229 119.801 153.956 121.785 155.257 123.104C155.984 123.842 156.882 124.362 157.921 124.567C158.932 124.767 159.889 124.632 160.711 124.37C162.272 123.872 163.722 122.793 164.944 121.718C166.597 120.265 168.436 118.245 170.14 116.374C170.929 115.507 171.689 114.673 172.388 113.941C173.573 112.7 174.625 111.698 175.541 111.018C176.502 110.304 176.937 110.236 176.963 110.232C176.988 110.236 177.421 110.304 178.383 111.018C179.299 111.698 180.351 112.7 181.536 113.941C182.235 114.673 182.995 115.507 183.784 116.374C185.488 118.245 187.327 120.265 188.979 121.718C190.202 122.793 191.652 123.872 193.213 124.37C194.035 124.632 194.992 124.767 196.003 124.567C197.042 124.362 197.94 123.842 198.667 123.104C199.983 121.769 200.711 119.754 201.159 117.456C201.211 117.524 201.262 117.591 201.313 117.658C202.867 119.665 204.67 121.072 206.711 121.384C208.933 121.724 210.724 120.668 211.766 119.258C212.704 117.988 213.13 116.348 212.965 114.788C212.936 107.035 210.988 100.601 208.254 96.0158C206.88 93.7112 205.273 91.816 203.552 90.4686C202.491 89.6371 201.311 88.9588 200.064 88.5688C197.008 73.6987 190.612 63.855 184.789 58.2081ZM150.504 98.8481C151.215 97.6564 151.959 96.6784 152.687 95.908C152.284 99.3639 152.056 103.046 152.038 106.961C150.664 110.587 149.378 112.886 148.305 114.272C147.475 115.345 146.893 115.721 146.622 115.85C146.56 115.708 146.522 115.515 146.546 115.349C146.564 115.219 146.573 115.089 146.573 114.958C146.574 108.029 148.309 102.531 150.504 98.8481ZM205.695 114.272C204.622 112.886 203.336 110.587 201.962 106.961C201.944 103.046 201.716 99.3639 201.313 95.908C202.041 96.6784 202.785 97.6564 203.496 98.8481C205.691 102.531 207.426 108.029 207.427 114.958C207.427 115.089 207.436 115.219 207.454 115.349C207.478 115.515 207.44 115.708 207.378 115.85C207.107 115.721 206.525 115.345 205.695 114.272ZM176.961 85.3259C181.039 85.3259 184.346 82.022 184.346 77.9464C184.346 73.8709 181.039 70.567 176.961 70.567C172.882 70.567 169.576 73.8709 169.576 77.9464C169.576 82.022 172.882 85.3259 176.961 85.3259Z"
        fill="white" stroke="#AF2121" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M170.792 118.31C174.186 114.918 179.689 114.918 183.083 118.31C185.854 121.079 186.428 125.359 184.483 128.759L182.032 133.046C179.779 136.985 174.096 136.985 171.844 133.046L169.392 128.759C167.448 125.359 168.021 121.079 170.792 118.31Z"
        fill="white" stroke="#AF2121" strokeLinecap="round" strokeLinejoin="round" />
    </SlideHeader>
  );
}

// ─── Header slide 3 — Vert, médaille "1" ─────────────────────────────────────

function HeaderMedal({ width }: { width: number }) {
  const height = Math.round((191 / 356) * width);
  return (
    <Svg width={width} height={height} viewBox="0 0 356 191" fill="none">
      <Path d="M1 20C1 8.95431 9.9543 0 21 0H336C347.046 0 356 8.9543 356 20V191H1V20Z" fill="#4CAF50" />
      <Path d="M0 20C0 8.95431 8.9543 0 20 0H335C346.046 0 355 8.9543 355 20V191H0V20Z" fill="url(#lin_s3)" fillOpacity={0.2} />
      <Path d="M0 20C0 8.95431 8.9543 0 20 0H335C346.046 0 355 8.9543 355 20V191H0V20Z" fill="url(#rad_s3)" fillOpacity={0.2} />
      <Path
        d="M153.9 54.4561V62.8999C154.813 62.7869 155.752 62.7794 156.702 62.8881L158.713 63.1181C162.111 63.5069 165.512 62.4036 168.033 60.094L169.524 58.7279C174.037 54.5937 180.966 54.5937 185.479 58.7279L186.97 60.094C189.491 62.4036 192.891 63.5069 196.29 63.1181L198.301 62.8881C199.251 62.7794 200.189 62.7869 201.101 62.8997V54.4561C201.101 45.2084 191.355 39.1937 183.072 43.3294C179.565 45.0805 175.437 45.0805 171.929 43.3294C163.646 39.1937 153.9 45.2084 153.9 54.4561Z"
        fill="white" stroke="#1C6B3B" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        fillRule="evenodd" clipRule="evenodd"
        d="M169.611 65.1221C174.073 61.0335 180.927 61.0335 185.389 65.1221C187.882 67.4061 191.245 68.4973 194.607 68.1128C200.624 67.4244 206.168 71.4469 207.372 77.374C208.044 80.6852 210.123 83.5419 213.069 85.2038C218.342 88.1786 220.459 94.6871 217.944 100.189C216.539 103.262 216.539 106.793 217.944 109.867C220.459 115.369 218.342 121.877 213.069 124.852C210.123 126.514 208.044 129.37 207.372 132.682C206.168 138.609 200.624 142.631 194.607 141.943C191.245 141.558 187.882 142.65 185.389 144.934C180.927 149.022 174.073 149.022 169.611 144.934C167.118 142.65 163.755 141.558 160.393 141.943C154.376 142.631 148.832 138.609 147.628 132.682C146.956 129.37 144.877 126.514 141.931 124.852C136.658 121.877 134.541 115.369 137.056 109.867C138.461 106.793 138.461 103.262 137.056 100.189C134.541 94.6871 136.658 88.1786 141.931 85.2038C144.877 83.5419 146.956 80.6852 147.628 77.374C148.832 71.4469 154.376 67.4244 160.393 68.1128C163.755 68.4973 167.118 67.4061 169.611 65.1221ZM183.629 87.3527C184.28 87.3527 184.809 87.8803 184.809 88.5311V120.453C184.809 121.104 184.28 121.632 183.629 121.632H177.709C177.057 121.632 176.528 121.104 176.528 120.453V95.2423C176.528 95.1558 176.458 95.0856 176.372 95.0856C176.343 95.0856 176.314 95.0936 176.29 95.1086L170.446 98.676C169.66 99.1561 168.651 98.591 168.651 97.6707V93.2633C168.651 92.856 168.861 92.4776 169.207 92.2626L176.829 87.5304C177.016 87.4143 177.232 87.3527 177.452 87.3527H183.629Z"
        fill="white" stroke="#1C6B3B" strokeLinecap="round" strokeLinejoin="round"
      />
      <Defs>
        <LinearGradient id="lin_s3" x1="177.5" y1="0" x2="177.5" y2="191" gradientUnits="userSpaceOnUse">
          <Stop stopColor="white" /><Stop offset="1" stopColor="white" stopOpacity={0} />
        </LinearGradient>
        <RadialGradient id="rad_s3" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(177.5 33.33) rotate(90) scale(157.67 177.5)">
          <Stop stopColor="white" /><Stop offset="1" stopColor="white" stopOpacity={0} />
        </RadialGradient>
      </Defs>
    </Svg>
  );
}

// ─── Header slide 4 — Jaune, jeton XP ────────────────────────────────────────

function HeaderXP({ width }: { width: number }) {
  const height = Math.round((191 / 356) * width);
  return (
    <Svg width={width} height={height} viewBox="0 0 356 191" fill="none">
      <Path d="M1 20C1 8.95431 9.9543 0 21 0H336C347.046 0 356 8.9543 356 20V191H1V20Z" fill="#FFBC40" />
      <Path d="M0 20C0 8.95431 8.9543 0 20 0H335C346.046 0 355 8.9543 355 20V191H0V20Z" fill="url(#lin_s4)" fillOpacity={0.2} />
      <Path d="M0 20C0 8.95431 8.9543 0 20 0H335C346.046 0 355 8.9543 355 20V191H0V20Z" fill="url(#rad_s4)" fillOpacity={0.2} />
      <Path
        d="M160 76.7354C178.503 76.7354 193.5 91.6825 193.5 110.117C193.5 128.552 178.503 143.5 160 143.5C141.497 143.5 126.5 128.552 126.5 110.117C126.5 91.6825 141.497 76.7354 160 76.7354ZM164.629 95.8887C163.039 91.6058 156.961 91.6058 155.371 95.8887L153.394 101.216C152.995 102.288 152.146 103.135 151.068 103.532L145.724 105.503C141.426 107.088 141.426 113.148 145.724 114.732L151.068 116.703C152.146 117.1 152.995 117.947 153.394 119.02L155.371 124.347C156.961 128.63 163.039 128.63 164.629 124.347L166.606 119.02C167.005 117.947 167.854 117.1 168.932 116.703L174.276 114.732C178.574 113.148 178.574 107.088 174.276 105.503L168.932 103.532C167.854 103.135 167.005 102.288 166.606 101.216L164.629 95.8887ZM194 48.5C212.503 48.5 227.5 63.4479 227.5 81.8828C227.5 98.3118 215.588 111.97 199.899 114.747C200.075 113.228 200.167 111.683 200.167 110.117C200.167 88.8849 183.58 71.5181 162.618 70.1738C167.377 57.5128 179.633 48.5 194 48.5ZM160 108.453C160.506 109.056 161.065 109.612 161.669 110.117C161.065 110.622 160.506 111.179 160 111.781C159.493 111.179 158.935 110.622 158.33 110.117C158.935 109.612 159.493 109.056 160 108.453Z"
        fill="white" stroke="#AC700C"
      />
      <Defs>
        <LinearGradient id="lin_s4" x1="177.5" y1="0" x2="177.5" y2="191" gradientUnits="userSpaceOnUse">
          <Stop stopColor="white" /><Stop offset="1" stopColor="white" stopOpacity={0} />
        </LinearGradient>
        <RadialGradient id="rad_s4" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(177.5 33.33) rotate(90) scale(157.67 177.5)">
          <Stop stopColor="white" /><Stop offset="1" stopColor="white" stopOpacity={0} />
        </RadialGradient>
      </Defs>
    </Svg>
  );
}

// ─── Slides ───────────────────────────────────────────────────────────────────

function SlideWelcome({ w }: { w: number }) {
  return (
    <>
      <View style={styles.header}><HeaderWelcome width={w} /></View>
      <OutlinedText
        text={"BIENVENUE DANS STARTUP\nLUDO !"}
        style={styles.title}
        outlineColor="#1F91D0"
        outlineWidth={1.5}
      />
      <Text style={styles.description}>
        Créez des startups, relevez des défis entrepreneuriaux et bâtissez votre empire — le tout en jouant !
      </Text>
    </>
  );
}

function SlideRocket({ w }: { w: number }) {
  return (
    <>
      <View style={styles.header}><HeaderRocket width={w} /></View>
      <OutlinedText
        text={"CRÉER VOTRE\nENTREPRISES"}
        style={styles.title}
        outlineColor="#F35145"
        outlineWidth={1.5}
      />
      <Text style={styles.description}>
        3 cartes d'inspiration — une Cible, une Mission, un Secteur — guident votre idéation pour créer une startup unique.
      </Text>
    </>
  );
}

function SlideMedal({ w }: { w: number }) {
  return (
    <>
      <View style={styles.header}><HeaderMedal width={w} /></View>
      <OutlinedText
        text={"DEVENEZ LE MEILLEUR\nENTREPRENEUR"}
        style={styles.title}
        outlineColor="#388E3C"
        outlineWidth={1.5}
      />
      <Text style={styles.description}>
        Chaque partie ajoute une startup à votre portfolio. Regardez leur valorisation évoluer et grimpez au classement mondial !
      </Text>
    </>
  );
}

function SlideXP({ w }: { w: number }) {
  return (
    <>
      <View style={styles.header}><HeaderXP width={w} /></View>
      <OutlinedText
        text={"GAGNEZ DES XP, MONTEZ\nEN RANG"}
        style={styles.title}
        outlineColor="#CC9020"
        outlineWidth={1.5}
      />
      <Text style={styles.description}>
        Chaque partie ajoute une startup à votre portfolio. Regardez leur valorisation évoluer et grimpez au classement mondial !
      </Text>
    </>
  );
}

// ─── Indicateurs de progression (dots) ───────────────────────────────────────

function SlideDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current && styles.dotActive]}
        />
      ))}
    </View>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

const TOTAL_SLIDES = 4;

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}

// ─── Slide animé (se monte/démonte comme un GamePopup indépendant) ────────────

function AnimatedSlide({
  slideIndex,
  onNext,
  onSkip,
  isLast,
}: {
  slideIndex: number;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const [popupHeight, setPopupHeight] = useState(0);

  return (
    <Animated.View style={animStyle}>
      <View
        style={styles.popup}
        onLayout={(e) => setPopupHeight(e.nativeEvent.layout.height)}
      >
        {/* Background radial gradient */}
        {popupHeight > 0 && (
          <Svg style={StyleSheet.absoluteFill} width={POPUP_WIDTH} height={popupHeight}>
            <Defs>
              <RadialGradient id={`onbBg${slideIndex}`} cx="50%" cy="35%" r="75%">
                <Stop offset="0%" stopColor="#0F3A6B" stopOpacity="1" />
                <Stop offset="100%" stopColor="#081A2A" stopOpacity="1" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#onbBg${slideIndex})`} rx="24" />
          </Svg>
        )}

        <View style={styles.slideContent}>
          {slideIndex === 0 && <SlideWelcome w={POPUP_WIDTH} />}
          {slideIndex === 1 && <SlideRocket w={POPUP_WIDTH} />}
          {slideIndex === 2 && <SlideMedal w={POPUP_WIDTH} />}
          {slideIndex === 3 && <SlideXP w={POPUP_WIDTH} />}
        </View>

        <SlideDots current={slideIndex} total={TOTAL_SLIDES} />

        <View style={styles.buttonsRow}>
          <GameButton variant="blue" title="PASSER" style={styles.btn} onPress={onSkip} />
          <GameButton
            variant="yellow"
            title={isLast ? 'TERMINER' : 'SUIVANT'}
            style={styles.btn}
            onPress={onNext}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export const OnboardingModal = memo(function OnboardingModal({
  visible,
  onComplete,
}: OnboardingModalProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (visible) setSlideIndex(0);
  }, [visible]);

  const isLastSlide = slideIndex === TOTAL_SLIDES - 1;

  const goNext = useCallback(() => {
    if (isLastSlide) {
      onComplete();
      return;
    }
    setSlideIndex((i) => i + 1);
  }, [isLastSlide, onComplete]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onComplete}>
      <View style={styles.backdrop}>
        {/* key={slideIndex} force le démontage/remontage → animation d'entrée GamePopup à chaque slide */}
        <AnimatedSlide
          key={slideIndex}
          slideIndex={slideIndex}
          onNext={goNext}
          onSkip={onComplete}
          isLast={isLastSlide}
        />
      </View>
    </Modal>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },
  popup: {
    width: POPUP_WIDTH,
    backgroundColor: '#081A2A',
    borderRadius: 24,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[5],
    paddingBottom: SPACING[5],
    alignItems: 'center',
    overflow: 'hidden',
    maxHeight: screenHeight * 0.9,
  },
  slideContent: {
    width: '100%',
    alignItems: 'center',
  },
  // Header SVG — annule le padding du popup pour coller bord à bord en haut
  header: {
    marginTop: -SPACING[5],
    marginHorizontal: -SPACING[5],
    marginBottom: SPACING[4],
    alignSelf: 'stretch',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING[3],
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[4],
    paddingHorizontal: SPACING[1],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginBottom: SPACING[4],
    marginTop: SPACING[1],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
    borderRadius: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING[3],
    width: '100%',
  },
  btn: {
    flex: 1,
  },
});
