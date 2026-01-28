/**
 * Traductions françaises - Langue par défaut
 */

const fr = {
  // Common
  'common.loading': 'Chargement...',
  'common.error': 'Erreur',
  'common.retry': 'Réessayer',
  'common.cancel': 'Annuler',
  'common.confirm': 'Confirmer',
  'common.save': 'Enregistrer',
  'common.back': 'Retour',
  'common.next': 'Suivant',
  'common.continue': 'Continuer',
  'common.close': 'Fermer',
  'common.or': 'ou',
  'common.yes': 'Oui',
  'common.no': 'Non',

  // Auth
  'auth.welcome': 'Bienvenue sur',
  'auth.appName': 'Startup Ludo',
  'auth.tagline': 'Apprends l\'entrepreneuriat en jouant',
  'auth.login': 'Se connecter',
  'auth.register': "S'inscrire",
  'auth.loginAsGuest': 'Continuer en tant qu\'invité',
  'auth.email': 'Email',
  'auth.password': 'Mot de passe',
  'auth.confirmPassword': 'Confirmer le mot de passe',
  'auth.displayName': 'Nom d\'utilisateur',
  'auth.forgotPassword': 'Mot de passe oublié ?',
  'auth.noAccount': 'Pas encore de compte ?',
  'auth.hasAccount': 'Déjà un compte ?',
  'auth.logout': 'Se déconnecter',

  // Home
  'home.welcome': 'Bienvenue, {{name}} !',
  'home.quickPlay': 'Jouer',
  'home.soloMode': 'Mode Solo',
  'home.soloModeDesc': 'Affronte l\'IA',
  'home.localMode': 'Multijoueur Local',
  'home.localModeDesc': 'Joue avec tes amis',
  'home.onlineMode': 'Multijoueur Online',
  'home.onlineModeDesc': 'Bientôt disponible',
  'home.yourStartups': 'Tes Startups',
  'home.createStartup': 'Créer une startup',
  'home.viewAll': 'Voir tout',

  // Game
  'game.turn': 'Tour {{number}}',
  'game.yourTurn': 'C\'est ton tour !',
  'game.aiTurn': 'Tour de l\'IA...',
  'game.rollDice': 'Lancer le dé',
  'game.tokens': 'Jetons',
  'game.position': 'Position',
  'game.player': 'Joueur {{number}}',
  'game.you': 'Toi',
  'game.ai': 'IA',
  'game.pause': 'Pause',
  'game.resume': 'Reprendre',
  'game.quit': 'Quitter',
  'game.quitConfirm': 'Veux-tu vraiment quitter la partie ?',

  // Quiz
  'quiz.title': 'Quiz',
  'quiz.question': 'Question',
  'quiz.correct': 'Bonne réponse !',
  'quiz.wrong': 'Mauvaise réponse',
  'quiz.reward': '+{{amount}} jetons',
  'quiz.penalty': '-{{amount}} jetons',
  'quiz.timeLeft': '{{seconds}}s',

  // Events
  'event.funding': 'Financement',
  'event.fundingDesc': 'Tu as reçu un financement !',
  'event.obstacle': 'Obstacle',
  'event.obstacleDesc': 'Tu fais face à un défi...',
  'event.opportunity': 'Opportunité',
  'event.opportunityDesc': 'Une belle opportunité se présente !',
  'event.capture': 'Capture !',
  'event.captureDesc': 'Tu as capturé un adversaire !',
  'event.captured': 'Capturé !',
  'event.capturedDesc': 'Tu as été capturé...',

  // Victory
  'victory.title': 'Victoire !',
  'victory.winner': '{{name}} a gagné !',
  'victory.yourTokens': 'Tes jetons: {{amount}}',
  'victory.playAgain': 'Rejouer',
  'victory.goHome': 'Retour à l\'accueil',
  'victory.leaderboard': 'Classement final',

  // Startup Creation
  'startup.create': 'Créer ta startup',
  'startup.inspiration': 'Cartes d\'inspiration',
  'startup.inspirationDesc': 'Tire des cartes pour trouver l\'idée de ta startup',
  'startup.targetCard': 'Carte Cible',
  'startup.targetCardDesc': 'Qui sera ton client ?',
  'startup.missionCard': 'Carte Mission',
  'startup.missionCardDesc': 'Quel problème résoudre ?',
  'startup.drawCard': 'Appuie pour tirer une carte',
  'startup.drawing': 'Tirage...',
  'startup.name': 'Nom de ta startup',
  'startup.namePlaceholder': 'Ex: EcoFarm, HealthTech...',
  'startup.description': 'Description',
  'startup.descriptionPlaceholder': 'Décris ce que fait ta startup en une phrase...',
  'startup.sector': 'Secteur d\'activité',
  'startup.createButton': 'Créer ma startup',
  'startup.creating': 'Création...',
  'startup.success': 'Félicitations !',
  'startup.successDesc': 'Ta startup a été créée avec succès',
  'startup.viewPortfolio': 'Voir mon portfolio',

  // Sectors
  'sector.tech': 'Technologie',
  'sector.agri': 'Agriculture',
  'sector.health': 'Santé',
  'sector.education': 'Éducation',
  'sector.finance': 'Finance',
  'sector.commerce': 'Commerce',

  // Portfolio
  'portfolio.title': 'Mon Portfolio',
  'portfolio.totalValue': 'Valeur totale',
  'portfolio.startups': 'Startups',
  'portfolio.empty': 'Aucune startup',
  'portfolio.emptyDesc': 'Crée ta première startup pour commencer !',
  'portfolio.level': 'Niveau {{level}}',
  'portfolio.invested': '{{amount}} jetons investis',

  // Profile
  'profile.title': 'Mon Profil',
  'profile.rank': 'Rang',
  'profile.level': 'Niveau',
  'profile.xp': 'XP',
  'profile.stats': 'Statistiques',
  'profile.gamesPlayed': 'Parties jouées',
  'profile.gamesWon': 'Victoires',
  'profile.winRate': 'Taux de victoire',
  'profile.tokensEarned': 'Jetons gagnés',
  'profile.achievements': 'Succès',

  // Leaderboard
  'leaderboard.title': 'Classement',
  'leaderboard.weekly': 'Semaine',
  'leaderboard.monthly': 'Mois',
  'leaderboard.allTime': 'Tout temps',
  'leaderboard.you': 'Toi',
  'leaderboard.rank': '#{{rank}}',

  // Settings
  'settings.title': 'Paramètres',
  'settings.account': 'Compte',
  'settings.audioFeedback': 'Audio & Retours',
  'settings.sounds': 'Sons',
  'settings.soundsDesc': 'Effets sonores du jeu',
  'settings.vibrations': 'Vibrations',
  'settings.vibrationsDesc': 'Retours haptiques',
  'settings.notifications': 'Notifications',
  'settings.notificationsDesc': 'Alertes et rappels',
  'settings.language': 'Langue',
  'settings.about': 'À propos',
  'settings.help': 'Aide',
  'settings.helpDesc': 'FAQ et tutoriels',
  'settings.history': 'Historique',
  'settings.historyDesc': 'Voir tes parties passées',
  'settings.terms': 'Conditions d\'utilisation',
  'settings.privacy': 'Politique de confidentialité',
  'settings.version': 'Version {{version}}',

  // History
  'history.title': 'Historique des parties',
  'history.empty': 'Aucune partie jouée',
  'history.emptyDesc': 'Lance ta première partie pour voir ton historique ici !',
  'history.win': 'Victoire',
  'history.loss': 'Défaite',
  'history.ago': 'Il y a {{time}}',
  'history.players': 'Joueurs',
  'history.duration': 'Durée',

  // Help
  'help.title': 'Aide & FAQ',
  'help.subtitle': 'Trouve des réponses à tes questions',
  'help.all': 'Tout',
  'help.gameplay': 'Gameplay',
  'help.startups': 'Startups',
  'help.account': 'Compte',
  'help.technical': 'Technique',
  'help.contact': 'Besoin d\'aide supplémentaire ?',
  'help.contactEmail': 'Contacte-nous à support@startupludo.com',

  // Ranks
  'rank.intern': 'Stagiaire',
  'rank.junior': 'Junior',
  'rank.senior': 'Senior',
  'rank.lead': 'Lead',
  'rank.ceo': 'CEO',
  'rank.unicorn': 'Licorne',

  // Errors
  'error.network': 'Erreur de connexion',
  'error.generic': 'Une erreur est survenue',
  'error.tryAgain': 'Réessayer',
} as const;

export default fr;
