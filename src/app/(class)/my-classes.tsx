/**
 * Ma classe — l'écran de l'élève rattaché, à chaque séance et SANS code.
 *
 * ═══ CE QUI SE PASSE ICI, ET POURQUOI ═══
 *
 * Le code n'intervient plus jamais après le rattachement : la classe vit sur le
 * profil de l'élève, via `classLinks/{uid}` — un document écrit par le seul
 * Admin SDK, donc opposable. Quand l'enseignant lance une séance (elle passe en
 * `running`), elle apparaît ici en temps réel et l'élève la rejoint d'un geste.
 *
 * Le temps réel n'est pas un luxe : le cas nominal est trente élèves déjà sur
 * cet écran, en attente que le prof lance. Sans `onSnapshot` ils tireraient
 * pour rafraîchir, tous en même temps, pendant que le prof répète « actualisez ».
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { useTranslation } from '@/i18n';
import {
  construireContexteClasse,
  ecouterSeancesEnCours,
  getContenuSeance,
  getMonRattachement,
  getSeancesEnCours,
} from '@/services/firebase/classService';
import { useAuthStore, useClassStore, useGameStore, useUserStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ClassLink, ClassSessionSummary } from '@/types/class';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

// Même palette que mode-selection : cet écran est le prolongement direct de la
// carte « Mode Classe » (école verte), il doit en reprendre les codes.
const THEME = {
  accent: '#FFBC40',
  green: '#4CAF50',
  cardFill: 'rgba(0, 0, 0, 0.35)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textMuted: 'rgba(127, 142, 158, 0.95)',
};

export default function MyClassesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const initGame = useGameStore((s) => s.initGame);
  const getClassName = useClassStore((s) => s.getClassName);
  const learnerDisplayName = useClassStore((s) => s.learnerDisplayName);

  const [rattachement, setRattachement] = useState<ClassLink | null>(null);
  const [seances, setSeances] = useState<ClassSessionSummary[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  /** Id de la séance en cours de lancement (chargement de son contenu). */
  const [lancement, setLancement] = useState<string | null>(null);

  // Garde anti double-tap : expo-router gèle l'écran pendant la transition, un
  // second tap est avalé et donne l'impression que le bouton ne réagit pas.
  const navigatingRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      navigatingRef.current = false;
      setLancement(null);
    }, [])
  );

  /** Charge le rattachement, puis un premier état des séances. */
  const charger = useCallback(async () => {
    const lien = await getMonRattachement();
    setRattachement(lien);
    if (lien) setSeances(await getSeancesEnCours(lien.classId));
    setChargement(false);
    setRafraichissement(false);
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  // Abonnement temps réel, ouvert seulement une fois la classe connue.
  useEffect(() => {
    if (!rattachement?.classId) return undefined;
    return ecouterSeancesEnCours(rattachement.classId, setSeances);
  }, [rattachement?.classId]);

  const handleRafraichir = useCallback(() => {
    setRafraichissement(true);
    void charger();
  }, [charger]);

  /**
   * Rejoint une séance : charge le contenu choisi par l'enseignant, démarre une
   * partie SOLO ordinaire, et navigue vers l'écran de jeu.
   *
   * Le contenu est lu ICI, avant `initGame` — qui est synchrone, le moteur ne
   * pouvant pas attendre le réseau à l'amorçage. C'est aussi ce qui permet
   * d'afficher un état de chargement plutôt qu'une partie qui démarre sur du
   * contenu générique sans que l'élève comprenne pourquoi.
   */
  const handleRejoindre = useCallback(
    async (seance: ClassSessionSummary) => {
      if (navigatingRef.current || !rattachement) return;
      navigatingRef.current = true;
      setLancement(seance.id);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        // `null` si l'enseignant n'a rien généré : la partie se jouera avec son
        // édition. C'est un repli légitime (voie « une édition existante » du
        // wizard back-office), pas une panne.
        const contenu = await getContenuSeance(seance.id);
        const contexte = construireContexteClasse(seance, rattachement.learnerId);

        // Une séance de classe se joue en SOLO : chaque élève sur son téléphone,
        // son propre plateau, le même contenu. Le multijoueur n'est pas utilisé
        // (tour par tour partagé, plafonné à 4 joueurs) — cf. SPEC §1.
        initGame(
          'solo',
          seance.editionId,
          [
            {
              id: user?.id ?? 'eleve',
              name: learnerDisplayName || profile?.displayName || user?.displayName || t('class.learnerFallback'),
              // Convention plateau solo (cf. local-setup.tsx) : joueur VERT, IA BLEUE.
              color: 'green',
              isAI: false,
              isHost: true,
              isConnected: true,
            },
            {
              id: `ai_class_${seance.id}`,
              name: 'ADIA',
              color: 'blue',
              isAI: true,
              isHost: false,
              isConnected: true,
            },
          ],
          contexte,
          contenu ?? undefined
        );

        router.replace({
          pathname: '/(game)/play/[gameId]',
          params: { gameId: `class_${seance.id}`, mode: 'solo' },
        });
      } finally {
        setLancement(null);
        setTimeout(() => {
          navigatingRef.current = false;
        }, 300);
      }
    },
    [rattachement, user, profile, learnerDisplayName, initGame, router, t]
  );

  const className = rattachement ? getClassName(rattachement.classId) : '';

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header — même gabarit que mode-selection : retour rond, titre centré */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + SPACING[2] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={THEME.text} />
          </Pressable>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>{t('class.myClassesHeader')}</Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 72 + SPACING[5],
          paddingBottom: insets.bottom + SPACING[8],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={rafraichissement}
            onRefresh={handleRafraichir}
            tintColor={THEME.accent}
          />
        }
      >
        {chargement && (
          <Text style={styles.stateText}>{t('common.loading')}</Text>
        )}

        {/* Aucun rattachement : l'élève n'a jamais saisi de code, ou son prof
            l'a retiré de la classe. Dans les deux cas le geste est le même. */}
        {!chargement && !rattachement && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <DynamicGradientBorder borderRadius={24} fill={THEME.cardFill} boxWidth={contentWidth}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="school-outline" size={30} color={THEME.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>{t('class.noClassTitle')}</Text>
                <Text style={styles.emptyBody}>{t('class.noClassBody')}</Text>
                <View style={styles.emptyCta}>
                  <GameButton
                    variant="yellow"
                    fullWidth
                    title={t('class.joinCta')}
                    onPress={() => router.replace('/(class)/join')}
                  />
                </View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}

        {!chargement && rattachement && (
          <>
            {/* Carte de la classe — école verte, comme la carte « Mode Classe » */}
            <Animated.View entering={FadeInDown.duration(400)}>
              <DynamicGradientBorder borderRadius={24} fill={THEME.cardFill} boxWidth={contentWidth}>
                <View style={styles.classCard}>
                  <View style={[styles.iconBox, { backgroundColor: `${THEME.green}20` }]}>
                    <Ionicons name="school" size={28} color={THEME.green} />
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.className} numberOfLines={1}>
                      {className || t('class.myClassFallback')}
                    </Text>
                    {!!learnerDisplayName && (
                      <View style={styles.tag}>
                        <Ionicons name="person-outline" size={12} color={THEME.textMuted} />
                        <Text style={styles.tagText} numberOfLines={1}>
                          {t('class.linkedAs', { name: learnerDisplayName })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </DynamicGradientBorder>
            </Animated.View>

            <Text style={styles.sectionTitle}>{t('class.sessionsTitle')}</Text>

            {seances.length === 0 && (
              <Animated.View entering={FadeInDown.delay(80).duration(400)}>
                <DynamicGradientBorder borderRadius={24} fill={THEME.cardFill} boxWidth={contentWidth}>
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIconBox}>
                      <Ionicons name="hourglass-outline" size={28} color={THEME.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>{t('class.noSessionTitle')}</Text>
                    <Text style={styles.emptyBody}>{t('class.noSessionBody')}</Text>
                  </View>
                </DynamicGradientBorder>
              </Animated.View>
            )}

            {seances.map((seance, index) => (
              <Animated.View
                key={seance.id}
                entering={FadeInDown.delay(80 + index * 60).duration(400)}
                style={styles.sessionWrapper}
              >
                <DynamicGradientBorder borderRadius={24} fill={THEME.cardFill} boxWidth={contentWidth}>
                  <View style={styles.sessionCard}>
                    <View style={styles.sessionTopRow}>
                      <View style={[styles.iconBox, { backgroundColor: `${THEME.accent}20` }]}>
                        <Ionicons name="play" size={28} color={THEME.accent} />
                      </View>

                      <View style={styles.sessionHeadings}>
                        <View style={styles.livePill}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveLabel}>{t('class.sessionLive')}</Text>
                        </View>
                        <Text style={styles.sessionTitle} numberOfLines={2}>
                          {seance.title || t('class.sessionFallbackTitle')}
                        </Text>
                        <View style={styles.metaRow}>
                          <Ionicons name="time-outline" size={13} color={THEME.textMuted} />
                          <Text style={styles.sessionMeta}>
                            {t('class.sessionDuration', { minutes: seance.durationMinutes })}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.sessionCta}>
                      <GameButton
                        variant="yellow"
                        fullWidth
                        title={t('class.joinSessionCta')}
                        loading={lancement === seance.id}
                        disabled={lancement !== null}
                        onPress={() => void handleRejoindre(seance)}
                      />
                    </View>
                  </View>
                </DynamicGradientBorder>
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C243E' },

  // ═══ Header (gabarit mode-selection) ═══
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[4],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(5, 25, 50, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTitleWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  headerRightSpacer: { width: 40, height: 40 },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: THEME.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  stateText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: SPACING[6],
  },

  // ═══ Pastille d'icône (gabarit online-hub : 56×56, fond teinté) ═══
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ═══ Carte de la classe ═══
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[4],
    paddingVertical: SPACING[5],
    paddingHorizontal: SPACING[4],
  },
  classInfo: { flex: 1, minWidth: 0, gap: SPACING[2] },
  className: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: THEME.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ═══ Tags en pilule (gabarit mode-selection) ═══
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: THEME.textMuted,
    flexShrink: 1,
  },

  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: THEME.text,
    marginTop: SPACING[6],
    marginBottom: SPACING[3],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ═══ Carte de séance ═══
  sessionWrapper: { marginBottom: SPACING[4] },
  sessionCard: {
    paddingVertical: SPACING[5],
    paddingHorizontal: SPACING[4],
    gap: SPACING[4],
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[4],
  },
  sessionHeadings: { flex: 1, minWidth: 0, gap: SPACING[2] },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.25)',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.green },
  liveLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: THEME.green,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sessionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: THEME.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sessionMeta: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: THEME.textSecondary,
  },
  sessionCta: {},

  // ═══ États vides ═══
  emptyCard: {
    paddingVertical: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
    gap: SPACING[3],
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: THEME.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: { width: '100%', marginTop: SPACING[2] },
});
