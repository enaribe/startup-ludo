/**
 * TutorialOverlay — couche de guidage interactif par-dessus le plateau.
 *
 * Deux formats d'étape, harmonisés avec le design system des popups (fin de
 * partie / GamePopup) :
 *  - Étape SANS cible (intro / conclusion) → vrai GamePopup centré.
 *  - Étape AVEC cible → bulle ancrée près de l'élément, avec flèche, habillée
 *    du même fond radial + bordure gradient gris que les popups du jeu.
 */
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { GameButton } from '@/components/ui/GameButton';
import { GamePopup, GamePopupGradientBorder } from '@/components/ui/GamePopup';
import { TUTORIAL_STEPS } from '@/config/tutorialSteps';
import { useTutorialStore, type TargetRect } from '@/stores/useTutorialStore';
import { useTranslation } from '@/i18n';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/** Marge ajoutée autour de l'élément ciblé pour le halo. */
const SPOT_PADDING = 10;
/** Largeur de la bulle ancrée. */
const BUBBLE_WIDTH = Math.min(SCREEN_W - SPACING[4] * 2, 320);
/** Hauteur réservée pour décider du placement (au-dessus / dessous). */
const BUBBLE_EST_HEIGHT = 210;

interface TutorialOverlayProps {
  /**
   * Hauteur de la zone haute interdite (header du plateau) : la bulle ne
   * remontera jamais au-dessus de cette limite, pour ne pas être masquée.
   */
  safeTop?: number;
  /** Marge basse sûre (insets bas + footer). */
  safeBottom?: number;
}

export function TutorialOverlay({ safeTop = 110, safeBottom = 90 }: TutorialOverlayProps) {
  const { t } = useTranslation();
  const active = useTutorialStore((s) => s.active);
  const stepIndex = useTutorialStore((s) => s.stepIndex);
  const targets = useTutorialStore((s) => s.targets);
  const next = useTutorialStore((s) => s.next);
  const finish = useTutorialStore((s) => s.finish);
  const skip = useTutorialStore((s) => s.skip);

  // Hauteur réelle de la bulle (mesurée) pour un placement précis
  const [bubbleH, setBubbleH] = useState(BUBBLE_EST_HEIGHT);

  // Sécurité : si l'index dépasse, on termine
  useEffect(() => {
    if (active && stepIndex >= TUTORIAL_STEPS.length) finish();
  }, [active, stepIndex, finish]);

  if (!active) return null;
  const step = TUTORIAL_STEPS[stepIndex];
  if (!step) return null;

  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;
  const isFirst = stepIndex === 0;
  const rect: TargetRect | undefined = step.target ? targets[step.target] : undefined;

  const handleNext = () => {
    if (isLast) finish();
    else next();
  };

  // ── Contenu commun (compteur, titre, texte, points, boutons) ──
  const StepBody = (
    <>
      <Text style={styles.stepCounter}>
        {t('tutorial.step', { current: stepIndex + 1, total: TUTORIAL_STEPS.length })}
      </Text>
      <Text style={styles.title}>{t(step.titleKey)}</Text>
      <Text style={styles.text}>{t(step.textKey)}</Text>

      <View style={styles.dotsRow}>
        {TUTORIAL_STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {!isLast && (
          <Pressable onPress={skip} hitSlop={8} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('tutorial.skip')}</Text>
          </Pressable>
        )}
        <View style={styles.nextBtnWrap}>
          <GameButton
            title={isLast ? t('tutorial.finish') : isFirst ? t('tutorial.start') : t('tutorial.next')}
            variant="yellow"
            fullWidth
            onPress={handleNext}
          />
        </View>
      </View>
    </>
  );

  // Étape ciblée dont la position n'est pas encore connue : on affiche juste
  // le voile en attendant la mesure (la re-mesure côté écran de jeu suit).
  // Évite de dégrader l'étape en popup centré sans flèche.
  if (step.target && !rect) {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        style={StyleSheet.absoluteFill}
        pointerEvents="auto"
      >
        <View style={styles.scrim} />
      </Animated.View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CAS 1 — étape sans cible : vrai GamePopup centré (style fin de partie)
  // ─────────────────────────────────────────────────────────────
  if (!step.target || !rect) {
    return (
      <GamePopup
        visible
        onRequestClose={handleNext}
        spinningShape
        icon={
          <View style={styles.popupIcon}>
            <Ionicons
              name={isLast ? 'rocket' : 'bulb'}
              size={42}
              color={COLORS.primary}
            />
          </View>
        }
        header={t('tutorial.step', { current: stepIndex + 1, total: TUTORIAL_STEPS.length })}
        title={t(step.titleKey)}
        footer={
          <View style={styles.actions}>
            {!isLast && (
              <Pressable onPress={skip} hitSlop={8} style={styles.skipBtn}>
                <Text style={styles.skipText}>{t('tutorial.skip')}</Text>
              </Pressable>
            )}
            <View style={styles.nextBtnWrap}>
              <GameButton
                title={isLast ? t('tutorial.finish') : t('tutorial.start')}
                variant="yellow"
                fullWidth
                onPress={handleNext}
              />
            </View>
          </View>
        }
      >
        <Text style={styles.popupText}>{t(step.textKey)}</Text>
        <View style={styles.dotsRowCentered}>
          {TUTORIAL_STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
          ))}
        </View>
      </GamePopup>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CAS 2 — étape avec cible : bulle ancrée + flèche
  // ─────────────────────────────────────────────────────────────
  const spotStyle = {
    left: rect.x - SPOT_PADDING,
    top: rect.y - SPOT_PADDING,
    width: rect.width + SPOT_PADDING * 2,
    height: rect.height + SPOT_PADDING * 2,
  };

  // Place la bulle SOUS la cible si possible, sinon AU-DESSUS — mais sans
  // jamais empiéter sur le header (safeTop) ni le footer (safeBottom).
  const spaceBelow = SCREEN_H - (rect.y + rect.height) - safeBottom;
  const spaceAbove = rect.y - safeTop;

  // `arrowAbove` = la flèche pointe vers le haut → la bulle est SOUS la cible.
  let arrowAbove: boolean;
  if (spaceBelow >= bubbleH + 50) {
    // assez de place dessous → bulle dessous
    arrowAbove = true;
  } else if (spaceAbove >= bubbleH + 50) {
    // pas de place dessous mais place dessus → bulle au-dessus
    arrowAbove = false;
  } else {
    // cible trop grande (ex. plateau) → bulle forcée en bas de l'écran
    arrowAbove = true;
  }

  let bubbleTop: number;
  if (arrowAbove && spaceBelow >= bubbleH + 50) {
    bubbleTop = rect.y + rect.height + SPOT_PADDING + 26;
  } else if (!arrowAbove) {
    bubbleTop = rect.y - SPOT_PADDING - bubbleH - 26;
  } else {
    // Cas « forcée en bas » : on la colle au bas de la zone sûre
    bubbleTop = SCREEN_H - safeBottom - bubbleH - SPACING[4];
  }

  // Garde-fou final : jamais sous le header, jamais sous le footer
  bubbleTop = Math.max(
    safeTop,
    Math.min(bubbleTop, SCREEN_H - safeBottom - bubbleH)
  );

  const bubbleLeft = (SCREEN_W - BUBBLE_WIDTH) / 2;

  // Flèche : centrée sur la cible, bornée à la largeur de la bulle
  const arrowLeft = Math.max(
    bubbleLeft + 16,
    Math.min(rect.x + rect.width / 2 - 14, bubbleLeft + BUBBLE_WIDTH - 42)
  );
  const arrowTop = arrowAbove ? bubbleTop - 24 : bubbleTop + bubbleH - 4;

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      {/* Voile sombre — bloque les interactions avec le jeu pendant le guide */}
      <View style={styles.scrim} pointerEvents="auto" />

      {/* Halo lumineux sur l'élément ciblé */}
      <Animated.View
        key={`spot-${stepIndex}`}
        entering={FadeIn.duration(220)}
        style={[styles.spot, spotStyle]}
        pointerEvents="none"
      />

      {/* Flèche pointant la cible */}
      <View style={[styles.arrow, { left: arrowLeft, top: arrowTop }]} pointerEvents="none">
        <Ionicons
          name={arrowAbove ? 'caret-up' : 'caret-down'}
          size={28}
          color={COLORS.primary}
        />
      </View>

      {/* Bulle — habillée comme un popup du jeu (fond radial + bordure gradient) */}
      <Animated.View
        key={`bubble-${stepIndex}`}
        entering={FadeIn.duration(260)}
        style={[styles.bubble, { top: bubbleTop, left: bubbleLeft, width: BUBBLE_WIDTH }]}
        onLayout={(e) => setBubbleH(e.nativeEvent.layout.height)}
        pointerEvents="auto"
      >
        {/* Fond radial identique aux popups du jeu */}
        <Svg style={StyleSheet.absoluteFill} width={BUBBLE_WIDTH} height={bubbleH}>
          <Defs>
            <RadialGradient id="tutoBubbleBg" cx="50%" cy="35%" r="80%">
              <Stop offset="0%" stopColor="#0F3A6B" stopOpacity="1" />
              <Stop offset="100%" stopColor="#081A2A" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#tutoBubbleBg)" rx="18" />
        </Svg>
        {/* Bordure gradient gris du design system */}
        <GamePopupGradientBorder
          width={BUBBLE_WIDTH}
          height={bubbleH}
          borderRadius={18}
          gradientId="tutoBubbleBorder"
        />

        <View style={styles.bubbleInner}>{StepBody}</View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 12, 24, 0.82)',
  },
  spot: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
  },
  arrow: {
    position: 'absolute',
  },

  // Bulle ancrée
  bubble: {
    position: 'absolute',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#081A2A',
  },
  bubbleInner: {
    padding: SPACING[4],
  },

  // Contenu commun
  stepCounter: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: SPACING[1],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    marginBottom: SPACING[2],
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },

  // Contenu popup centré
  popupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,188,64,0.12)',
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 21,
    textAlign: 'center',
  },

  // Points de progression
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING[3],
    marginBottom: SPACING[3],
  },
  dotsRowCentered: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: SPACING[4],
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 18,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    width: '100%',
  },
  skipBtn: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[2],
  },
  skipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  nextBtnWrap: {
    flex: 1,
  },
});
