/**
 * SponsorDetailModal — Écran « en savoir plus » d'une édition sponsorisée.
 *
 * Ouvert depuis le bouton EN SAVOIR PLUS du SponsoredEditionPopup : plein
 * écran fond sombre, header « NOUVELLE PARTIE » avec retour, carte visuel
 * du sponsor (nom de l'édition + badge « Sponsorisé » par-dessus), encart
 * « En partenariat avec » (logo + texte + lien externe), description longue,
 * et bouton JOUER en bas qui valide le choix de l'édition.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton } from '@/components/ui/GameButton';
import { OutlinedText } from '@/components/ui/OutlinedText';
import type { EditionSponsor } from '@/data/types';
import { useTranslation } from '@/i18n';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';

interface SponsorDetailModalProps {
  visible: boolean;
  /** Nom (localisé) de l'édition, ex. "Culture". */
  editionName: string;
  sponsor: EditionSponsor;
  /** Libellé du bouton de validation (défaut : « JOUER »). */
  buttonTitle?: string;
  /** Valide le choix de l'édition. */
  onPlay: () => void;
  /** Retour (chevron ou back Android) — revient au popup. */
  onBack: () => void;
}

export const SponsorDetailModal = memo(function SponsorDetailModal({
  visible,
  editionName,
  sponsor,
  buttonTitle,
  onPlay,
  onBack,
}: SponsorDetailModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onBack}>
      <View style={styles.container}>
        {/* Header : retour + titre */}
        <View style={[styles.headerRow, { paddingTop: insets.top + SPACING[2] }]}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color="#FFBC40" />
          </Pressable>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>{t('game.newGameTitle')}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Carte visuel sponsor : nom de l'édition + badge par-dessus l'image */}
          <View style={styles.imageCard}>
            <Image
              source={{ uri: sponsor.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.imageHeaderRow}>
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
          </View>

          {/* Encart partenariat : logo + texte sponsor + lien externe */}
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

          {/* Description longue (renseignée dans l'admin) */}
          {sponsor.description ? (
            <Text style={styles.description}>{sponsor.description}</Text>
          ) : null}
        </ScrollView>

        {/* Bouton JOUER fixe en bas */}
        <View style={[styles.playButtonWrap, { paddingBottom: insets.bottom + SPACING[4] }]}>
          <GameButton
            variant="yellow"
            fullWidth
            title={(buttonTitle ?? t('sponsoredEdition.play')).toUpperCase()}
            onPress={onPlay}
          />
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING[3],
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 21,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[2],
    paddingBottom: SPACING[8],
  },
  imageCard: {
    width: '100%',
    aspectRatio: 343 / 216,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1F91D0',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  imageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editionNameWrap: {
    flex: 1,
    marginRight: SPACING[2],
  },
  editionName: {
    fontFamily: FONTS.title,
    fontSize: 22,
    lineHeight: 26,
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
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    marginTop: SPACING[6],
  },
  logoCol: {
    alignItems: 'center',
  },
  partnerLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 9,
    lineHeight: 11,
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
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  description: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    lineHeight: 25,
    color: '#FFFFFF',
    marginTop: SPACING[6],
  },
  playButtonWrap: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[3],
  },
});
