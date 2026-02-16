import { View, Text, StyleSheet, ScrollView, Modal as RNModal } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameButton } from '@/components/ui/GameButton';
import { DynamicGradientBorder } from '@/components/ui';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function PrivacyPolicyModal({ visible, onAccept }: PrivacyPolicyModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => {}}
    >
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          style={[styles.container, { paddingBottom: insets.bottom + SPACING[4] }]}
        >
          <DynamicGradientBorder
            borderRadius={24}
            fill="rgba(10, 25, 41, 0.98)"
            boxWidth={340}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Bienvenue sur Start Up Ludo !</Text>
                <Text style={styles.subtitle}>
                  Avant de commencer, veuillez prendre connaissance de nos conditions.
                </Text>
              </View>

              {/* Scrollable Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionTitle}>Politique de Confidentialité</Text>
                <Text style={styles.text}>
                  Start Up Ludo collecte et traite vos données personnelles dans le respect du RGPD.
                  {'\n\n'}
                  <Text style={styles.bold}>Données collectées :</Text>
                  {'\n'}• Informations de profil (nom, email)
                  {'\n'}• Données de jeu (progression, statistiques)
                  {'\n'}• Informations d'authentification
                  {'\n\n'}
                  <Text style={styles.bold}>Utilisation des données :</Text>
                  {'\n'}• Fonctionnement du jeu
                  {'\n'}• Personnalisation de l'expérience
                  {'\n'}• Communication avec les joueurs
                  {'\n\n'}
                  Vos données sont sécurisées et ne sont jamais vendues à des tiers.
                </Text>

                <Text style={styles.sectionTitle}>Conditions Générales d'Utilisation</Text>
                <Text style={styles.text}>
                  En utilisant Start Up Ludo, vous acceptez :
                  {'\n\n'}
                  • De respecter les règles du jeu et les autres joueurs
                  {'\n'}• De ne pas utiliser de moyens frauduleux
                  {'\n'}• De fournir des informations exactes lors de l'inscription
                  {'\n'}• Que votre compte peut être suspendu en cas de comportement inapproprié
                  {'\n\n'}
                  L'application est fournie "telle quelle" sans garantie.
                </Text>

                <Text style={styles.footer}>
                  En continuant, vous acceptez notre Politique de Confidentialité et nos Conditions Générales d'Utilisation.
                </Text>
              </ScrollView>

              {/* Accept Button */}
              <View style={styles.buttonContainer}>
                <GameButton
                  title="J'ACCEPTE ET JE CONTINUE"
                  variant="yellow"
                  fullWidth
                  onPress={onAccept}
                />
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },
  container: {
    width: '100%',
    maxWidth: 500,
  },
  content: {
    padding: SPACING[5],
    maxHeight: '85%',
  },
  header: {
    marginBottom: SPACING[4],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: SPACING[3],
  },
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: '#FFBC40',
    marginTop: SPACING[3],
    marginBottom: SPACING[2],
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  bold: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
  },
  footer: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: SPACING[4],
    lineHeight: FONT_SIZES.xs * 1.4,
  },
  buttonContainer: {
    marginTop: SPACING[4],
  },
});
