# Prompt : Régénérer le design de l’écran de victoire (résultats)

## Objectif

Refaire entièrement le design de l’écran de fin de partie (résultats / victoire) en respectant le **design system** du projet et les **règles Cursor** (PROMPT_CLAUDE_CODE.md, FICHE_TECHNIQUE.md).  
Fichier cible : `src/app/(game)/results/[gameId].tsx`.

---

## Références obligatoires

- **Design system** : `@/styles/colors` (COLORS), `@/styles/typography` (FONTS, FONT_SIZES), `@/styles/spacing` (SPACING, BORDER_RADIUS).
- **Composants UI** : `RadialBackground`, `DynamicGradientBorder`, `GameButton`, `Avatar` depuis `@/components/ui`.
- **Règles projet** : PROMPT_CLAUDE_CODE.md (TypeScript strict, alias `@/`, pas d’inline styles répétés), FICHE_TECHNIQUE.md (architecture, thème).

---

## Règles de design à appliquer

1. **Fond**  
   Utiliser `RadialBackground` comme sur les autres écrans du jeu (create-room, join-room, local-setup), pas un simple `LinearGradient`. Couleur de fond de la vue : `COLORS.background` (#0C243E).

2. **Cartes et blocs**  
   Chaque zone de contenu (titre + trophée, carte vainqueur, bloc XP, bloc valorisation, cagnotte, classement) doit être dans un `DynamicGradientBorder` avec :
   - `fill="rgba(0, 0, 0, 0.35)"`
   - `borderRadius={20}` pour les blocs principaux, `borderRadius={14}` pour les sous-blocs (ex. ligne XP, badge jetons).
   - `boxWidth={contentWidth}` avec `contentWidth = screenWidth - SPACING[4] * 2` (comme create-room / join-room).

3. **Typographie**  
   - Titres / labels de section : `FONTS.title` ou `FONTS.bodySemiBold`, `FONT_SIZES.md` ou `FONT_SIZES.lg`, couleur `COLORS.text` ou `#FFFFFF`.
   - Sous-titres / détails : `FONTS.body`, `FONT_SIZES.sm` ou `FONT_SIZES.xs`, couleur `COLORS.textSecondary` ou `rgba(255, 255, 255, 0.5)`.
   - Chiffres / accent : `FONTS.bodyBold` ou `FONTS.title`, couleur `#FFBC40` (primaire) ou `#4CAF50` (succès/XP).

4. **Espacements**  
   Uniquement `SPACING` (4, 5, 6…) pour padding, margin, gap. Pas de valeurs en dur (sauf radius déjà définis).

5. **Boutons d’action**  
   Utiliser `GameButton` :
   - « Nouvelle partie » : `variant="yellow"`, `title="NOUVELLE PARTIE"`.
   - « Retour à l’accueil » : variant secondaire (ex. outline / ghost selon ce que propose GameButton) ou style cohérent avec les autres écrans.
   Pas de `Pressable` + `LinearGradient` custom pour les boutons principaux.

6. **Structure de la page**  
   Conserver la logique et l’ordre actuels : header (trophée + « Partie terminée ! ») → carte vainqueur (avatar, nom, startup, jetons) → XP gagnée (détail victoire / jetons / questions) → Valorisation du projet (avant / +gain / après) → Cagnotte (si mode online) → Classement (liste des joueurs avec rang, avatar, nom, jetons) → Boutons (Nouvelle partie, Retour à l’accueil).  
   Conserver aussi le `ConvertGuestPopup` (invité : « Sauvegarder ta progression ? ») avec le même design system (titres FONTS.title, corps FONTS.body, boutons avec GameButton ou styles cohérents).

7. **Animations**  
   Garder `react-native-reanimated` : `FadeInDown`, `FadeInUp`, `useAnimatedStyle` pour les blocs et compteurs, avec des délais progressifs (ex. 100, 300, 500 ms) pour un effet de révélation propre.

8. **StyleSheet**  
   Déplacer tous les styles dans un `StyleSheet.create` en bas du fichier. Éviter les gros objets de style inline ; utiliser des noms de styles explicites (ex. `winnerCard`, `xpBlock`, `rankingRow`).

9. **Couleurs joueurs**  
   Continuer à utiliser le mapping existant (ex. `PLAYER_COLORS`) ou `COLORS.players` pour la couleur du vainqueur et les barres / avatars du classement.

10. **Safe area**  
    Conserver `useSafeAreaInsets()` pour le padding du `ScrollView` (top/bottom) et tout élément fixe.

---

## Contraintes techniques

- Ne pas introduire de `any` ni de `// @ts-ignore`.
- Garder les imports existants utiles (ex. `useRouter`, `useLocalSearchParams`, stores, `Avatar`, etc.) et ajouter ceux des composants UI (RadialBackground, DynamicGradientBorder, GameButton).
- Conserver la logique métier : `winner`, `sortedPlayers`, `xpGained`, `xpDetails`, `valorisationBefore` / `valorisationAfter`, `cagnotte`, `isOnline`, `isGuest`, handlers `handlePlayAgain`, `handleGoHome`, `handleConvert`, `handleSkipConvert`.

---

## Résumé

En une phrase : **Refaire l’écran `results/[gameId].tsx` avec RadialBackground, cartes en DynamicGradientBorder (fill rgba(0,0,0,0.35)), typo FONTS/FONT_SIZES, espacements SPACING, boutons GameButton, styles dans un StyleSheet, en gardant la structure et la logique actuelles et en respectant PROMPT_CLAUDE_CODE.md et la FICHE_TECHNIQUE.**
