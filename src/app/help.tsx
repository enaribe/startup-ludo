import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Card } from '@/components/ui/Card';
import { useSettingsStore } from '@/stores';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'gameplay' | 'startup' | 'account' | 'technical';
}

const FAQ_ITEMS: FAQItem[] = [
  // Gameplay
  {
    id: 'faq1',
    category: 'gameplay',
    question: 'Comment jouer à Startup Ludo ?',
    answer:
      "Startup Ludo est un jeu de plateau éducatif. Lance le dé pour avancer sur le plateau. Selon la case où tu tombes, tu peux répondre à des quiz, recevoir des financements, ou faire face à des événements aléatoires. Le but est d'accumuler le plus de jetons possible !",
  },
  {
    id: 'faq2',
    category: 'gameplay',
    question: 'Comment gagner des jetons ?',
    answer:
      'Tu gagnes des jetons en répondant correctement aux quiz, en recevant des financements sur certaines cases, et en capturant les pions adverses. Les quiz rapportent entre 5 et 15 jetons selon la difficulté.',
  },
  {
    id: 'faq3',
    category: 'gameplay',
    question: "Comment fonctionne la capture d'un pion ?",
    answer:
      "Si tu tombes sur une case occupée par un adversaire, tu le captures ! L'adversaire retourne à sa case de départ et tu gagnes une partie de ses jetons. Attention, cela peut aussi t'arriver !",
  },
  {
    id: 'faq4',
    category: 'gameplay',
    question: 'Quelle est la condition de victoire ?',
    answer:
      "La partie se termine quand un joueur atteint le nombre de tours défini ou le seuil de jetons configuré. Le joueur avec le plus de jetons à la fin de la partie gagne !",
  },
  // Startup
  {
    id: 'faq5',
    category: 'startup',
    question: "À quoi servent les cartes d'inspiration ?",
    answer:
      "Les cartes d'inspiration t'aident à imaginer ton idée de startup. La carte Cible définit ton marché (étudiants, agriculteurs...) et la carte Mission définit le problème que tu résous (éduquer, connecter...). Combine les deux pour créer ton concept !",
  },
  {
    id: 'faq6',
    category: 'startup',
    question: 'Comment développer ma startup ?',
    answer:
      "Gagne des jetons en jouant et investis-les dans ta startup pour la faire évoluer. Plus tu investis, plus ton niveau augmente. Chaque niveau débloque de nouveaux avantages et te rapproche du succès !",
  },
  {
    id: 'faq7',
    category: 'startup',
    question: 'Puis-je avoir plusieurs startups ?',
    answer:
      "Oui ! Tu peux créer autant de startups que tu le souhaites. Chacune peut être dans un secteur différent et avoir ses propres objectifs. Gère ton portfolio comme un vrai entrepreneur !",
  },
  // Account
  {
    id: 'faq8',
    category: 'account',
    question: 'Comment fonctionne le système de rangs ?',
    answer:
      "Tu gagnes de l'XP en jouant et en accomplissant des défis. Plus tu accumules d'XP, plus ton rang monte : Stagiaire, Junior, Senior, Lead, CEO, et enfin Licorne ! Chaque rang débloque des récompenses.",
  },
  {
    id: 'faq9',
    category: 'account',
    question: 'Puis-je jouer sans compte ?',
    answer:
      "Oui, tu peux jouer en tant qu'invité. Cependant, ta progression ne sera pas sauvegardée si tu quittes l'application. Crée un compte pour garder tes startups et ton historique !",
  },
  // Technical
  {
    id: 'faq10',
    category: 'technical',
    question: 'Le jeu ne fonctionne pas correctement',
    answer:
      "Essaie de redémarrer l'application. Si le problème persiste, vérifie ta connexion internet pour les parties en ligne. Tu peux aussi aller dans les paramètres et te reconnecter.",
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: 'apps' },
  { id: 'gameplay', label: 'Gameplay', icon: 'game-controller' },
  { id: 'startup', label: 'Startups', icon: 'rocket' },
  { id: 'account', label: 'Compte', icon: 'person' },
  { id: 'technical', label: 'Technique', icon: 'settings' },
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
    maxHeight: contentHeight.value * 200,
  }));

  const handlePress = () => {
    if (hapticsEnabled) {
      Haptics.selectionAsync();
    }
    onToggle();
  };

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 50).duration(400)}>
      <Card style={{ marginBottom: SPACING[2] }}>
        <Pressable onPress={handlePress}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.base,
                color: COLORS.text,
                flex: 1,
                paddingRight: SPACING[2],
              }}
            >
              {item.question}
            </Text>
            <Animated.View style={iconStyle}>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </Animated.View>
          </View>
        </Pressable>

        <Animated.View style={[{ overflow: 'hidden' }, contentStyle]}>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.sm,
              color: COLORS.textSecondary,
              marginTop: SPACING[3],
              lineHeight: 22,
            }}
          >
            {item.answer}
          </Text>
        </Animated.View>
      </Card>
    </Animated.View>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handleCategorySelect = (categoryId: string) => {
    if (hapticsEnabled) {
      Haptics.selectionAsync();
    }
    setSelectedCategory(categoryId);
    setExpandedId(null);
  };

  const filteredFAQ =
    selectedCategory === 'all'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[4],
        }}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Pressable
            onPress={handleBack}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: SPACING[4],
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
                marginLeft: SPACING[2],
              }}
            >
              Retour
            </Text>
          </Pressable>

          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.text,
              marginBottom: SPACING[2],
            }}
          >
            Aide & FAQ
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.base,
              color: COLORS.textSecondary,
            }}
          >
            Trouve des réponses à tes questions
          </Text>
        </Animated.View>

        {/* Category Filters */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: SPACING[4] }}
          >
            {CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategorySelect(category.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: SPACING[3],
                  paddingVertical: SPACING[2],
                  marginRight: SPACING[2],
                  borderRadius: 20,
                  backgroundColor:
                    selectedCategory === category.id ? COLORS.primary : COLORS.card,
                }}
              >
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={selectedCategory === category.id ? COLORS.white : COLORS.textSecondary}
                />
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.sm,
                    color: selectedCategory === category.id ? COLORS.white : COLORS.text,
                    marginLeft: SPACING[1],
                  }}
                >
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* FAQ List */}
        {filteredFAQ.map((item, index) => (
          <AccordionItem
            key={item.id}
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            index={index}
          />
        ))}

        {/* Contact Support */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Card
            style={{
              marginTop: SPACING[4],
              backgroundColor: `${COLORS.primary}10`,
              borderWidth: 1,
              borderColor: COLORS.primary,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="chatbubbles" size={32} color={COLORS.primary} />
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.base,
                  color: COLORS.text,
                  marginTop: SPACING[2],
                  textAlign: 'center',
                }}
              >
                Besoin d'aide supplémentaire ?
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.textSecondary,
                  marginTop: SPACING[1],
                  textAlign: 'center',
                }}
              >
                Contacte-nous à support@startupludo.com
              </Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}
