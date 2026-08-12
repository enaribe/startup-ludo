/**
 * Rejoindre une classe — étape 1 : la saisie du code.
 *
 * L'enseignant ouvre une fenêtre de rattachement (~15 min) et dicte un code de
 * 6 caractères, ou l'écrit au tableau. L'alphabet exclut O/0 et I/1 : il est
 * fait pour être lu à voix haute. **Aucun scan QR** — c'est un choix, pas un
 * manque : trente téléphones qui cadrent un vidéoprojecteur est un cauchemar en
 * classe, et le code se re-dicte à l'élève qui s'est trompé.
 *
 * ⚠️ PIÈGE ANDROID (documenté dans `.cursorrules`, vécu sur `join-room.tsx`) :
 * ne JAMAIS envelopper le `TextInput` dans un `Svg` en position absolue, ni
 * dans un `Animated.View` Reanimated. Dans les deux cas, Android n'attache pas
 * l'`EditText` à l'`InputMethodManager` et le clavier ne remonte plus. Le bord
 * arrondi est donc fait en CSS natif (`inputBorderShell`), et la carte n'a pas
 * d'animation d'entrée.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { useTranslation } from '@/i18n';
import {
  estCodeClasseValide,
  normaliserCodeClasse,
  rejoindreClasseParCode,
} from '@/services/firebase/classService';
import { useAuthStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { ClassJoinError } from '@/types/class';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

/** Longueur exacte du code de rattachement. */
const LONGUEUR_CODE = 6;

export default function ClassJoinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [code, setCode] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Un invité n'a pas d'identité durable : le rattachement — permanent — serait
  // perdu à la première réinstallation, et ni certificat nominatif ni suivi
  // individuel ne seraient possibles. Le serveur refuse d'ailleurs les comptes
  // anonymes ; autant le dire ici plutôt qu'après un aller-retour réseau.
  const estInvite = user?.isGuest ?? true;

  const codeComplet = code.length === LONGUEUR_CODE;

  /** Message d'erreur DISTINCT par cause — c'est ce qui débloque l'élève. */
  const messageErreur = useCallback(
    (error: unknown): string => {
      if (!(error instanceof ClassJoinError)) return t('class.errorUnknown');

      switch (error.kind) {
        case 'invalid_code':
          // Le serveur ne distingue pas « inconnu » d'« expiré », à dessein
          // (ce serait un oracle pour qui balaie les codes). Le message couvre
          // donc les deux, et indique le geste : demander au prof de rouvrir.
          return error.serverMessage ?? t('class.errorInvalidCode');
        case 'rate_limited': {
          // Une classe entière partage l'IP du wifi de l'établissement : ce cas
          // arrive pour de vrai. On donne le délai, sinon l'élève réessaie en
          // boucle et repousse sa propre échéance.
          const minutes = Math.max(1, Math.ceil((error.retryAfterSeconds ?? 300) / 60));
          return t('class.errorRateLimited', { minutes });
        }
        case 'unauthenticated':
          return error.serverMessage ?? t('class.errorUnauthenticated');
        case 'offline':
          return t('class.errorOffline');
        case 'conflict':
          return error.serverMessage ?? t('class.errorConflict');
        default:
          return error.serverMessage ?? t('class.errorUnknown');
      }
    },
    [t]
  );

  const handleValider = useCallback(async () => {
    const codeNormalise = normaliserCodeClasse(code);
    if (!estCodeClasseValide(codeNormalise) || chargement) return;

    setChargement(true);
    setErreur(null);
    try {
      const resultat = await rejoindreClasseParCode(codeNormalise);
      // Une classe sans aucun élève actif : le prof n'a pas encore saisi sa
      // liste. Sans ce garde-fou, l'écran suivant afficherait un vide sans
      // explication et l'élève croirait l'app cassée.
      if (resultat.learners.length === 0) {
        setErreur(t('class.errorEmptyClass'));
        return;
      }
      router.push({
        pathname: '/(class)/pick-learner',
        params: {
          code: codeNormalise,
          classId: resultat.classId,
          className: resultat.className,
          learners: JSON.stringify(resultat.learners),
        },
      });
    } catch (error) {
      setErreur(messageErreur(error));
    } finally {
      setChargement(false);
    }
  }, [code, chargement, router, messageErreur, t]);

  const handleChangeCode = useCallback((texte: string) => {
    // Majuscules automatiques et filtrage à l'alphabet du code : l'élève ne
    // peut pas saisir un caractère qui serait de toute façon refusé.
    const nettoye = texte
      .toUpperCase()
      .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '')
      .slice(0, LONGUEUR_CODE);
    setCode(nettoye);
    setErreur(null);
  }, []);

  /** Les 6 cases du code, pour un rendu lisible de loin. */
  const cases = useMemo(
    () => Array.from({ length: LONGUEUR_CODE }, (_, i) => code[i] ?? ''),
    [code]
  );

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>{t('class.joinHeader')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + 140,
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.title}>{t('class.joinTitle')}</Text>
          <Text style={styles.subtitle}>{t('class.joinSubtitle')}</Text>
        </Animated.View>

        {/* Pas d'Animated.View autour de la carte : le TextInput est dedans. */}
        <View>
          <DynamicGradientBorder
            borderRadius={24}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
            style={{ marginTop: SPACING[6] }}
          >
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>{t('class.codeLabel')}</Text>

              {/* Le TextInput réel est transparent et posé PAR-DESSUS les cases :
                  l'élève voit six cases, le système voit un champ ordinaire.
                  Aucun Svg n'est superposé — cf. le piège Android en en-tête. */}
              <View style={styles.codeZone}>
                <View style={styles.codeBoxes} pointerEvents="none">
                  {cases.map((caractere, index) => (
                    <View
                      key={index}
                      style={[styles.codeBox, index === code.length && styles.codeBoxActive]}
                    >
                      <Text style={styles.codeChar}>{caractere}</Text>
                    </View>
                  ))}
                </View>
                <TextInput
                  value={code}
                  onChangeText={handleChangeCode}
                  style={styles.codeInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  // `visible-password` sur Android : c'est le seul clavier qui
                  // désactive à coup sûr la correction et la capitalisation
                  // automatique tout en restant alphanumérique.
                  keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
                  maxLength={LONGUEUR_CODE}
                  editable={!chargement && !estInvite}
                  caretHidden
                  selectTextOnFocus
                />
              </View>

              <Text style={styles.hint}>{t('class.codeHint')}</Text>
            </View>
          </DynamicGradientBorder>
        </View>

        {estInvite && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.noticeBox}>
            <Ionicons name="person-circle-outline" size={20} color="#FFBC40" />
            <Text style={styles.noticeText}>{t('class.guestBlocked')}</Text>
          </Animated.View>
        )}

        {!!erreur && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#F35145" />
            <Text style={styles.errorText}>{erreur}</Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
        <GameButton
          variant="yellow"
          fullWidth
          title={t('class.joinCta')}
          loading={chargement}
          disabled={!codeComplet || chargement || estInvite}
          onPress={estInvite ? () => router.push('/(auth)/register') : handleValider}
        />
      </View>
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
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
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
  card: { padding: SPACING[5], gap: SPACING[3] },
  fieldLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  codeZone: { position: 'relative' },
  codeBoxes: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING[2] },
  // Bord en CSS natif RN — surtout pas un Svg par-dessus le champ.
  codeBox: {
    flex: 1,
    aspectRatio: 0.78,
    maxWidth: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: '#FFBC40', backgroundColor: 'rgba(255,188,64,0.12)' },
  codeChar: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: '#FFFFFF',
  },
  // Champ réel : invisible mais bien présent, il couvre toute la zone des cases.
  codeInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    fontSize: 24,
    letterSpacing: 24,
    textAlign: 'center',
    padding: 0,
    // Android a besoin d'une hauteur explicite pour rendre l'EditText focusable.
    minHeight: Platform.OS === 'android' ? 48 : undefined,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 17,
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
    marginTop: SPACING[4],
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
  },
});
