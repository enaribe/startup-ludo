import { View, Text, StyleSheet, ScrollView, Modal as RNModal, Dimensions } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameButton } from '@/components/ui/GameButton';
import { DynamicGradientBorder } from '@/components/ui';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PrivacyPolicyModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function PrivacyPolicyModal({ visible, onAccept }: PrivacyPolicyModalProps) {
  const insets = useSafeAreaInsets();
  const modalWidth = Math.min(SCREEN_WIDTH - SPACING[8], 500);

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
          style={styles.container}
        >
          <DynamicGradientBorder
            borderRadius={24}
            fill="rgba(10, 25, 41, 0.98)"
            boxWidth={modalWidth}
          >
            <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, SPACING[4]) }]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Bienvenue sur Start Up Ludo !</Text>
                <Text style={styles.subtitle}>
                  Avant de commencer, veuillez prendre connaissance de nos conditions.
                </Text>
              </View>

              {/* Scrollable Content */}
              <View style={styles.scrollWrapper}>
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.sectionTitle}>Politique de confidentialité</Text>
                  <Text style={styles.smallText}>Dernière mise à jour : février 2026</Text>

                  <Text style={styles.text}>
                    Startup Ludo (« l'application », « nous ») est un jeu de plateau mobile éducatif sur l'entrepreneuriat. Cette politique décrit comment nous collectons, utilisons et protégons vos données lorsque vous utilisez l'application Startup Ludo sur iOS et Android.
                    {'\n\n'}
                    En utilisant l'application, vous acceptez cette politique. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application.
                  </Text>

                  <Text style={styles.subTitle}>1. Responsable du traitement</Text>
                  <Text style={styles.text}>
                    Les données sont traitées dans le cadre de l'application Startup Ludo. Pour toute question sur vos données personnelles, vous pouvez nous contacter (voir section « Nous contacter » en fin de document).
                  </Text>

                  <Text style={styles.subTitle}>2. Données que nous collectons</Text>
                  <Text style={styles.bold}>2.1 Données liées à votre compte</Text>
                  <Text style={styles.text}>
                    Lors de l'inscription ou de la connexion, nous pouvons collecter :
                    {'\n'}• Adresse e-mail (connexion par e-mail / mot de passe)
                    {'\n'}• Nom d'affichage (pseudo ou nom que vous choisissez)
                    {'\n'}• Photo de profil (si vous utilisez Google ou Apple pour vous connecter)
                    {'\n'}• Identifiant de compte (généré par notre prestataire d'authentification)
                    {'\n\n'}
                    Vous pouvez aussi jouer en mode invité sans créer de compte ; dans ce cas, aucune donnée de compte n'est enregistrée de manière durable.
                  </Text>

                  <Text style={styles.bold}>2.2 Données de profil et de jeu</Text>
                  <Text style={styles.text}>
                    Une fois connecté, nous enregistrons notamment :
                    {'\n'}• Profil utilisateur : nom d'affichage, photo, préférences
                    {'\n'}• Statistiques de jeu : XP, niveau, rang, parties jouées/gagnées
                    {'\n'}• Projets/startups : idées et projets que vous créez
                    {'\n'}• Historique de progression
                  </Text>

                  <Text style={styles.bold}>2.3 Données liées aux programmes (challenges)</Text>
                  <Text style={styles.text}>
                    Si vous vous inscrivez à un programme d'accompagnement, nous pouvons enregistrer :
                    {'\n'}• Formulaire d'inscription : nom, prénom, âge, région, téléphone
                    {'\n'}• Progression : niveaux réalisés, XP, livrables complétés
                  </Text>

                  <Text style={styles.bold}>2.4 Données liées au jeu en ligne (multijoueur)</Text>
                  <Text style={styles.text}>
                    Pour les parties en ligne :
                    {'\n'}• Présence : statut en ligne/hors ligne
                    {'\n'}• Données de partie : salle de jeu, joueurs, état du jeu
                    {'\n'}• Messages/réactions dans le chat
                  </Text>

                  <Text style={styles.bold}>2.5 Données techniques</Text>
                  <Text style={styles.text}>
                    L'application peut utiliser :
                    {'\n'}• Type d'appareil, système d'exploitation, langue
                    {'\n'}• Stockage local : préférences et données de session
                    {'\n\n'}
                    Nous ne mettons pas en place de suivi publicitaire ou de profilage commercial.
                  </Text>

                  <Text style={styles.subTitle}>3. Bases légales et finalités</Text>
                  <Text style={styles.text}>
                    Nous traitons vos données pour :
                    {'\n'}• Création et gestion du compte (exécution du contrat)
                    {'\n'}• Sauvegarde de la progression (exécution du contrat)
                    {'\n'}• Jeu en ligne et classements (exécution du contrat)
                    {'\n'}• Inscription aux challenges (consentement)
                    {'\n'}• Support et amélioration du service (intérêt légitime)
                  </Text>

                  <Text style={styles.subTitle}>4. Services tiers et hébergement</Text>
                  <Text style={styles.text}>
                    Nous nous appuyons sur :
                    {'\n'}• Firebase (Google) : authentification, base de données
                    {'\n'}• Connexion avec Google et Apple
                    {'\n\n'}
                    Les données sont hébergées dans des datacenters sécurisés. Nous ne vendons pas vos données personnelles à des tiers.
                  </Text>

                  <Text style={styles.subTitle}>5. Durée de conservation</Text>
                  <Text style={styles.text}>
                    • Compte actif : conservé tant que votre compte existe
                    {'\n'}• Après suppression : suppression ou anonymisation dans les délais légaux
                    {'\n'}• Données de parties : conservées pour le fonctionnement du jeu
                  </Text>

                  <Text style={styles.subTitle}>6. Vos droits</Text>
                  <Text style={styles.text}>
                    Vous disposez des droits suivants :
                    {'\n'}• Droit d'accès : obtenir une copie de vos données
                    {'\n'}• Droit de rectification : corriger des données inexactes
                    {'\n'}• Droit à l'effacement : demander la suppression de votre compte
                    {'\n'}• Droit à la limitation du traitement
                    {'\n'}• Droit à la portabilité
                    {'\n'}• Droit d'opposition
                    {'\n'}• Droit de retirer votre consentement
                  </Text>

                  <Text style={styles.subTitle}>7. Sécurité</Text>
                  <Text style={styles.text}>
                    Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données (authentification sécurisée, accès restreint, utilisation de services reconnus).
                  </Text>

                  <Text style={styles.subTitle}>8. Mineurs</Text>
                  <Text style={styles.text}>
                    Si vous avez moins de 15 ans, nous vous encourageons à utiliser l'application avec l'accord d'un parent ou tuteur.
                  </Text>

                  <Text style={styles.subTitle}>9. Modifications de la politique</Text>
                  <Text style={styles.text}>
                    Nous pouvons mettre à jour cette politique. En cas de changement important, nous vous en informerons via l'application.
                  </Text>

                  <Text style={styles.subTitle}>10. Nous contacter</Text>
                  <Text style={styles.text}>
                    Pour toute question ou pour exercer vos droits :
                    {'\n'}• Par e-mail : contact@concree.com
                    {'\n'}• Dans l'application : Paramètres → À propos / Aide
                    {'\n\n'}
                    Si vous souhaitez supprimer votre compte, indiquez-le clairement dans votre message.
                  </Text>

                  <Text style={styles.footer}>
                    Startup Ludo – Politique de confidentialité – Version 1.0 – Février 2026
                    {'\n\n'}
                    En continuant, vous acceptez cette Politique de Confidentialité.
                  </Text>
                </ScrollView>
              </View>

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
    paddingTop: SPACING[5],
    paddingHorizontal: SPACING[5],
  },
  header: {
    marginBottom: SPACING[4],
    paddingHorizontal: SPACING[2],
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
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  scrollWrapper: {
    height: SCREEN_HEIGHT * 0.45,
    marginBottom: SPACING[2],
  },
  scrollView: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
  },
  scrollContent: {
    paddingBottom: SPACING[4],
  },
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.lg,
    color: '#FFBC40',
    marginTop: SPACING[1],
    marginBottom: SPACING[3],
  },
  subTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFBC40',
    marginTop: SPACING[3],
    marginBottom: SPACING[2],
  },
  smallText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING[3],
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: FONT_SIZES.xs * 1.6,
    marginBottom: SPACING[2],
  },
  bold: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    marginTop: SPACING[2],
    marginBottom: SPACING[1],
  },
  footer: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: SPACING[4],
    marginBottom: SPACING[2],
    lineHeight: 14,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: SPACING[4],
    paddingHorizontal: SPACING[2],
  },
});
