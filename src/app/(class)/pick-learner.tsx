/**
 * Rejoindre une classe — étape 2 : l'élève se choisit dans la liste.
 *
 * ═══ POURQUOI UNE CONFIRMATION AVANT DE VALIDER ═══
 *
 * Le rattachement est DÉFINITIF : il pose `linkedUid` sur le learner et lie ce
 * compte à ce nom pour l'année. Une erreur de doigt sur un nom voisin donne un
 * élève qui joue sous l'identité d'un camarade — et un bilan de classe comme
 * des certificats nominatifs faux jusqu'à ce que le prof le retire à la main.
 * Un tap de confirmation coûte une seconde et évite tout cela.
 *
 * Les noms déjà pris (`taken`) sont grisés ET non pressables. Les deux :
 * un simple gris se tape quand même, et l'élève ne comprendrait pas le refus
 * qui suit.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, GameButton, GamePopup, RadialBackground } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { rattacherEleve } from '@/services/firebase/classService';
import { useClassStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { ClassJoinError, type ClassLearnerChoice } from '@/types/class';

export default function PickLearnerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const rememberLink = useClassStore((s) => s.rememberLink);

  const params = useLocalSearchParams<{
    code?: string;
    classId?: string;
    className?: string;
    learners?: string;
    /**
     * Code de la SALLE D'ATTENTE d'où vient l'élève (QR projeté), s'il y a lieu.
     * Présent = il rejoint une partie qui l'attend ; à la fin du rattachement on
     * l'y renvoie plutôt que vers la liste de ses classes.
     */
    sessionCode?: string;
  }>();

  const code = params.code ?? '';
  const className = params.className ?? '';

  // La liste transite en JSON dans les params de route : elle vient d'être lue
  // par l'écran précédent et ne doit pas être redemandée (chaque appel consomme
  // du quota de tentatives, et la fenêtre est courte).
  const learners = useMemo<ClassLearnerChoice[]>(() => {
    if (!params.learners) return [];
    try {
      const brut: unknown = JSON.parse(params.learners);
      if (!Array.isArray(brut)) return [];
      return brut.map((e): ClassLearnerChoice => {
        const item = e as Partial<ClassLearnerChoice>;
        return {
          id: String(item.id ?? ''),
          displayName: String(item.displayName ?? ''),
          // Défensif : une valeur absente ne doit JAMAIS se lire comme « libre ».
          taken: item.taken === true,
        };
      });
    } catch {
      return [];
    }
  }, [params.learners]);

  const [selection, setSelection] = useState<ClassLearnerChoice | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const handleSelect = useCallback((learner: ClassLearnerChoice) => {
    if (learner.taken) return; // Double garde : le Pressable est déjà désactivé.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelection(learner);
    setErreur(null);
  }, []);

  const handleConfirmer = useCallback(async () => {
    if (!selection || chargement) return;

    setChargement(true);
    setErreur(null);
    try {
      const resultat = await rattacherEleve(code, selection.id);
      // Le NOM de la classe ne transite qu'ici : les règles Firestore ferment
      // `classes/{cid}` à l'élève. On le persiste maintenant, sinon l'accueil
      // ne pourra plus jamais nommer sa classe.
      rememberLink(
        resultat.classId,
        resultat.className || className,
        resultat.displayName || selection.displayName
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelection(null);
      // `replace` et non `push` : le rattachement est fait, revenir en arrière
      // vers la saisie du code n'aurait plus aucun sens.
      //
      // `sessionCode` n'est présent que si l'élève arrive d'une SALLE D'ATTENTE
      // (QR projeté ou code de séance). Dans ce cas il ne veut pas la liste de
      // ses classes : il veut entrer dans la partie qui l'attend, maintenant.
      if (params.sessionCode) {
        router.replace({
          pathname: '/(class)/session/[code]',
          params: { code: params.sessionCode },
        });
      } else {
        router.replace('/(class)/my-classes');
      }
    } catch (error) {
      setSelection(null);
      if (error instanceof ClassJoinError) {
        // Le serveur rédige des messages très précis pour les 409 (« ce nom
        // vient d'être choisi », « votre compte est déjà rattaché à X ») : on
        // les préfère systématiquement aux nôtres.
        setErreur(error.serverMessage ?? messageParDefaut(error.kind));
      } else {
        setErreur(t('class.errorUnknown'));
      }
    } finally {
      setChargement(false);
    }
  }, [selection, chargement, code, className, params.sessionCode, rememberLink, router, t]);

  /** Repli quand le serveur n'a pas rédigé de message. */
  const messageParDefaut = useCallback(
    (kind: ClassJoinError['kind']): string => {
      switch (kind) {
        case 'invalid_code': return t('class.errorInvalidCode');
        case 'rate_limited': return t('class.errorRateLimited', { minutes: 5 });
        case 'unauthenticated': return t('class.errorUnauthenticated');
        case 'offline': return t('class.errorOffline');
        case 'conflict': return t('class.errorNameTaken');
        default: return t('class.errorUnknown');
      }
    },
    [t]
  );

  const disponibles = learners.filter((e) => !e.taken).length;

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {className || t('class.pickHeader')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + SPACING[8],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <Text style={styles.title}>{t('class.pickTitle')}</Text>
          <Text style={styles.subtitle}>{t('class.pickSubtitle')}</Text>
        </Animated.View>

        {!!erreur && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#F35145" />
            <Text style={styles.errorText}>{erreur}</Text>
          </Animated.View>
        )}

        {/* Aucun nom libre : tous les élèves de la classe sont déjà rattachés.
            Message explicite plutôt qu'une liste entièrement grise et muette. */}
        {disponibles === 0 && learners.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={20} color="#FFBC40" />
            <Text style={styles.noticeText}>{t('class.allNamesTaken')}</Text>
          </Animated.View>
        )}

        {/*
          * GRILLE DE CARTES, pas une liste de lignes.
          *
          * L'élève cherche SON nom parmi trente, debout, sur le téléphone d'à
          * côté, pendant que la classe attend. Une liste verticale impose de
          * lire ligne à ligne ; une grille laisse balayer, et l'avatar coloré
          * sert de repère avant même que le nom soit lu.
          *
          * Deux colonnes : trois rendraient les prénoms illisibles sur un
          * écran de 360 px, une seule ne vaudrait pas mieux qu'avant.
          */}
        <View style={styles.grid}>
          {learners.map((learner, index) => (
            <Animated.View
              key={learner.id}
              style={styles.gridCell}
              entering={FadeInDown.delay(100 + Math.min(index, 12) * 30).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(learner)}
                disabled={learner.taken || chargement}
                style={({ pressed }) => [
                  styles.learnerCard,
                  learner.taken && styles.learnerCardTaken,
                  pressed && !learner.taken && styles.learnerCardPressed,
                ]}
              >
                {/* Avatar du jeu : mêmes initiales et mêmes couleurs que
                    partout ailleurs — l'élève retrouve un objet connu. */}
                <View style={learner.taken && styles.avatarTaken}>
                  <Avatar name={learner.displayName} size="md" showBorder />
                </View>

                <Text
                  style={[styles.learnerName, learner.taken && styles.learnerNameTaken]}
                  numberOfLines={2}
                >
                  {learner.displayName}
                </Text>

                {/* Le cadenas est POSÉ SUR l'avatar plutôt qu'en badge à côté :
                    « ce nom est pris » se lit sur la personne, pas dans une
                    mention qu'il faut chercher. */}
                {learner.taken && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.takenBadge}>{t('class.nameTakenBadge')}</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* ═══ Confirmation — « Vous êtes bien Fatou D. ? » ═══
          GamePopup, le popup de base du design system : backdrop en fondu,
          contenu en fondu + léger zoom (0.85 → 1), AUCUN déplacement — même
          famille d'animation que l'OnboardingModal. L'ancien SlideInUp depuis
          le haut était jugé brusque au test utilisateur. */}
      <GamePopup
        visible={!!selection}
        // Back Android et tap sur le backdrop : pas de fermeture pendant le
        // rattachement en cours, l'élève doit voir l'issue de sa demande.
        onRequestClose={() => {
          if (!chargement) setSelection(null);
        }}
        closeOnBackdrop
        icon={
          <View style={styles.popupIcon}>
            <Ionicons name="person-circle-outline" size={44} color="#FFBC40" />
          </View>
        }
        title={t('class.confirmTitle', { name: selection?.displayName ?? '' })}
        footer={
          <View style={styles.popupActions}>
            <GameButton
              variant="yellow"
              fullWidth
              title={t('class.confirmCta')}
              loading={chargement}
              disabled={chargement}
              onPress={handleConfirmer}
            />
            <GameButton
              variant="blue"
              fullWidth
              title={t('class.confirmCancel')}
              disabled={chargement}
              onPress={() => setSelection(null)}
            />
          </View>
        }
      >
        {/* Le caractère définitif est dit noir sur blanc : c'est le seul
            moment où l'élève peut encore corriger sans son enseignant. */}
        <Text style={styles.popupBody}>{t('class.confirmBody')}</Text>
      </GamePopup>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C243E' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING[3],
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.title,
    fontSize: 18,
    color: 'white',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: SPACING[2],
    lineHeight: 20,
  },
  grid: {
    marginTop: SPACING[5],
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Marge négative : chaque cellule porte sa moitié d'écart, la grille
    // reste alignée sur les bords du contenu. 12 px de part et d'autre —
    // à 4 px, les deux colonnes se touchaient presque et la grille se lisait
    // comme un bloc unique.
    marginHorizontal: -SPACING[3],
  },
  gridCell: { width: '50%', paddingHorizontal: SPACING[3], paddingBottom: SPACING[3] },
  learnerCard: {
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[2],
    borderRadius: 18,
    // Fond et bordure RENFORCÉS : à 0.06/0.12, l'avatar et sa bordure dorée
    // écrasaient la carte — on ne voyait que des pastilles flottantes, sans
    // rien qui dise « ceci est un bouton ».
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.20)',
    // Hauteur fixe : un prénom sur deux lignes ne doit pas décaler la carte
    // voisine, sinon la grille ondule pendant le balayage.
    minHeight: 132,
    justifyContent: 'center',
  },
  learnerCardPressed: {
    backgroundColor: 'rgba(255,188,64,0.14)',
    borderColor: 'rgba(255,188,64,0.5)',
    transform: [{ scale: 0.97 }],
  },
  learnerCardTaken: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  /** L'avatar d'un nom pris s'efface, la carte reste lisible. */
  avatarTaken: { opacity: 0.35 },
  lockOverlay: { flexDirection: 'row', alignItems: 'center', gap: SPACING[1] },
  learnerName: {
    // `flex: 1` venait de la disposition en ligne : dans une carte centrée il
    // étirait le texte sur toute la hauteur restante.
    fontFamily: FONTS.bodySemiBold,
    // 14 px et non 16 : « Abdoulaye C. » debordait d'une demi-largeur d'ecran
    // sur un telephone de 360 px, et se faisait couper au milieu du prenom.
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
    // `alignSelf: stretch` : sans lui le Text prend la largeur de son contenu
    // et se centre sur la carte, pas sur l'avatar — deux axes différents, d'où
    // le décalage visible dès qu'un nom est plus large que la pastille.
    alignSelf: 'stretch',
  },
  learnerNameTaken: { color: 'rgba(255,255,255,0.4)' },
  takenBadge: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.35)',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING[2],
    marginTop: SPACING[5],
    padding: SPACING[3],
    borderRadius: 14,
    backgroundColor: 'rgba(255,188,64,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,188,64,0.3)',
  },
  noticeText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#FFDCA0',
    lineHeight: 19,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING[2],
    marginTop: SPACING[5],
    padding: SPACING[3],
    borderRadius: 14,
    backgroundColor: 'rgba(243,81,69,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(243,81,69,0.35)',
  },
  errorText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#FFB4AD',
    lineHeight: 19,
  },
  popupIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,188,64,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
  },
  popupActions: { width: '100%', gap: SPACING[2] },
});
