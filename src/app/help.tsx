/**
 * HelpScreen — Aide & Support (FAQ).
 *
 * Design aligné sur les autres écrans (profil, statistiques, succès) :
 * header fixe #0A1929 arrondi, cartes DynamicGradientBorder fond rgba(0,0,0,0.35).
 */
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { RadialBackground, DynamicGradientBorder } from '@/components/ui';
import { useSettingsStore } from '@/stores';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

/** Lien du groupe communauté WhatsApp (identique à l'écran Profil). */
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/HMOY7uJBbNd4O64gysmitZ';

type FAQCategory = 'gameplay' | 'startup' | 'online' | 'challenges' | 'account';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
}

const FAQ_ITEMS: FAQItem[] = [
  // ─── Gameplay ───
  {
    id: 'faq1',
    category: 'gameplay',
    question: 'Comment jouer à Startup Ludo ?',
    answer:
      "Startup Ludo est un jeu de plateau éducatif sur l'entrepreneuriat. Lance le dé pour avancer sur le plateau. Selon la case où tu tombes, tu peux répondre à un quiz, recevoir un financement, affronter un adversaire en duel ou faire face à un événement. Le but est d'accumuler le plus de jetons possible !",
  },
  {
    id: 'faq2',
    category: 'gameplay',
    question: 'Comment gagner des jetons ?',
    answer:
      "Tu gagnes des jetons en répondant correctement aux quiz, en remportant des duels, en recevant des financements sur certaines cases et en capturant les pions adverses.",
  },
  {
    id: 'faq3',
    category: 'gameplay',
    question: "Comment fonctionne la capture d'un pion ?",
    answer:
      "Si tu tombes sur une case occupée par un adversaire, tu le captures : son pion retourne à sa case de départ. Attention, cela peut aussi t'arriver !",
  },
  {
    id: 'faq4',
    category: 'gameplay',
    question: "C'est quoi un duel ?",
    answer:
      "Lorsque deux joueurs se croisent sur certaines cases, un duel peut se déclencher : une série de questions départage les deux joueurs. Le gagnant remporte des jetons. Les autres joueurs assistent au duel en spectateurs.",
  },
  {
    id: 'faq5',
    category: 'gameplay',
    question: 'Quelle est la condition de victoire ?',
    answer:
      "La partie se termine quand le nombre de tours défini est atteint ou qu'un joueur atteint le seuil de jetons configuré. Le joueur avec le plus de jetons gagne la partie.",
  },
  // ─── Entreprises ───
  {
    id: 'faq6',
    category: 'startup',
    question: "À quoi servent les cartes d'inspiration ?",
    answer:
      "Les cartes d'inspiration t'aident à imaginer ton idée d'entreprise. La carte Cible définit ton marché (étudiants, agriculteurs…) et la carte Mission définit le problème que tu résous (éduquer, connecter…). Combine les deux pour créer ton concept !",
  },
  {
    id: 'faq7',
    category: 'startup',
    question: 'Comment évolue la valorisation de mon entreprise ?',
    answer:
      "Une valorisation initiale est estimée à la création de ton entreprise. Ensuite, chaque partie jouée avec ce projet augmente sa valorisation en fonction des jetons gagnés. Suis sa progression dans ton portfolio.",
  },
  {
    id: 'faq8',
    category: 'startup',
    question: 'Puis-je avoir plusieurs entreprises ?',
    answer:
      "Oui ! Tu peux créer plusieurs entreprises, chacune dans un secteur différent. Gère ton portfolio comme un véritable entrepreneur.",
  },
  // ─── Multijoueur en ligne ───
  {
    id: 'faq9',
    category: 'online',
    question: 'Comment jouer avec mes amis en ligne ?',
    answer:
      "Depuis le mode en ligne, crée un salon : tu obtiens un code de partie à partager. Tes amis saisissent ce code (ou ouvrent ton lien d'invitation) pour rejoindre ton salon. Quand tout le monde est prêt, l'hôte lance la partie.",
  },
  {
    id: 'faq10',
    category: 'online',
    question: "Comment inviter un joueur ?",
    answer:
      "Dans le salon, utilise « Inviter un contact » pour envoyer une invitation directe à un joueur que tu suis. Tu peux aussi partager le code ou le lien d'invitation du salon par n'importe quel moyen.",
  },
  {
    id: 'faq11',
    category: 'online',
    question: "Que se passe-t-il si un joueur se déconnecte ?",
    answer:
      "Si l'hôte quitte le salon avant le début de la partie, le salon est fermé pour tout le monde. En cours de partie, un joueur déconnecté est déclaré forfait et la partie continue pour les autres. Si tu n'agis pas pendant 15 secondes à ton tour, le jeu joue automatiquement pour toi.",
  },
  // ─── Programmes & challenges ───
  {
    id: 'faq12',
    category: 'challenges',
    question: "C'est quoi les programmes / challenges ?",
    answer:
      "Les challenges sont des parcours thématiques composés de plusieurs niveaux. Tu progresses en jouant des parties liées au programme : chaque niveau réussi débloque le suivant et te rapporte de l'XP.",
  },
  {
    id: 'faq13',
    category: 'challenges',
    question: "Comment m'inscrire à un programme ?",
    answer:
      "Depuis l'accueil ou la section challenges, choisis un programme et remplis le formulaire d'inscription. Une fois inscrit, le programme apparaît dans « Mes programmes ».",
  },
  // ─── Compte ───
  {
    id: 'faq14',
    category: 'account',
    question: 'Comment fonctionne le système de rangs ?',
    answer:
      "Tu gagnes de l'XP en jouant et en débloquant des succès. Plus tu accumules d'XP, plus ton rang monte : Stagiaire, Aspirant, Entrepreneur Débutant, Entrepreneur Confirmé, Expert Business, Mogul, CEO, et enfin Légende.",
  },
  {
    id: 'faq15',
    category: 'account',
    question: 'Comment débloquer des succès ?',
    answer:
      "Les succès se débloquent automatiquement en jouant : premières parties, victoires, jetons cumulés, entreprises créées… Ouvre l'écran Succès et appuie sur un succès pour voir comment l'obtenir et ta progression.",
  },
  {
    id: 'faq16',
    category: 'account',
    question: 'Comment personnaliser mon profil ?',
    answer:
      "Dans ton profil, appuie sur ton avatar pour choisir une image parmi la galerie d'avatars. Ton pseudo unique t'identifie auprès des autres joueurs.",
  },
  {
    id: 'faq17',
    category: 'account',
    question: 'Puis-je jouer sans compte ?',
    answer:
      "Oui, tu peux jouer en tant qu'invité. Mais ta progression n'est pas sauvegardée et le mode en ligne n'est pas accessible. Crée un compte pour conserver tes entreprises, ton XP et tes succès.",
  },
];

const CATEGORIES: { id: 'all' | FAQCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'Tout', icon: 'apps' },
  { id: 'gameplay', label: 'Gameplay', icon: 'game-controller' },
  { id: 'startup', label: 'Entreprises', icon: 'rocket' },
  { id: 'online', label: 'En ligne', icon: 'people' },
  { id: 'challenges', label: 'Programmes', icon: 'trophy' },
  { id: 'account', label: 'Compte', icon: 'person' },
];

interface AccordionItemProps {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

function AccordionItem({ item, isExpanded, onToggle, index }: AccordionItemProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const rotation = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 200 });
  contentHeight.value = withTiming(isExpanded ? 1 : 0, { duration: 200 });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentHeight.value,
    maxHeight: contentHeight.value * 260,
  }));

  const handlePress = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
    onToggle();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(350)}
      style={styles.accordionWrapper}
    >
      <DynamicGradientBorder borderRadius={14} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
        <Pressable onPress={handlePress} style={styles.accordionInner}>
          <View style={styles.accordionHeader}>
            <Text style={styles.question}>{item.question}</Text>
            <Animated.View style={iconStyle}>
              <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
            </Animated.View>
          </View>

          <Animated.View style={[styles.answerWrap, contentStyle]}>
            <Text style={styles.answer}>{item.answer}</Text>
          </Animated.View>
        </Pressable>
      </DynamicGradientBorder>
    </Animated.View>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const [selectedCategory, setSelectedCategory] = useState<'all' | FAQCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCategorySelect = (categoryId: 'all' | FAQCategory) => {
    if (hapticsEnabled) Haptics.selectionAsync();
    setSelectedCategory(categoryId);
    setExpandedId(null);
  };

  const filteredFAQ =
    selectedCategory === 'all'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>AIDE & SUPPORT</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + SPACING[8],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <Text style={styles.intro}>Trouve des réponses à tes questions</Text>
        </Animated.View>

        {/* Filtres par catégorie */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategorySelect(category.id)}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                >
                  <Ionicons
                    name={category.icon}
                    size={15}
                    color={active ? '#0C243E' : 'rgba(255,255,255,0.6)'}
                  />
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Liste FAQ */}
        {filteredFAQ.map((item, index) => (
          <AccordionItem
            key={item.id}
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            index={index}
          />
        ))}

        {/* Contact — groupe WhatsApp */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.contactWrapper}
        >
          <DynamicGradientBorder borderRadius={16} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
            <View style={styles.contactCard}>
              <Ionicons name="chatbubbles" size={32} color={COLORS.primary} />
              <Text style={styles.contactTitle}>Besoin d'aide supplémentaire ?</Text>
              <Text style={styles.contactBody}>
                Rejoins la communauté Startup Ludo pour poser tes questions et échanger avec
                d'autres joueurs.
              </Text>
              <Pressable
                style={styles.whatsappBtn}
                onPress={() => Linking.openURL(WHATSAPP_GROUP_URL)}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#0C243E" />
                <Text style={styles.whatsappBtnText}>REJOINDRE LA COMMUNAUTÉ</Text>
              </Pressable>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },

  // Header
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backBtnPlaceholder: { width: 40, height: 40 },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  intro: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: SPACING[3],
  },

  // Filtres
  categoryRow: {
    gap: SPACING[2],
    paddingBottom: SPACING[4],
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  categoryTextActive: {
    color: '#0C243E',
  },

  // Accordéon FAQ
  accordionWrapper: {
    marginBottom: SPACING[2],
  },
  accordionInner: {
    padding: SPACING[3],
    width: '100%',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING[2],
  },
  question: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },
  answerWrap: {
    overflow: 'hidden',
  },
  answer: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
    marginTop: SPACING[3],
  },

  // Contact
  contactWrapper: {
    marginTop: SPACING[4],
  },
  contactCard: {
    alignItems: 'center',
    padding: SPACING[4],
    width: '100%',
    gap: SPACING[2],
  },
  contactTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    textAlign: 'center',
  },
  contactBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderRadius: 14,
    marginTop: SPACING[2],
  },
  whatsappBtnText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#0C243E',
    letterSpacing: 0.5,
  },
});
