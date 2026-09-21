/**
 * SponsorEventPopup — Carte SPONSOR tirée en partie.
 *
 * Deux générations de cartes cohabitent :
 *   - modèle historique (édition sponsorisée) : recto seul, comme avant ;
 *   - campagne annonceur (feed, lot 4) : RECTO/VERSO. Le verso porte la mention
 *     « Sponsorisé par X », la description détaillée, l'avantage, les critères,
 *     la date limite et le CTA au libellé configuré par l'annonceur.
 *
 * LE FLIP est un retournement 3D (rotateY) avec échange du contenu à mi-course
 * (90°) : la face arrière n'est jamais rendue en miroir, et les deux faces
 * peuvent avoir des hauteurs différentes sans artefacts. Le premier flip d'une
 * carte est compté (`trackSponsorCardFlip`) — c'est le « taux de curiosité »
 * du tableau de bord annonceur.
 */

import { memo, useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { GameButton } from '@/components/ui/GameButton';
import { Modal } from '@/components/ui/Modal';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import { useTranslation } from '@/i18n';
import { saveSponsorOpportunity } from '@/services/firebase/savedOpportunityService';
import {
  signalerCarteSponsor,
  trackSponsorCardClick,
  trackSponsorCardFlip,
  trackSponsorCardSave,
  trackSponsorCardView,
} from '@/services/firebase/sponsorMetricsService';
import { useAuthStore } from '@/stores';
import type { SavedSponsorOpportunity } from '@/types';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { OpportunityHeader } from './OpportunityHeader';
import { FundingHeader, makeFundLabel } from './FundingPopup';

/** Verso d'une carte campagne (contrat du feed annonceur). */
export interface SponsorVersoContent {
  description: string;
  avantage?: string;
  criteres?: string;
  dateLimite?: string;
}

interface SponsorEventPopupProps {
  visible: boolean;
  /** Libellé du header : OPPORTUNITÉ, FINANCEMENT ou ÉVÉNEMENT. */
  label: string;
  /**
   * Type de carte — décide du BANDEAU.
   *
   * Une carte de financement s'affichait sous le bandeau opportunité
   * (ampoule verte) : elle annonçait un type et en montrait un autre. Passé
   * explicitement plutôt que déduit du `label`, qui est traduit et ne peut pas
   * servir de test.
   */
  kind?: 'opportunite' | 'financement' | 'evenement';
  /** Texte de la carte sponsor (recto). */
  description: string;
  /** Jetons gagnés (badge « +N »). */
  value: number;
  /** Logo du sponsor affiché au-dessus du texte. */
  logoUrl?: string;
  /** Texte du bandeau spectateur (adversaire/IA joue). */
  spectatorText?: string;
  /**
   * Payload du bouton « Sauvegarder » (carte avec lien externe) — le joueur
   * la retrouve dans son Profil après la partie. Absent si la carte n'a pas de lien.
   */
  savePayload?: Omit<SavedSponsorOpportunity, 'savedAt'>;
  /**
   * Identifiants pour le comptage des métriques (vue, flip, clic, sauvegarde).
   * `editionId` est la CLÉ du doc sponsorMetrics : id d'édition (modèle
   * historique) ou id de campagne (feed). Optionnels : sans eux, rien n'est
   * compté et le popup fonctionne comme avant.
   */
  cardId?: string;
  editionId?: string;
  // ===== Verso (campagne annonceur, lot 4) =====
  /** Nom de la structure (« Sponsorisé par X »). */
  structure?: string;
  /** Libellé du CTA du verso, configuré par l'annonceur. */
  ctaLabel?: string;
  /** Contenu du verso — sa présence active le flip. */
  verso?: SponsorVersoContent;
  /** URL ouverte par le CTA du verso. */
  ctaUrl?: string;
  onAccept: () => void;
  onClose: () => void;
  isSpectator?: boolean;
  onSpectatorClose?: () => void;
}

export const SponsorEventPopup = memo(function SponsorEventPopup({
  visible,
  label,
  kind,
  description,
  value,
  logoUrl,
  spectatorText,
  savePayload,
  cardId,
  editionId,
  structure,
  ctaLabel,
  verso,
  ctaUrl,
  onAccept,
  onClose,
  isSpectator = false,
  onSpectatorClose,
}: SponsorEventPopupProps) {
  const { t } = useTranslation();
  usePlaySoundOnOpen(visible, 'popup-open');

  const user = useAuthStore((state) => state.user);
  const canSave = !!savePayload && !!user && !user.isGuest;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signalee, setSignalee] = useState(false);

  // ── Flip recto/verso ──
  const rotation = useSharedValue(0);
  const [faceVerso, setFaceVerso] = useState(false);
  const flipCompte = useRef(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aUnVerso = !!verso?.description;

  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
  }));

  const basculer = () => {
    if (!aUnVerso) return;
    const versVerso = !faceVerso;
    rotation.value = withTiming(versVerso ? 180 : 0, { duration: 450 });
    // Échange du contenu à mi-course : la face n'apparaît jamais en miroir.
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(() => setFaceVerso(versVerso), 225);
    // Premier retournement de CETTE carte = un « flip » (taux de curiosité).
    if (versVerso && !flipCompte.current && editionId && cardId) {
      flipCompte.current = true;
      trackSponsorCardFlip(editionId, cardId);
    }
  };

  const ouvrirCta = () => {
    if (!ctaUrl) return;
    if (editionId && cardId) trackSponsorCardClick(editionId, cardId);
    Linking.openURL(ctaUrl).catch(() => {
      // Lien mort : la modération le mettra en pause à la vérification hebdo.
    });
  };

  // Nouvelle carte affichée → réinitialise sauvegarde ET face affichée
  useEffect(() => {
    if (visible) {
      setSaved(false);
      setSaving(false);
      setSignalee(false);
      setFaceVerso(false);
      rotation.value = 0;
      flipCompte.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, savePayload?.id, cardId]);

  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    []
  );

  /**
   * Garde anti-double-comptage : mémorise la clé « édition/carte » de la
   * DERNIÈRE vue comptée. Le popup étant monté en permanence (visible bascule),
   * ce useEffect se rejoue à chaque re-render de la partie ; sans cette garde on
   * compterait une vue par render au lieu d'une par affichage.
   * La clé est remise à null à la fermeture, donc une même carte revue plus tard
   * (autre partie, autre joueur) recompte bien une nouvelle vue.
   */
  const countedViewKey = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) {
      countedViewKey.current = null;
      return;
    }
    if (!editionId || !cardId) return;

    const key = `${editionId}/${cardId}`;
    if (countedViewKey.current === key) return;
    countedViewKey.current = key;

    // CHOIX DOCUMENTÉ — la vue SPECTATEUR compte comme une vue normale.
    // Le popup sponsor s'affiche à toute la table (le joueur actif comme les
    // spectateurs qui regardent l'IA ou un adversaire jouer) : le sponsor est
    // donc réellement vu par chacun d'eux, et chaque paire d'yeux doit être
    // facturée. On ne distingue pas les deux cas pour garder un compteur unique
    // simple à lire côté admin ; `isSpectator` reste disponible si le besoin de
    // les séparer apparaît plus tard.
    trackSponsorCardView(editionId, cardId);
  }, [visible, editionId, cardId]);

  const handleSave = async () => {
    if (!canSave || !savePayload || saved || saving) return;
    setSaving(true);
    try {
      // `editionId` est stocké avec l'item : il permettra d'attribuer le CLIC
      // (ouverture du lien depuis le profil) à la bonne édition sponsorisée.
      await saveSponsorOpportunity(user.id, {
        ...savePayload,
        ...(editionId ? { editionId } : {}),
        savedAt: Date.now(),
      });
      setSaved(true);
      // Compté APRÈS succès uniquement — et une seule fois, le bouton se
      // désactive dès `saved` (garde `saved || saving` en entrée du handler).
      if (editionId && cardId) trackSponsorCardSave(editionId, cardId);
      if (__DEV__) console.log(`[Sponsor] Opportunité sauvegardée dans le profil (${savePayload.id})`);
    } catch (error) {
      // Offline / règles non déployées : le joueur peut réessayer
      console.warn('[Sponsor] Échec de la sauvegarde de l\'opportunité', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={FadeIn.duration(220)} style={flipStyle}>
        {/* Contre-rotation à 180° : le contenu du verso reste lisible. */}
        <View style={[styles.card, faceVerso && styles.cardMirror]}>
          {kind === 'financement' ? (
            <FundingHeader label={makeFundLabel(label)} />
          ) : (
            <OpportunityHeader label={label} />
          )}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {isSpectator && spectatorText && !faceVerso && (
              <View style={styles.spectatorBanner}>
                <Ionicons name="eye" size={14} color={COLORS.white} />
                <Text style={styles.spectatorText}>{spectatorText}</Text>
              </View>
            )}

            {!faceVerso ? (
              <>
                {/* ═══ RECTO ═══ */}
                <View style={styles.descriptionBox}>
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.sponsorLogo} resizeMode="contain" />
                  ) : null}
                  <Text style={styles.description}>{description}</Text>
                </View>

                <Animated.View entering={FadeInDown.delay(200).duration(250)} style={styles.gainRow}>
                  <View style={styles.badge}>
                    <OutlinedText
                      text={`+${value}`}
                      style={styles.badgeText}
                      outlineColor="#2E7D32"
                      outlineWidth={2}
                    />
                  </View>
                </Animated.View>

                {/* Pilule flip — cartes campagne uniquement */}
                {aUnVerso && (
                  <Pressable onPress={basculer} style={styles.flipButton} hitSlop={6}>
                    <Ionicons name="sync" size={15} color="#2E7D32" />
                    <Text style={styles.flipText}>{t('sponsorEvent.flipDetails')}</Text>
                  </Pressable>
                )}

                {canSave && (
                  <Animated.View entering={FadeInDown.delay(300).duration(220)} style={styles.saveWrap}>
                    <Pressable
                      onPress={handleSave}
                      disabled={saved || saving}
                      style={[styles.saveButton, saved && styles.saveButtonSaved]}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={saved ? 'checkmark-circle' : 'bookmark-outline'}
                        size={17}
                        color={saved ? '#2E7D32' : COLORS.info}
                      />
                      <Text style={[styles.saveText, saved && styles.saveTextSaved]}>
                        {saved ? t('sponsorEvent.saved') : t('sponsorEvent.save')}
                      </Text>
                    </Pressable>
                  </Animated.View>
                )}

                {!isSpectator && (
                  <Animated.View entering={FadeInDown.delay(400).duration(220)} style={styles.buttonWrap}>
                    <GameButton
                      title={t('eventPopup.continue')}
                      onPress={onAccept}
                      variant="green"
                      fullWidth
                    />
                  </Animated.View>
                )}

                {isSpectator && onSpectatorClose && (
                  <Animated.View entering={FadeInDown.delay(300).duration(220)} style={styles.buttonWrap}>
                    <GameButton title={t('eventPopup.close')} onPress={onSpectatorClose} variant="blue" fullWidth />
                  </Animated.View>
                )}
              </>
            ) : (
              <>
                {/* ═══ VERSO ═══ */}
                <View style={styles.descriptionBox}>
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.sponsorLogoSmall} resizeMode="contain" />
                  ) : null}
                  {!!structure && (
                    <Text style={styles.sponsoredBy}>
                      {t('sponsorEvent.sponsoredBy', { name: structure })}
                    </Text>
                  )}
                  <Text style={styles.versoDescription}>{verso?.description}</Text>

                  {!!verso?.avantage && (
                    <Text style={styles.versoLigne}>
                      <Text style={styles.versoLibelle}>{t('sponsorEvent.advantage')} : </Text>
                      {verso.avantage}
                    </Text>
                  )}
                  {!!verso?.criteres && (
                    <Text style={styles.versoLigne}>
                      <Text style={styles.versoLibelle}>{t('sponsorEvent.eligibility')} : </Text>
                      {verso.criteres}
                    </Text>
                  )}
                  {!!verso?.dateLimite && (
                    <Text style={[styles.versoLigne, styles.versoDeadline]}>
                      <Text style={styles.versoLibelle}>{t('sponsorEvent.deadline')} : </Text>
                      {new Date(verso.dateLimite).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {/* CTA de l'annonceur — remplace CONTINUER sur cette face */}
                {!!ctaUrl && (
                  <View style={styles.buttonWrap}>
                    <GameButton
                      title={ctaLabel || t('sponsorEvent.learnMore')}
                      onPress={ouvrirCta}
                      variant="green"
                      fullWidth
                    />
                  </View>
                )}

                <Pressable onPress={basculer} style={[styles.flipButton, styles.flipButtonVerso]} hitSlop={6}>
                  <Ionicons name="sync" size={15} color="#2E7D32" />
                  <Text style={styles.flipText}>{t('sponsorEvent.flipBack')}</Text>
                </Pressable>

                {/* Signalement — discret, en dernier : trois joueurs distincts
                    renvoient la carte en revérification humaine. */}
                {!!cardId && (
                  <Pressable
                    onPress={() => {
                      if (signalee) return;
                      setSignalee(true);
                      signalerCarteSponsor(cardId);
                    }}
                    hitSlop={8}
                    style={styles.reportWrap}
                  >
                    <Text style={[styles.reportText, signalee && styles.reportTextDone]}>
                      {signalee ? t('sponsorEvent.reported') : t('sponsorEvent.report')}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </ScrollView>
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
  // À 180° de rotation, le conteneur est en miroir : cette contre-rotation
  // remet le contenu du verso à l'endroit.
  cardMirror: {
    transform: [{ rotateY: '180deg' }],
  },
  scrollContent: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[4],
    width: '100%',
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    textAlign: 'center',
  },
  descriptionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[4],
    alignItems: 'center',
  },
  sponsorLogo: {
    width: '70%',
    height: 56,
    marginBottom: SPACING[3],
  },
  sponsorLogoSmall: {
    width: '50%',
    height: 36,
    marginBottom: SPACING[2],
  },
  description: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
  },
  sponsoredBy: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#7F8E9E',
    marginBottom: SPACING[2],
  },
  versoDescription: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: '#2C3E50',
    textAlign: 'left',
    lineHeight: 20,
    width: '100%',
  },
  versoLigne: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#3D4C61',
    lineHeight: 19,
    width: '100%',
    marginTop: SPACING[2],
  },
  versoLibelle: {
    fontFamily: FONTS.bodySemiBold,
    color: '#2C3E50',
  },
  versoDeadline: {
    color: '#B84A0C',
  },
  gainRow: {
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING[4],
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    backgroundColor: COLORS.success,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  badgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    marginBottom: SPACING[3],
  },
  flipButtonVerso: {
    marginTop: SPACING[3],
    marginBottom: 0,
  },
  flipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#2E7D32',
  },
  buttonWrap: {
    width: '100%',
  },
  reportWrap: {
    marginTop: SPACING[3],
    paddingVertical: SPACING[1],
  },
  reportText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#9AA6B2',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  reportTextDone: {
    color: '#2E7D32',
    textDecorationLine: 'none',
  },
  saveWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.info,
    backgroundColor: 'rgba(33, 150, 243, 0.06)',
  },
  saveButtonSaved: {
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  saveText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
  },
  saveTextSaved: {
    color: '#2E7D32',
  },
});
