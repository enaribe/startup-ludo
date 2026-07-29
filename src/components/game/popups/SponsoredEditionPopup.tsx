/**
 * SponsoredEditionPopup — Popup « édition sponsorisée » (maquette Figma).
 *
 * Affiché quand le joueur choisit une édition sponsorisée : carte bleue
 * #1F91D0 avec le nom de l'édition, badge « Sponsorisé », visuel central,
 * texte « Cette thématique est sponsorisée par {sponsor}… en savoir plus »
 * et bouton « JOUER » qui valide le choix.
 *
 * Fermeture : tap sur le fond ou back Android (le choix n'est pas validé).
 */

import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect } from 'react';
import { Dimensions, Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { OutlinedText } from '@/components/ui/OutlinedText';
import type { EditionSponsor } from '@/data/types';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';

const { width: screenWidth } = Dimensions.get('window');
// Maquette : carte 363×465, padding latéral ≈ 21 (5.79 %)
const CARD_WIDTH = Math.min(screenWidth - SPACING[8], 363);
const CARD_PADDING = 21;

interface SponsoredEditionPopupProps {
  visible: boolean;
  /** Nom (localisé) de l'édition, ex. "Agritech". */
  editionName: string;
  sponsor: EditionSponsor;
  /** Libellé du bouton de validation (défaut : « JOUER »). Ex. « SUIVANT » dans le setup local. */
  buttonTitle?: string;
  /** Valide le choix de l'édition et ferme le popup. */
  onPlay: () => void;
  /** Ferme sans valider (tap fond / back). */
  onDismiss: () => void;
}

export const SponsoredEditionPopup = memo(function SponsoredEditionPopup({
  visible,
  editionName,
  sponsor,
  buttonTitle,
  onPlay,
  onDismiss,
}: SponsoredEditionPopupProps) {
  const { t } = useTranslation();

  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 240 });
      scale.value = withSpring(1, { damping: 15, stiffness: 140 });
    } else {
      opacity.value = 0;
      scale.value = 0.88;
    }
  }, [visible, opacity, scale]);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const openSponsorLink = () => {
    if (sponsor.linkUrl) {
      Linking.openURL(sponsor.linkUrl).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Fermer" />
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Overlay « Lighten » : dégradé linéaire + halo radial en haut (maquette) */}
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <RadialGradient id="sponsorCardHalo" cx="50%" cy="17%" r="60%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#sponsorCardHalo)" rx="20" />
          </Svg>

          {/* En-tête : nom de l'édition (texte avec contour, cf. maquette) + badge Sponsorisé */}
          <View style={styles.headerRow}>
            <View style={styles.editionNameWrap}>
              <OutlinedText
                text={editionName}
                style={styles.editionName}
                outlineColor="#0E699C"
                outlineWidth={1.5}
                numberOfLines={1}
              />
            </View>
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredBadgeText}>{t('sponsoredEdition.badge')}</Text>
            </View>
          </View>

          {/* Visuel central */}
          <Image source={{ uri: sponsor.imageUrl }} style={styles.sponsorImage} resizeMode="cover" />

          {/* Texte sponsor + lien « en savoir plus » */}
          <Text style={styles.sponsorText}>
            {t('sponsoredEdition.text', { name: sponsor.name })}
            {sponsor.linkUrl ? (
              <>
                {' '}
                <Text style={styles.learnMore} onPress={openSponsorLink}>
                  {t('sponsoredEdition.learnMore')}
                </Text>
              </>
            ) : null}
          </Text>

          {/* Bouton JOUER — même composant que le « SUIVANT » de l'écran d'édition */}
          <View style={styles.playButtonWrap}>
            <GameButton
              variant="yellow"
              fullWidth
              title={(buttonTitle ?? t('sponsoredEdition.play')).toUpperCase()}
              onPress={onPlay}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1F91D0',
    borderRadius: 20,
    paddingTop: 26,
    paddingBottom: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: CARD_PADDING,
    marginBottom: 18,
  },
  editionNameWrap: {
    flex: 1,
    marginRight: SPACING[2],
  },
  editionName: {
    fontFamily: FONTS.title,
    fontSize: 24,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  sponsoredBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sponsoredBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    lineHeight: 12,
    color: '#0E699C',
  },
  sponsorImage: {
    // Visuel quasi pleine largeur (maquette : petites marges ~10, plus larges
    // que le padding du texte/bouton), format paysage ≈ 16:10.
    marginHorizontal: 14,
    width: CARD_WIDTH - 28,
    aspectRatio: 343 / 216,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  sponsorText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: CARD_PADDING + SPACING[2],
  },
  learnMore: {
    fontFamily: FONTS.bodyBold,
    color: '#FEAB13',
  },
  playButtonWrap: {
    marginHorizontal: CARD_PADDING,
  },
});
