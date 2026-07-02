import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton, Input, OutlinedText, RadialBackground } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { submitPartnershipApplication } from '@/services/firebase/programService';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BecomePartnerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const [organizationName, setOrganizationName] = useState('');
  const [contactName, setContactName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [sector, setSector] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!organizationName.trim() || !contactName.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires (*).');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      Alert.alert('Email invalide', 'Veuillez saisir une adresse email valide.');
      return;
    }

    setSubmitting(true);
    try {
      await submitPartnershipApplication(
        {
          organizationName: organizationName.trim(),
          contactName: contactName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          sector: sector.trim() || undefined,
          website: website.trim() || undefined,
          message: message.trim(),
        },
        { userId: user?.id ?? null }
      );
      setSubmitted(true);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'L’envoi a échoué. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Écran de confirmation ───────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.container}>
        <RadialBackground />
        <View style={[styles.successWrap, { paddingTop: insets.top }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.successTitle}>Candidature envoyée !</Text>
          <Text style={styles.successText}>
            Merci pour votre intérêt. L’équipe Concree examinera votre demande et vous recontactera par email.
          </Text>
          <View style={styles.successButton}>
            <GameButton title="RETOUR" variant="yellow" fullWidth onPress={() => router.back()} />
          </View>
        </View>
      </View>
    );
  }

  // ─── Formulaire ──────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <OutlinedText text="DEVENIR PARTENAIRE" style={styles.headerTitle} outlineColor="#0E699C" outlineWidth={1.4} />
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING[8] }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Remplissez ce formulaire pour proposer un partenariat. Votre demande sera transmise à l’équipe Concree.
          </Text>

          <Input
            label="Organisation *"
            placeholder="Nom de votre structure"
            value={organizationName}
            onChangeText={setOrganizationName}
            leftIcon="business-outline"
          />
          <Input
            label="Personne de contact *"
            placeholder="Votre nom complet"
            value={contactName}
            onChangeText={setContactName}
            leftIcon="person-outline"
          />
          <Input
            label="Email *"
            placeholder="contact@organisation.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />
          <Input
            label="Téléphone *"
            placeholder="+221 ..."
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />
          <Input
            label="Secteur d’activité"
            placeholder="Ex : incubateur, fintech, ONG…"
            value={sector}
            onChangeText={setSector}
            leftIcon="pricetag-outline"
          />
          <Input
            label="Site web"
            placeholder="https://…"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            autoCapitalize="none"
            leftIcon="globe-outline"
          />
          <Input
            label="Votre projet de partenariat *"
            placeholder="Décrivez votre organisation et ce que vous recherchez…"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            inputStyle={styles.textArea}
          />

          <View style={styles.submitWrap}>
            <GameButton
              title="ENVOYER MA CANDIDATURE"
              variant="yellow"
              fullWidth
              loading={submitting}
              disabled={submitting}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.white,
  },
  headerSpacer: { width: 44 },
  content: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
    gap: SPACING[4],
  },
  intro: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING[3],
  },
  submitWrap: {
    marginTop: SPACING[2],
  },
  // Succès
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[6],
    gap: SPACING[4],
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[2],
  },
  successTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.white,
    textAlign: 'center',
  },
  successText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  successButton: {
    marginTop: SPACING[4],
    width: '100%',
  },
});
