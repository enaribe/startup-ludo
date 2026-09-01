/**
 * SALLE D'ATTENTE côté élève — la porte du QR projeté par l'enseignant.
 *
 * Atteint de deux façons, qui convergent ici :
 *   • `startupludo://session/<code>` — l'appareil photo du téléphone ouvre
 *     directement cet écran (deep link, scheme déclaré dans `app.json`) ;
 *   • la saisie du code dans `join.tsx`, pour qui n'a pas pu scanner.
 *
 * ═══ TROIS CAS, UNE SEULE PORTE ═══
 *
 *   1. DÉJÀ RATTACHÉ à la classe de la séance → il attend le départ ici, puis
 *      la partie se lance toute seule quand le prof appuie sur « Démarrer ».
 *   2. PAS ENCORE RATTACHÉ → on l'envoie choisir son nom (`pick-learner`), qui
 *      le renvoie ici une fois lié. Le rattachement et l'entrée en séance ne
 *      font plus qu'un seul geste.
 *   3. RATTACHÉ À UNE AUTRE CLASSE → refus explicite, en nommant la classe
 *      attendue. C'est aussi ce que fait la règle Firestore : l'interface ne
 *      fait ici qu'expliquer un refus qui serait de toute façon opposé par la
 *      base.
 *
 * ⚠️ LE DÉPART EST PILOTÉ PAR LE SERVEUR, jamais par un minuteur local : on
 * écoute `startedPlayingAt` sur la séance. C'est ce qui fait partir trente
 * téléphones à la même seconde — un décompte côté client dériverait d'un
 * appareil à l'autre.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton, RadialBackground } from '@/components/ui';
import { useTranslation } from '@/i18n';
import {
  construireContexteClasse,
  ecouterSeance,
  getContenuSeance,
  getMonRattachement,
  rejoindreSeance,
  rejoindreSeanceParCode,
} from '@/services/firebase/classService';
import { useAuthStore, useClassStore, useGameStore, useUserStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { ClassJoinError, type ClassSessionLookup, type ClassSessionSummary } from '@/types/class';

/** Même palette que `my-classes` : cet écran en est le prolongement direct. */
const THEME = {
  accent: '#FFBC40',
  green: '#4CAF50',
  cardFill: 'rgba(0, 0, 0, 0.35)',
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.66)',
  danger: '#E5644E',
};

/** Ce que l'écran est en train de faire — un seul état, pas de booléens croisés. */
type Etape =
  /** Résolution du code auprès de l'API. */
  | { nom: 'chargement' }
  /** Salle d'attente : on patiente que le prof lance la partie. */
  | { nom: 'attente'; seance: ClassSessionLookup }
  /** Refus définitif, avec son explication. */
  | { nom: 'refus'; message: string };

export default function SessionWaitingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const params = useLocalSearchParams<{ code?: string }>();
  const code = (params.code ?? '').trim().toUpperCase();

  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const learnerDisplayName = useClassStore((s) => s.learnerDisplayName);
  const initGame = useGameStore((s) => s.initGame);

  const [etape, setEtape] = useState<Etape>({ nom: 'chargement' });
  /** Rattachement local, résolu en même temps que le code. */
  const [learnerId, setLearnerId] = useState('');

  // Garde-fou de navigation : `startedPlayingAt` peut arriver pendant que la
  // partie se prépare (lecture du contenu). Sans ce verrou, deux notifications
  // rapprochées lanceraient deux fois `initGame`.
  const lancementRef = useRef(false);

  // ── 1. Résolution du code, et aiguillage des trois cas ──
  useEffect(() => {
    if (!code) {
      setEtape({ nom: 'refus', message: t('class.errorInvalidCode') });
      return;
    }
    let annule = false;

    (async () => {
      try {
        const [seance, rattachement] = await Promise.all([
          rejoindreSeanceParCode(code),
          getMonRattachement(),
        ]);
        if (annule) return;

        // Cas 3 — rattaché ailleurs : on nomme la classe attendue plutôt que de
        // laisser la base opposer un refus muet quelques secondes plus tard.
        if (rattachement && rattachement.classId !== seance.classId) {
          setEtape({
            nom: 'refus',
            message: t('class.sessionOtherClass', { className: seance.className }),
          });
          return;
        }

        // Cas 2 — pas encore rattaché : choix du nom, puis retour ici.
        if (!rattachement) {
          router.replace({
            pathname: '/(class)/pick-learner',
            params: {
              code,
              sessionCode: code,
              classId: seance.classId,
              className: seance.className,
              learners: JSON.stringify(seance.learners),
            },
          });
          return;
        }

        // Cas 1 — déjà rattaché : on annonce sa présence et on patiente.
        setLearnerId(rattachement.learnerId);
        rejoindreSeance(
          seance.sessionId,
          rattachement.learnerId,
          learnerDisplayName || profile?.displayName || user?.displayName || ''
        );
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEtape({ nom: 'attente', seance });
      } catch (error) {
        if (annule) return;
        const message =
          error instanceof ClassJoinError
            ? (error.serverMessage ?? t('class.errorInvalidCode'))
            : t('class.errorUnknown');
        setEtape({ nom: 'refus', message });
      }
    })();

    return () => {
      annule = true;
    };
  }, [code, router, t, learnerDisplayName, profile?.displayName, user?.displayName]);

  /**
   * Lance la partie — même montage que `my-classes` : séance jouée en SOLO,
   * chaque élève sur son téléphone avec le contenu figé par l'enseignant.
   */
  const lancerPartie = useCallback(
    async (seance: ClassSessionSummary) => {
      if (lancementRef.current || !learnerId) return;
      lancementRef.current = true;

      // `null` si l'enseignant n'a rien généré : la partie se joue alors avec
      // son édition. Repli légitime (voie « édition seule » du wizard).
      const contenu = await getContenuSeance(seance.id);
      const contexte = construireContexteClasse(seance, learnerId);

      initGame(
        'solo',
        seance.editionId,
        [
          {
            id: user?.id ?? 'eleve',
            name:
              learnerDisplayName ||
              profile?.displayName ||
              user?.displayName ||
              t('class.learnerFallback'),
            // Convention plateau solo (cf. local-setup) : joueur VERT, IA BLEUE.
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

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/(game)/play/[gameId]',
        params: { gameId: `class_${seance.id}`, mode: 'solo' },
      });
    },
    [learnerId, initGame, user, profile, learnerDisplayName, router, t]
  );

  // ── 2. Le départ, piloté par le serveur ──
  useEffect(() => {
    if (etape.nom !== 'attente') return;
    const sessionId = etape.seance.sessionId;

    const desabonner = ecouterSeance(sessionId, (seance) => {
      // Séance clôturée ou devenue illisible : on ne laisse pas l'élève sur un
      // écran d'attente qui n'aboutira jamais.
      if (!seance || seance.status !== 'running') {
        setEtape({ nom: 'refus', message: t('class.sessionClosed') });
        return;
      }
      if (seance.startedPlayingAt) void lancerPartie(seance);
    });

    return desabonner;
  }, [etape, lancerPartie, t]);

  // ═══ RENDU ═══

  if (etape.nom === 'chargement') {
    return (
      <View style={[styles.container, styles.centre]}>
        <RadialBackground />
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text style={styles.chargementTexte}>{t('class.sessionResolving')}</Text>
      </View>
    );
  }

  if (etape.nom === 'refus') {
    return (
      <View style={[styles.container, styles.centre, { paddingTop: insets.top + SPACING[6] }]}>
        <RadialBackground />
        <Animated.View entering={FadeInDown.duration(320)} style={styles.carteRefus}>
          <Ionicons name="alert-circle-outline" size={44} color={THEME.danger} />
          <Text style={styles.refusTitre}>{t('class.sessionRefusedTitle')}</Text>
          <Text style={styles.refusTexte}>{etape.message}</Text>
          <GameButton
            title={t('common.back')}
            onPress={() => router.replace('/(class)/my-classes')}
            variant="blue"
          />
        </Animated.View>
      </View>
    );
  }

  // Salle d'attente.
  const { seance } = etape;
  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING[6] }]}>
      <RadialBackground />

      <Pressable
        onPress={() => router.replace('/(class)/my-classes')}
        style={styles.retour}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={22} color={THEME.textMuted} />
      </Pressable>

      <Animated.View entering={FadeIn.duration(400)} style={styles.centreContenu}>
        <View style={styles.pastilleVerte}>
          <Ionicons name="checkmark" size={26} color="#FFFFFF" />
        </View>

        <Text style={styles.titre}>{t('class.sessionJoined')}</Text>
        <Text style={styles.sousTitre}>
          {seance.sessionTitle || t('class.sessionFallbackTitle')}
        </Text>
        <Text style={styles.classe}>{seance.className}</Text>

        <View style={styles.attenteBloc}>
          <ActivityIndicator color={THEME.accent} />
          <Text style={styles.attenteTexte}>
            {seance.demarree ? t('class.sessionStartingNow') : t('class.sessionWaitingTeacher')}
          </Text>
        </View>

        <Text style={styles.astuce}>{t('class.sessionKeepOpen')}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING[4] },
  centreContenu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[4],
  },
  retour: { position: 'absolute', left: SPACING[4], zIndex: 2, padding: SPACING[2] },
  chargementTexte: {
    marginTop: SPACING[3],
    color: THEME.textMuted,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
  },
  pastilleVerte: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: THEME.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  titre: {
    color: THEME.text,
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    textAlign: 'center',
  },
  sousTitre: {
    color: THEME.accent,
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  classe: {
    color: THEME.textMuted,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING[1],
  },
  attenteBloc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[6],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: 16,
    backgroundColor: THEME.cardFill,
  },
  attenteTexte: { color: THEME.text, fontFamily: FONTS.body, fontSize: FONT_SIZES.base },
  astuce: {
    color: THEME.textMuted,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING[4],
    paddingHorizontal: SPACING[4],
  },
  carteRefus: {
    alignItems: 'center',
    gap: SPACING[3],
    padding: SPACING[5],
    borderRadius: 22,
    backgroundColor: THEME.cardFill,
  },
  refusTitre: { color: THEME.text, fontFamily: FONTS.title, fontSize: FONT_SIZES.xl },
  refusTexte: {
    color: THEME.textMuted,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 21,
  },
});
