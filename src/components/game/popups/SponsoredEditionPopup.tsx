/**
 * SponsoredEditionPopup — Popup « édition sponsorisée » (maquette).
 *
 * Affiché quand le joueur choisit une édition sponsorisée : le visuel du
 * sponsor remplit TOUT le popup, et les éléments sont posés par-dessus :
 * nom de l'édition + badge « Sponsorisé » en haut, encart « En partenariat
 * avec » (logo dans un cadre blanc) + texte « Cette thématique est
 * sponsorisée par {sponsor}… en savoir plus », bouton « JOUER » en bas.
 *
 * Fermeture : tap sur le fond ou back Android (le choix n'est pas validé).
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useState } from 'react';
import { Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GameButton } from '@/components/ui/GameButton';
import { OutlinedText } from '@/components/ui/OutlinedText';
import type { EditionSponsor } from '@/data/types';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import { SponsorDetailModal } from './SponsorDetailModal';

const { width: screenWidth } = Dimensions.get('window');
// Maquette : carte ~276×291 (image plein cadre), padding intérieur ≈ 14
const CARD_WIDTH = Math.min(screenWidth - SPACING[8], 340);
const CARD_HEIGHT = Math.round(CARD_WIDTH * (291 / 276));
const CARD_PADDING = 14;

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
  // Écran de détail « en savoir plus » (visuel + description + bouton JOUER)
  const [showDetail, setShowDetail] = useState(false);

  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 240 });
      scale.value = withSpring(1, { damping: 15, stiffness: 140 });
    } else {
      opacity.value = 0;
      scale.value = 0.88;
      setShowDetail(false);
    }
  }, [visible, opacity, scale]);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Fermer" />
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Visuel sponsor plein cadre */}
          <Image
            source={{ uri: sponsor.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          {/* Scrim bas : assure la lisibilité du texte et du bouton sur la photo */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.72)']}
            locations={[0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* En-tête : nom de l'édition + badge Sponsorisé */}
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
              <Ionicons name="checkmark-circle" size={14} color="#1F91D0" />
              <Text style={styles.sponsoredBadgeText}>{t('sponsoredEdition.badge')}</Text>
            </View>
          </View>

          <View style={styles.flexSpacer} />

          {/* Encart partenariat : logo dans un cadre blanc + texte sponsor */}
          <View style={styles.partnerRow}>
            {sponsor.logoUrl ? (
              <View style={styles.logoCol}>
                <Text style={styles.partnerLabel}>{t('sponsoredEdition.partnership')}</Text>
                <View style={styles.logoBox}>
                  <Image
                    source={{ uri: sponsor.logoUrl }}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            ) : null}
            <Text style={styles.sponsorText}>
              {t('sponsoredEdition.text', { name: sponsor.name })}
            </Text>
          </View>

          {/* Bouton EN SAVOIR PLUS — ouvre l'écran de détail du sponsor */}
          <View style={styles.playButtonWrap}>
            <GameButton
              variant="yellow"
              fullWidth
              title={t('sponsoredEdition.learnMore').toUpperCase()}
              onPress={() => setShowDetail(true)}
            />
          </View>
        </Animated.View>

        {/* Écran de détail : description longue + bouton JOUER qui valide le choix */}
        <SponsorDetailModal
          visible={showDetail}
          editionName={editionName}
          sponsor={sponsor}
          buttonTitle={buttonTitle}
          onPlay={() => {
            setShowDetail(false);
            onPlay();
          }}
          onBack={() => setShowDetail(false)}
        />
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
    height: CARD_HEIGHT,
    backgroundColor: '#1F91D0',
    borderRadius: 20,
    paddingTop: CARD_PADDING,
    paddingBottom: CARD_PADDING,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sponsoredBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    lineHeight: 13,
    color: '#0E699C',
  },
  flexSpacer: {
    flex: 1,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginHorizontal: CARD_PADDING,
    marginBottom: 14,
  },
  logoCol: {
    alignItems: 'center',
  },
  partnerLabel: {
    fontFamily: FONTS.body,
    fontSize: 8,
    lineHeight: 10,
    color: '#FFFFFF',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  logoBox: {
    width: 76,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  sponsorText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 21,
    color: '#FFFFFF',
  },
  playButtonWrap: {
    marginHorizontal: CARD_PADDING,
  },
});
