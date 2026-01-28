/**
 * English translations
 */

const en: Record<string, string> = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.retry': 'Retry',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.continue': 'Continue',
  'common.close': 'Close',
  'common.or': 'or',
  'common.yes': 'Yes',
  'common.no': 'No',

  // Auth
  'auth.welcome': 'Welcome to',
  'auth.appName': 'Startup Ludo',
  'auth.tagline': 'Learn entrepreneurship by playing',
  'auth.login': 'Login',
  'auth.register': 'Sign up',
  'auth.loginAsGuest': 'Continue as guest',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm password',
  'auth.displayName': 'Username',
  'auth.forgotPassword': 'Forgot password?',
  'auth.noAccount': "Don't have an account?",
  'auth.hasAccount': 'Already have an account?',
  'auth.logout': 'Log out',

  // Home
  'home.welcome': 'Welcome, {{name}}!',
  'home.quickPlay': 'Play',
  'home.soloMode': 'Solo Mode',
  'home.soloModeDesc': 'Play against AI',
  'home.localMode': 'Local Multiplayer',
  'home.localModeDesc': 'Play with friends',
  'home.onlineMode': 'Online Multiplayer',
  'home.onlineModeDesc': 'Coming soon',
  'home.yourStartups': 'Your Startups',
  'home.createStartup': 'Create a startup',
  'home.viewAll': 'View all',

  // Game
  'game.turn': 'Turn {{number}}',
  'game.yourTurn': "It's your turn!",
  'game.aiTurn': "AI's turn...",
  'game.rollDice': 'Roll dice',
  'game.tokens': 'Tokens',
  'game.position': 'Position',
  'game.player': 'Player {{number}}',
  'game.you': 'You',
  'game.ai': 'AI',
  'game.pause': 'Pause',
  'game.resume': 'Resume',
  'game.quit': 'Quit',
  'game.quitConfirm': 'Do you really want to quit the game?',

  // Quiz
  'quiz.title': 'Quiz',
  'quiz.question': 'Question',
  'quiz.correct': 'Correct answer!',
  'quiz.wrong': 'Wrong answer',
  'quiz.reward': '+{{amount}} tokens',
  'quiz.penalty': '-{{amount}} tokens',
  'quiz.timeLeft': '{{seconds}}s',

  // Events
  'event.funding': 'Funding',
  'event.fundingDesc': 'You received funding!',
  'event.obstacle': 'Obstacle',
  'event.obstacleDesc': 'You face a challenge...',
  'event.opportunity': 'Opportunity',
  'event.opportunityDesc': 'A great opportunity arises!',
  'event.capture': 'Capture!',
  'event.captureDesc': 'You captured an opponent!',
  'event.captured': 'Captured!',
  'event.capturedDesc': 'You have been captured...',

  // Victory
  'victory.title': 'Victory!',
  'victory.winner': '{{name}} wins!',
  'victory.yourTokens': 'Your tokens: {{amount}}',
  'victory.playAgain': 'Play again',
  'victory.goHome': 'Back to home',
  'victory.leaderboard': 'Final ranking',

  // Startup Creation
  'startup.create': 'Create your startup',
  'startup.inspiration': 'Inspiration cards',
  'startup.inspirationDesc': 'Draw cards to find your startup idea',
  'startup.targetCard': 'Target Card',
  'startup.targetCardDesc': 'Who will be your customer?',
  'startup.missionCard': 'Mission Card',
  'startup.missionCardDesc': 'What problem to solve?',
  'startup.drawCard': 'Tap to draw a card',
  'startup.drawing': 'Drawing...',
  'startup.name': 'Startup name',
  'startup.namePlaceholder': 'Ex: EcoFarm, HealthTech...',
  'startup.description': 'Description',
  'startup.descriptionPlaceholder': 'Describe what your startup does in one sentence...',
  'startup.sector': 'Business sector',
  'startup.createButton': 'Create my startup',
  'startup.creating': 'Creating...',
  'startup.success': 'Congratulations!',
  'startup.successDesc': 'Your startup has been created successfully',
  'startup.viewPortfolio': 'View my portfolio',

  // Sectors
  'sector.tech': 'Technology',
  'sector.agri': 'Agriculture',
  'sector.health': 'Health',
  'sector.education': 'Education',
  'sector.finance': 'Finance',
  'sector.commerce': 'Commerce',

  // Portfolio
  'portfolio.title': 'My Portfolio',
  'portfolio.totalValue': 'Total value',
  'portfolio.startups': 'Startups',
  'portfolio.empty': 'No startups',
  'portfolio.emptyDesc': 'Create your first startup to get started!',
  'portfolio.level': 'Level {{level}}',
  'portfolio.invested': '{{amount}} tokens invested',

  // Profile
  'profile.title': 'My Profile',
  'profile.rank': 'Rank',
  'profile.level': 'Level',
  'profile.xp': 'XP',
  'profile.stats': 'Statistics',
  'profile.gamesPlayed': 'Games played',
  'profile.gamesWon': 'Wins',
  'profile.winRate': 'Win rate',
  'profile.tokensEarned': 'Tokens earned',
  'profile.achievements': 'Achievements',

  // Leaderboard
  'leaderboard.title': 'Leaderboard',
  'leaderboard.weekly': 'Weekly',
  'leaderboard.monthly': 'Monthly',
  'leaderboard.allTime': 'All time',
  'leaderboard.you': 'You',
  'leaderboard.rank': '#{{rank}}',

  // Settings
  'settings.title': 'Settings',
  'settings.account': 'Account',
  'settings.audioFeedback': 'Audio & Feedback',
  'settings.sounds': 'Sounds',
  'settings.soundsDesc': 'Game sound effects',
  'settings.vibrations': 'Vibrations',
  'settings.vibrationsDesc': 'Haptic feedback',
  'settings.notifications': 'Notifications',
  'settings.notificationsDesc': 'Alerts and reminders',
  'settings.language': 'Language',
  'settings.about': 'About',
  'settings.help': 'Help',
  'settings.helpDesc': 'FAQ and tutorials',
  'settings.history': 'History',
  'settings.historyDesc': 'View your past games',
  'settings.terms': 'Terms of use',
  'settings.privacy': 'Privacy policy',
  'settings.version': 'Version {{version}}',

  // History
  'history.title': 'Game history',
  'history.empty': 'No games played',
  'history.emptyDesc': 'Start your first game to see your history here!',
  'history.win': 'Victory',
  'history.loss': 'Defeat',
  'history.ago': '{{time}} ago',
  'history.players': 'Players',
  'history.duration': 'Duration',

  // Help
  'help.title': 'Help & FAQ',
  'help.subtitle': 'Find answers to your questions',
  'help.all': 'All',
  'help.gameplay': 'Gameplay',
  'help.startups': 'Startups',
  'help.account': 'Account',
  'help.technical': 'Technical',
  'help.contact': 'Need more help?',
  'help.contactEmail': 'Contact us at support@startupludo.com',

  // Ranks
  'rank.intern': 'Intern',
  'rank.junior': 'Junior',
  'rank.senior': 'Senior',
  'rank.lead': 'Lead',
  'rank.ceo': 'CEO',
  'rank.unicorn': 'Unicorn',

  // Errors
  'error.network': 'Connection error',
  'error.generic': 'An error occurred',
  'error.tryAgain': 'Try again',
};

export default en;
