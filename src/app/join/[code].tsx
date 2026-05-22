/**
 * Sas de deep link — startupludo://join/CODE
 *
 * Cet écran ne fait QUE patienter le temps que l'authentification soit prête
 * (cas où l'app était fermée à l'ouverture du lien), puis délègue toute la
 * suite — saisie du code, connexion au salon, salle d'attente, choix du projet —
 * à l'écran « Rejoindre un salon » (join-room) pour garder une expérience unique.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { GameButton, RadialBackground } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

export default function JoinByLinkScreen() {
  const router = useRouter();
  const { code: rawCode } = useLocalSearchParams<{ code?: string }>();
  const code = (rawCode ?? '').toUpperCase().trim();

  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const hasRedirectedRef = useRef(false);

  const codeInvalid = isAuthInitialized && (!code || code.length < 6);

  useEffect(() => {
    if (hasRedirectedRef.current) return;
    if (!isAuthInitialized) return;
    if (!user) return;
    if (!code || code.length < 6) return;

    hasRedirectedRef.current = true;
    // Délègue à l'écran Rejoindre un salon avec le code pré-rempli
    router.replace({
      pathname: '/(game)/join-room',
      params: { code },
    });
  }, [isAuthInitialized, user, code, router]);

  const handleBackToHome = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      <View style={styles.content}>
        {codeInvalid ? (
          <>
            <Text style={styles.errorTitle}>Lien invalide</Text>
            <Text style={styles.errorMessage}>
              Ce lien d&apos;invitation est incorrect ou incomplet.
            </Text>
            <View style={styles.actions}>
              <GameButton
                title="RETOUR À L'ACCUEIL"
                variant="yellow"
                fullWidth
                onPress={handleBackToHome}
              />
            </View>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#FFBC40" />
            <Text style={styles.title}>Ouverture de l&apos;invitation</Text>
            {!!code && <Text style={styles.subtitle}>Code : {code}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[6],
    gap: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: SPACING[3],
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  errorMessage: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING[1],
  },
  actions: {
    width: '100%',
    marginTop: SPACING[5],
  },
});
