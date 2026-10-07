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
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
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
import { ouvrirLienExterne } from '@/utils/lienExterne';
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
  /**
   * Fond de l'encart qui porte le logo (`#RRGGBB`), choisi par l'annonceur.
   *
   * Le fond était figé à `#F8F9FA` : un logo blanc ou très clair — la
   * déclinaison que beaucoup de structures fournissent — y était invisible.
   */
  logoBgColor?: string;
  /** Couleur du texte du recto (`#RRGGBB`). Va de pair avec `logoBgColor` :
   *  un fond sombre rendrait le texte par défaut illisible. */
  textColor?: string;
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
  logoBgColor,
  textColor,
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

  /*
    Couleurs de l'annonceur, défauts du jeu à défaut.

    Le FOND s'applique aux deux faces : c'est l'encart qui porte le logo, et le
    verso le montre aussi. Le TEXTE ne s'applique qu'au RECTO : le verso porte
    des mentions légales — éligibilité, date limite — qui doivent rester
    lisibles quelle que soit la charte choisie, et sa date limite garde son
    orange d'alerte.
  */
  const fondEncart = logoBgColor || '#F8F9FA';
  const couleurTexte = textColor || '#2C3E50';

  // ── Flip recto/verso ──
  const rotation = useSharedValue(0);
  const [faceVerso, setFaceVerso] = useState(false);
  const flipCompte = useRef(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aUnVerso = !!verso?.description;

  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
  }));

  /*
    ── Rebond du badge de gain ──
    Décalque de `FundingPopup` : le badge monte en échelle à l'ouverture, ce
    qui fait sentir le gain. Sans lui, la carte sponsor tombait à plat à côté
    d'une carte financement ordinaire.

    `cancelAnimation` au démontage ET à la fermeture, comme là-bas : une
    animation qui s'achève après l'unmount accède à une SharedValue libérée et
    fait planter Android.
  */
  const badgeBounce = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      badgeBounce.value = 0;
      badgeBounce.value = withTiming(1, { duration: 250 });
    } else {
      cancelAnimation(badgeBounce);
      badgeBounce.value = 0;
    }
    return () => {
      try {
        cancelAnimation(badgeBounce);
      } catch {
        // ignore
      }
    };
  }, [visible, badgeBounce]);

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeBounce.value }],
    opacity: badgeBounce.value,
  }));

  /*
    ═══ DEMI-TOUR ET RETOUR À PLAT, PAS UNE CARTE LAISSÉE À 180° ═══

    L'animation allait de 0° à 180° et Y RESTAIT : le verso s'affichait donc
    dans un conteneur retourné, remis à l'endroit par une CONTRE-rotation
    (`cardMirror`). Deux transformations 3D empilées, et le texte du verso
    était rastérisé puis retourné — d'où l'impression de vue zoomée et floue
    que le verso donnait.

    Désormais la carte fait un demi-tour et REVIENT à 0° : on pivote jusqu'à
    90° (la carte est alors sur la tranche, invisible), on échange le contenu,
    puis on repart de -90° vers 0°. Le résultat est le même à l'œil — une
    carte qui se retourne — mais chaque face s'affiche à plat, sans aucune
    transformation résiduelle. Plus de contre-rotation, donc plus de flou.
  */
  const basculer = () => {
    if (!aUnVerso) return;
    const versVerso = !faceVerso;

    // 1re moitié : jusqu'à la tranche.
    rotation.value = withTiming(90, { duration: 200 }, (fini) => {
      if (!fini) return;
      // 2e moitié : on repart de l'autre côté, contenu déjà échangé.
      rotation.value = -90;
      rotation.value = withTiming(0, { duration: 200 });
    });

    // Échange à la tranche : la face n'apparaît jamais en miroir.
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(() => setFaceVerso(versVerso), 200);
    // Premier retournement de CETTE carte = un « flip » (taux de curiosité).
    if (versVerso && !flipCompte.current && editionId && cardId) {
      flipCompte.current = true;
      trackSponsorCardFlip(editionId, cardId);
    }
  };

  const ouvrirCta = () => {
    if (!ctaUrl) return;
    if (editionId && cardId) trackSponsorCardClick(editionId, cardId);
    // `ouvrirLienExterne` complète le schéma manquant : un lien saisi
    // « concree.com » était rejeté en silence par `Linking.openURL`, et le
    // bouton de l'annonceur ne faisait rien du tout.
    void ouvrirLienExterne(ctaUrl);
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
      {/*
        ⚠️ LA LARGEUR EST PORTÉE PAR LE WRAPPER, PAS SEULEMENT PAR LA CARTE.

        `styles.cardWrap` donne au conteneur animé la même largeur que
        `FundingPopup` pose directement sur son `Animated.View`. Sans elle, ce
        wrapper n'avait AUCUNE dimension : la modale l'affiche en
        `alignItems: 'center'`, donc il se réduisait à son contenu, et le
        `width: '92%'` de la carte se mesurait sur un parent sans largeur.

        Conséquence visible : le bandeau SVG, déclaré en `width="100%"`, ne se
        dessinait pas du tout — la carte sponsor s'ouvrait sans en-tête, alors
        que le code l'appelait bien.
      */}
      <Animated.View entering={FadeIn.duration(220)} style={[styles.cardWrap, flipStyle]}>
        {/*
          TOUTE LA CARTE RETOURNE — le geste, c'est la carte, pas un bouton.

          Une pilule « VOIR LES DÉTAILS » occupait une place de bouton
          d'action, en concurrence visuelle avec le vrai CTA de l'annonceur,
          pour un geste que la carte elle-même suggère.

          `Pressable` et non `TouchableOpacity` : pas d'atténuation au toucher,
          qui donnerait un clignotement avant le retournement. `disabled` quand
          il n'y a pas de verso — une carte sans détails ne doit pas réagir.
        */}
        <Pressable
          onPress={basculer}
          disabled={!aUnVerso}
          accessibilityRole={aUnVerso ? 'button' : undefined}
          accessibilityLabel={
            aUnVerso ? (faceVerso ? t('sponsorEvent.flipBack') : t('sponsorEvent.flipDetails')) : undefined
          }
          style={styles.card}
        >
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
                {/*
                  TITRE — aligné sur la carte financement ordinaire.

                  Celle-ci ouvre sur le nom du financement en `OutlinedText`
                  vert contouré (`FundingPopup`, `styles.eventName`) ; la carte
                  sponsor passait directement au logo et à la description, d'où
                  un bloc plat là où le joueur a l'habitude d'un titre. À
                  défaut de nom propre, c'est la STRUCTURE qui le porte : c'est
                  l'information que l'annonceur veut en tête, et elle joue le
                  même rôle de repère.

                  Seulement SANS logo : les deux ensemble répéteraient la même
                  chose, le logo portant déjà le nom de la structure.
                */}
                {!logoUrl && !!structure && (
                  <OutlinedText
                    text={structure}
                    style={styles.eventName}
                    outlineColor="#2E7D32"
                    outlineWidth={2}
                  />
                )}

                <View style={[styles.descriptionBox, { backgroundColor: fondEncart }]}>
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.sponsorLogo} resizeMode="contain" />
                  ) : null}
                  <Text style={[styles.description, { color: couleurTexte }]}>{description}</Text>
                </View>

                {/*
                  Le badge REBONDIT comme sur la carte financement : il y
                  apparaît par une montée d'échelle (`badgeAnimStyle`), et
                  c'est ce qui fait sentir le gain. Ici il se contentait d'un
                  fondu — à gain égal, la carte sponsor paraissait plus terne.
                */}
                <Animated.View entering={FadeInDown.delay(200).duration(250)} style={styles.gainRow}>
                  <Animated.View style={[styles.badge, badgeAnimStyle]}>
                    <OutlinedText
                      text={`+${value}`}
                      style={styles.badgeText}
                      outlineColor="#2E7D32"
                      outlineWidth={2}
                    />
                  </Animated.View>
                </Animated.View>

                {!isSpectator && (
                  <Animated.View
                    entering={FadeInDown.delay(400).duration(220)}
                    style={[styles.buttonWrap, styles.actionsRow]}
                  >
                    {/*
                      SAUVEGARDER — carré, à gauche du bouton principal.

                      C'était une pilule pleine largeur posée AU-DESSUS de
                      « Continuer » : deux boutons empilés, dont un secondaire
                      qui prenait la même place que l'action principale et
                      repoussait le CTA de l'annonceur vers le bas.

                      Sur la même ligne, la hiérarchie se lit d'elle-même :
                      l'action principale occupe la largeur restante (`flex: 1`
                      sur son conteneur), le signet reste une icône carrée de
                      52 px — au-dessus du minimum tactile de 44 px, sans
                      `hitSlop` à compenser.
                    */}
                    {canSave && (
                      <Pressable
                        onPress={handleSave}
                        disabled={saved || saving}
                        accessibilityRole="button"
                        accessibilityLabel={saved ? t('sponsorEvent.saved') : t('sponsorEvent.save')}
                        style={[styles.saveIcon, saved && styles.saveIconSaved]}
                      >
                        <Ionicons
                          name={saved ? 'bookmark' : 'bookmark-outline'}
                          size={20}
                          color={saved ? COLORS.white : '#2E7D32'}
                        />
                      </Pressable>
                    )}
                    <View style={styles.actionPrincipale}>
                      <GameButton
                        title={t('eventPopup.continue')}
                        onPress={onAccept}
                        variant="green"
                        fullWidth
                      />
                    </View>
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
                <View style={[styles.descriptionBox, { backgroundColor: fondEncart }]}>
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

                {/*
                  CTA de l'annonceur — remplace CONTINUER sur cette face, avec
                  le même signet à sa gauche : le verso est justement la face
                  où le joueur décide de garder l'offre pour plus tard.
                */}
                {!!ctaUrl && (
                  <View style={[styles.buttonWrap, styles.actionsRow]}>
                    {canSave && (
                      <Pressable
                        onPress={handleSave}
                        disabled={saved || saving}
                        accessibilityRole="button"
                        accessibilityLabel={saved ? t('sponsorEvent.saved') : t('sponsorEvent.save')}
                        style={[styles.saveIcon, saved && styles.saveIconSaved]}
                      >
                        <Ionicons
                          name={saved ? 'bookmark' : 'bookmark-outline'}
                          size={20}
                          color={saved ? COLORS.white : '#2E7D32'}
                        />
                      </Pressable>
                    )}
                    <View style={styles.actionPrincipale}>
                      <GameButton
                        title={ctaLabel || t('sponsorEvent.learnMore')}
                        onPress={ouvrirCta}
                        variant="green"
                        fullWidth
                      />
                    </View>
                  </View>
                )}

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
        </Pressable>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  /**
   * Conteneur animé du flip — porte les DIMENSIONS.
   *
   * `FundingPopup` pose `styles.card` directement sur son `Animated.View` ;
   * ici une vue s'intercale pour la contre-rotation du verso, et c'est elle
   * qui recevait la largeur. Le wrapper restait donc sans dimension, et un
   * `width: '92%'` mesuré sur un parent sans largeur ne donne rien : le
   * bandeau SVG (`width="100%"`) ne se dessinait pas.
   */
  cardWrap: {
    maxWidth: 360,
    width: '92%',
  },
  /**
   * Signet « sauvegarder » — icône seule, posée sur le bandeau.
   *
   * En `position: absolute` pour rester hors du flux : la carte garde la même
   * mise en page qu'elle soit sauvegardable ou non (un invité ne la voit pas).
   * Le cercle semi-opaque la détache du dégradé vert du bandeau, où une icône
   * blanche nue se serait perdue.
   */
  /** Signet et bouton principal sur une seule ligne, au pied de la carte. */
  actionsRow: {
    // `row-reverse` : le signet est écrit AVANT le bouton dans le JSX (il y
    // reste secondaire pour un lecteur d'écran) mais s'affiche à sa droite.
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING[2],
  },
  /**
   * Le bouton principal prend TOUTE la largeur restante.
   *
   * Sans ce `flex: 1`, le `fullWidth` du GameButton se mesure sur son contenu
   * et le bouton se réduit au texte : « CONTINUER » flotterait au milieu, à
   * côté d'un signet, sans qu'on sache lequel est l'action principale.
   */
  actionPrincipale: {
    flex: 1,
  },
  /**
   * Signet « sauvegarder » — bouton rond, à gauche du bouton principal.
   *
   * Dimensions RELEVÉES sur `GameButton` (src/components/ui/GameButton.tsx),
   * pas estimées : `minHeight: 44`, `borderRadius: 30`, `borderWidth: 2`. Les
   * deux font donc exactement la même hauteur et le même arrondi, et
   * s'alignent sans retouche si le bouton du jeu change un jour.
   *
   * 44 px est aussi le minimum tactile — aucun `hitSlop` à ajouter. Bordure
   * verte sur fond très pâle plutôt qu'un aplat : le signet reste visiblement
   * secondaire à côté du bouton vert plein.
   */
  saveIcon: {
    width: 44,
    height: 44,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(76, 175, 80, 0.10)',
  },
  /** Sauvegardé : vert plein et signet rempli — l'état se lit d'un coup d'œil. */
  saveIconSaved: {
    backgroundColor: COLORS.success,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    // Largeur héritée de `cardWrap` : la répéter ici referait dépendre la
    // carte d'un pourcentage de pourcentage.
    width: '100%',
    ...SHADOWS.xl,
    overflow: 'hidden',
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
  /**
   * Titre du recto — mêmes valeurs que `FundingPopup.styles.eventName`, pour
   * que les deux cartes ouvrent de la même façon.
   */
  eventName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: SPACING[3],
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
});
