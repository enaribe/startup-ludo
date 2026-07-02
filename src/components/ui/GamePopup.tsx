/**
 * GamePopup — Composant de base pour tous les popups du jeu
 *
 * DESIGN SYSTEM POPUP :
 * ─────────────────────────────────────────────────────────────────
 * Caractéristiques visuelles communes à tous les popups :
 *
 * 1. FOND GLOBAL : backdrop semi-transparent `COLORS.overlayDark`
 *    centré plein écran via Modal transparent
 *
 * 2. POPUP CONTAINER : borderRadius 24, overflow hidden
 *    Largeur : Math.min(screenWidth - SPACING[8], 340)
 *    Hauteur max : screenHeight * 0.85
 *
 * 3. BACKGROUND RADIAL GRADIENT (SVG absoluteFill) :
 *    cx="50%" cy="35%" r="75%"
 *    #0F3A6B (centre) → #081A2A (bords)
 *
 * 4. BORDER GRADIENT EXTÉRIEUR (SVG absoluteFill, borderRadius 24) :
 *    LinearGradient diagonal 0%→100% :
 *    #9A9A9A 0.3 | #707070 0.2 | #B0B0B0 0.35 | #606060 0.2 | #9A9A9A 0.3
 *    strokeWidth: 1.5 — nécessite onLayout pour la hauteur dynamique
 *
 * 5. ANIMATION D'ENTRÉE :
 *    opacity : withTiming(1, 280ms)
 *    scale   : withSpring(1, damping 14, stiffness 130) depuis 0.85
 *
 * 6. SHAPE TOURNANTE (optionnelle, derrière l'icône) :
 *    assets/images/shape.png — 240×240 — opacity 1
 *    withRepeat(withTiming(360, 12000ms, Easing.linear), -1)
 *    position: absolute, centré sur l'icône
 *
 * 7. ICÔNE : placée dans un View avec justifyContent/alignItems center
 *    La shape tournante est position:absolute derrière l'icône
 *
 * 8. TEXTES :
 *    - Header/sous-titre : FONTS.body, FONT_SIZES.sm, COLORS.textSecondary
 *    - Titre principal   : FONTS.title, FONT_SIZES.xl, COLORS.text
 *    - Valeur mise en avant : FONTS.title, FONT_SIZES['3xl'], COLORS.text
 *
 * 9. BLOC INFO (ex: XP) : fond rgba(0,0,0,0.30), borderRadius 14
 *    Même border gradient gris que le popup extérieur (via onLayout)
 *
 * 10. BOUTON : GameButton variant="yellow" fullWidth
 *
 * USAGE :
 * ───────
 * <GamePopup
 *   visible={visible}
 *   onRequestClose={onClose}
 *   icon={<MonIcon />}
 *   spinningShape           // active la shape tournante
 *   header="Sous-titre"
 *   title="TITRE PRINCIPAL"
 *   footer={<GameButton ... />}
 * >
 *   {contenu personnalisé}
 * </GamePopup>
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const GAME_POPUP_WIDTH = Math.min(screenWidth - SPACING[8], 340);
const BORDER_W = 1.5;

// Conversion sûre en string SVG — évite le bug locale FR/Motorola où
// react-native-svg natif Android peut interpréter "1.5" comme "1,5" et
// crasher sur PathParser.parse_number ("Invalid number formating chara").
const svgNum = (n: number): string => {
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(4).replace(/\.?0+$/, '') || '0';
};

// ─── Shape tournante ────────────────────────────────────────────────────────

export function GamePopupSpinningShape({ size = 240 }: { size?: number }) {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size, justifyContent: 'center', alignItems: 'center' }, animatedStyle]}>
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../../assets/images/shape.png')}
        style={{ width: size, height: size, opacity: 1 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ─── Border gradient gris (réutilisable sur n'importe quel bloc) ─────────────

export function GamePopupGradientBorder({
  width,
  height,
  borderRadius = 14,
  gradientId,
}: {
  width: number;
  height: number;
  borderRadius?: number;
  gradientId: string;
}) {
  if (height === 0 || !Number.isFinite(width) || !Number.isFinite(height)) return null;
  return (
    <Svg width={svgNum(width)} height={svgNum(height)} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%"   stopColor="#9A9A9A" stopOpacity="0.3"  />
          <Stop offset="25%"  stopColor="#707070" stopOpacity="0.2"  />
          <Stop offset="50%"  stopColor="#B0B0B0" stopOpacity="0.35" />
          <Stop offset="75%"  stopColor="#606060" stopOpacity="0.2"  />
          <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3"  />
        </LinearGradient>
      </Defs>
      <Rect
        x={svgNum(BORDER_W / 2)}
        y={svgNum(BORDER_W / 2)}
        width={svgNum(width - BORDER_W)}
        height={svgNum(height - BORDER_W)}
        rx={svgNum(borderRadius)}
        ry={svgNum(borderRadius)}
        fill="transparent"
        stroke={`url(#${gradientId})`}
        strokeWidth={svgNum(BORDER_W)}
      />
    </Svg>
  );
}

// ─── Wrapper border extérieur du popup ──────────────────────────────────────

function OuterBorderWrapper({ children, height }: { children: React.ReactNode; height: number }) {
  if (height === 0) return <>{children}</>;
  return (
    <View style={{ width: GAME_POPUP_WIDTH, borderRadius: 24 }}>
      <GamePopupGradientBorder
        width={GAME_POPUP_WIDTH}
        height={height}
        borderRadius={24}
        gradientId="gamePopupOuterBorder"
      />
      {children}
    </View>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface GamePopupProps {
  /** Contrôle la visibilité */
  visible: boolean;
  /** Appelé sur back gesture ou fermeture */
  onRequestClose: () => void;
  /** Texte du sous-titre (ex: "Progression", "Partie solo") */
  header?: string;
  /** Titre principal en majuscules — string ou ReactNode (ex: OutlinedText) */
  title?: string | React.ReactNode;
  /** Icône affichée au centre (SVG, Image, etc.) */
  icon?: React.ReactNode;
  /** Active la shape PNG tournante derrière l'icône */
  spinningShape?: boolean;
  /** Taille de la shape tournante (défaut 240) */
  spinningShapeSize?: number;
  /** Contenu principal (blocs XP, cartes, etc.) */
  children?: React.ReactNode;
  /** Bouton(s) en bas du popup */
  footer?: React.ReactNode;
  /** Affiche un bouton « X » en haut à droite pour fermer (défaut: false). */
  showCloseButton?: boolean;
  /** Ferme le popup au tap en dehors du contenu (défaut: false). */
  closeOnBackdrop?: boolean;
}

export function GamePopup({
  visible,
  onRequestClose,
  header,
  title,
  icon,
  spinningShape = false,
  spinningShapeSize = 240,
  children,
  footer,
  showCloseButton = false,
  closeOnBackdrop = false,
}: GamePopupProps) {
  const popupScale = useSharedValue(0.85);
  const popupOpacity = useSharedValue(0);
  const [popupHeight, setPopupHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      popupOpacity.value = withTiming(1, { duration: 280 });
      popupScale.value = withSpring(1, { damping: 14, stiffness: 130 });
    } else {
      popupOpacity.value = 0;
      popupScale.value = 0.85;
    }
  }, [visible, popupOpacity, popupScale]);

  const popupStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ scale: popupScale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Couche de fermeture au tap extérieur (n'intercepte rien si désactivée) */}
        {closeOnBackdrop && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onRequestClose}
            accessibilityLabel="Fermer"
          />
        )}
        <Animated.View style={popupStyle}>
          <OuterBorderWrapper height={popupHeight}>
            <View
              style={styles.popup}
              onLayout={(e) => setPopupHeight(e.nativeEvent.layout.height)}
            >
              {/* Bouton X de fermeture */}
              {showCloseButton && (
                <Pressable
                  onPress={onRequestClose}
                  style={styles.closeButton}
                  hitSlop={10}
                  accessibilityLabel="Fermer"
                >
                  <Ionicons name="close" size={20} color={COLORS.white} />
                </Pressable>
              )}
              {/* Background radial gradient */}
              <Svg style={StyleSheet.absoluteFill} width={svgNum(GAME_POPUP_WIDTH)} height={svgNum(popupHeight || 1)}>
                <Defs>
                  <RadialGradient id="gamePopupBg" cx="50%" cy="35%" r="75%">
                    <Stop offset="0%"   stopColor="#0F3A6B" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#081A2A" stopOpacity="1" />
                  </RadialGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#gamePopupBg)" rx="24" />
              </Svg>

              {/* Header */}
              {header && (
                <Animated.View entering={FadeIn.delay(80).duration(300)}>
                  <Text style={styles.header}>{header}</Text>
                </Animated.View>
              )}

              {/* Icône + shape tournante optionnelle */}
              {icon && (
                <Animated.View entering={FadeInDown.delay(160).duration(320)} style={styles.iconContainer}>
                  {spinningShape && <GamePopupSpinningShape size={spinningShapeSize} />}
                  {icon}
                </Animated.View>
              )}

              {/* Titre */}
              {title && (
                <Animated.View entering={FadeInDown.delay(240).duration(320)}>
                  {typeof title === 'string' ? (
                    <Text style={styles.title}>{title}</Text>
                  ) : (
                    title
                  )}
                </Animated.View>
              )}

              {/* Contenu */}
              {children && (
                <Animated.View entering={FadeInDown.delay(300).duration(320)} style={styles.content}>
                  {children}
                </Animated.View>
              )}

              {/* Footer / boutons */}
              {footer && (
                <Animated.View entering={FadeInDown.delay(380).duration(320)} style={styles.footer}>
                  {footer}
                </Animated.View>
              )}
            </View>
          </OuterBorderWrapper>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
    width: GAME_POPUP_WIDTH,
    backgroundColor: '#081A2A',
    borderRadius: 24,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[5],
    paddingBottom: SPACING[5],
    alignItems: 'center',
    overflow: 'hidden',
    maxHeight: screenHeight * 0.85,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING[4],
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  content: {
    width: '100%',
  },
  footer: {
    width: '100%',
    marginTop: SPACING[2],
  },
});
