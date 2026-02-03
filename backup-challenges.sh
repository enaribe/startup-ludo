#!/bin/bash

# Script de sauvegarde complète du système de challenges
# Date: 2026-02-03

BACKUP_DIR="challenge-backup-original"

echo "🚀 Début de la sauvegarde du système de challenges..."

# Créer la structure de dossiers
mkdir -p "$BACKUP_DIR"/{screens,components,stores,services,types,data,config,hooks,styles,utils,docs,assets}

# 1. SCREENS - Écrans de challenges
echo "📱 Copie des écrans..."
mkdir -p "$BACKUP_DIR/screens/challenges"
cp -r src/app/\(challenges\)/* "$BACKUP_DIR/screens/challenges/" 2>/dev/null || true
cp src/app/\(game\)/challenge-game.tsx "$BACKUP_DIR/screens/" 2>/dev/null || true
cp src/app/\(tabs\)/home.tsx "$BACKUP_DIR/screens/" 2>/dev/null || true

# 2. COMPONENTS - Composants UI
echo "🎨 Copie des composants..."
cp -r src/components/challenges "$BACKUP_DIR/components/" 2>/dev/null || true
mkdir -p "$BACKUP_DIR/components/game"
cp -r src/components/game/popups "$BACKUP_DIR/components/game/" 2>/dev/null || true
cp -r src/components/game/GameBoard "$BACKUP_DIR/components/game/" 2>/dev/null || true
cp src/components/game/Dice.tsx "$BACKUP_DIR/components/game/" 2>/dev/null || true
cp src/components/game/PlayerCard.tsx "$BACKUP_DIR/components/game/" 2>/dev/null || true
cp src/components/game/EmojiChat.tsx "$BACKUP_DIR/components/game/" 2>/dev/null || true
cp src/components/ui/Modal.tsx "$BACKUP_DIR/components/" 2>/dev/null || true

# 3. STORES - State management
echo "💾 Copie des stores..."
cp src/stores/useChallengeStore.ts "$BACKUP_DIR/stores/" 2>/dev/null || true
cp src/stores/useGameStore.ts "$BACKUP_DIR/stores/" 2>/dev/null || true
cp src/stores/useAuthStore.ts "$BACKUP_DIR/stores/" 2>/dev/null || true
cp src/stores/useUserStore.ts "$BACKUP_DIR/stores/" 2>/dev/null || true
cp src/stores/useSettingsStore.ts "$BACKUP_DIR/stores/" 2>/dev/null || true
cp src/stores/index.ts "$BACKUP_DIR/stores/" 2>/dev/null || true

# 4. SERVICES - Logique métier
echo "⚙️ Copie des services..."
mkdir -p "$BACKUP_DIR/services/game"
cp src/services/game/GameEngine.ts "$BACKUP_DIR/services/game/" 2>/dev/null || true
cp src/services/game/EventManager.ts "$BACKUP_DIR/services/game/" 2>/dev/null || true
cp src/services/game/AIPlayer.ts "$BACKUP_DIR/services/game/" 2>/dev/null || true
cp src/services/game/index.ts "$BACKUP_DIR/services/game/" 2>/dev/null || true

mkdir -p "$BACKUP_DIR/services/firebase"
cp -r src/services/firebase/* "$BACKUP_DIR/services/firebase/" 2>/dev/null || true

mkdir -p "$BACKUP_DIR/services/multiplayer"
cp src/services/multiplayer/MultiplayerSync.ts "$BACKUP_DIR/services/multiplayer/" 2>/dev/null || true

# 5. TYPES - Définitions TypeScript
echo "📐 Copie des types..."
cp src/types/challenge.ts "$BACKUP_DIR/types/" 2>/dev/null || true
cp src/types/index.ts "$BACKUP_DIR/types/" 2>/dev/null || true

# 6. DATA - Données des challenges
echo "📊 Copie des données..."
mkdir -p "$BACKUP_DIR/data/challenges"
cp -r src/data/challenges/* "$BACKUP_DIR/data/challenges/" 2>/dev/null || true
cp src/data/duelQuestions.ts "$BACKUP_DIR/data/" 2>/dev/null || true
cp src/data/index.ts "$BACKUP_DIR/data/" 2>/dev/null || true
cp src/data/types.ts "$BACKUP_DIR/data/" 2>/dev/null || true
cp src/data/board-layout.json "$BACKUP_DIR/data/" 2>/dev/null || true

mkdir -p "$BACKUP_DIR/data/editions"
cp src/data/editions/*.json "$BACKUP_DIR/data/editions/" 2>/dev/null || true

# 7. CONFIG - Configuration
echo "⚡ Copie de la configuration..."
cp src/config/progression.ts "$BACKUP_DIR/config/" 2>/dev/null || true
cp src/config/boardConfig.ts "$BACKUP_DIR/config/" 2>/dev/null || true
cp src/config/achievements.ts "$BACKUP_DIR/config/" 2>/dev/null || true
cp src/config/index.ts "$BACKUP_DIR/config/" 2>/dev/null || true

# 8. HOOKS - Hooks personnalisés
echo "🪝 Copie des hooks..."
cp src/hooks/useDuel.ts "$BACKUP_DIR/hooks/" 2>/dev/null || true
cp src/hooks/useOnlineGame.ts "$BACKUP_DIR/hooks/" 2>/dev/null || true
cp src/hooks/useTurnMachine.ts "$BACKUP_DIR/hooks/" 2>/dev/null || true
cp src/hooks/useMultiplayer.ts "$BACKUP_DIR/hooks/" 2>/dev/null || true
cp src/hooks/useSound.ts "$BACKUP_DIR/hooks/" 2>/dev/null || true
cp src/hooks/useHaptics.ts "$BACKUP_DIR/hooks/" 2>/dev/null || true
cp src/hooks/index.ts "$BACKUP_DIR/hooks/" 2>/dev/null || true

# 9. STYLES - Styles et thème
echo "🎨 Copie des styles..."
cp -r src/styles/* "$BACKUP_DIR/styles/" 2>/dev/null || true

# 10. UTILS - Utilitaires
echo "🛠️ Copie des utilitaires..."
cp src/utils/boardUtils.ts "$BACKUP_DIR/utils/" 2>/dev/null || true
cp src/utils/constants.ts "$BACKUP_DIR/utils/" 2>/dev/null || true
cp src/utils/onlineCodec.ts "$BACKUP_DIR/utils/" 2>/dev/null || true
cp src/utils/index.ts "$BACKUP_DIR/utils/" 2>/dev/null || true

# 11. CONSTANTS - Constantes
echo "📦 Copie des constantes..."
mkdir -p "$BACKUP_DIR/constants"
cp -r src/constants/* "$BACKUP_DIR/constants/" 2>/dev/null || true

# 12. DOCUMENTATION - Fichiers de documentation
echo "📚 Copie de la documentation..."
cp FICHE_TECHNIQUE_CHALLENGE.md "$BACKUP_DIR/docs/" 2>/dev/null || true
cp FICHE_TECHNIQUE.md "$BACKUP_DIR/docs/" 2>/dev/null || true
cp PROMPT_CHALLENGE_COMPLETION.md "$BACKUP_DIR/docs/" 2>/dev/null || true
cp challengdesc.md "$BACKUP_DIR/docs/" 2>/dev/null || true
cp docs/CHALLENGE_DESIGN_SYSTEM.md "$BACKUP_DIR/docs/" 2>/dev/null || true
cp docs/DUEL_IMPLEMENTATION_PLAN.md "$BACKUP_DIR/docs/" 2>/dev/null || true
cp docs/fichetechniquechallengeancien.md "$BACKUP_DIR/docs/" 2>/dev/null || true

# 13. ASSETS - Animations et ressources
echo "🖼️ Copie des assets..."
cp -r assets/lottie "$BACKUP_DIR/assets/" 2>/dev/null || true
cp -r assets/sounds "$BACKUP_DIR/assets/" 2>/dev/null || true
cp -r assets/images "$BACKUP_DIR/assets/" 2>/dev/null || true

echo "✅ Sauvegarde terminée!"
echo "📁 Tous les fichiers sont dans: $BACKUP_DIR/"
