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

import { GameButton, GamePopup, RadialBackground } from '@/components/ui';
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
      router.replace('/(class)/my-classes');
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
  }, [selection, chargement, code, className, rememberLink, router, t]);

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

        <View style={styles.list}>
          {learners.map((learner, index) => (
            <Animated.View
              key={learner.id}
              entering={FadeInDown.delay(100 + Math.min(index, 12) * 30).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(learner)}
                disabled={learner.taken || chargement}
                style={({ pressed }) => [
                  styles.learnerRow,
                  learner.taken && styles.learnerRowTaken,
                  pressed && !learner.taken && styles.learnerRowPressed,
                ]}
              >
                <View style={[styles.avatarDot, learner.taken && styles.avatarDotTaken]}>
                  <Ionicons
                    name={learner.taken ? 'lock-closed' : 'person'}
                    size={16}
                    color={learner.taken ? 'rgba(255,255,255,0.35)' : '#0C243E'}
                  />
                </View>
                <Text
                  style={[styles.learnerName, learner.taken && styles.learnerNameTaken]}
                  numberOfLines={1}
                >
                  {learner.displayName}
                </Text>
                {learner.taken ? (
                  <Text style={styles.takenBadge}>{t('class.nameTakenBadge')}</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
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
  list: { marginTop: SPACING[5], gap: SPACING[2] },
  learnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  learnerRowPressed: {
    backgroundColor: 'rgba(255,188,64,0.14)',
    borderColor: 'rgba(255,188,64,0.5)',
  },
  // Nom déjà pris : grisé ET non pressable (le Pressable est `disabled`).
  learnerRowTaken: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.06)',
    opacity: 0.55,
  },
  avatarDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFBC40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDotTaken: { backgroundColor: 'rgba(255,255,255,0.1)' },
  learnerName: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
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
