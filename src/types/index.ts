// ===== PLAYER TYPES =====
export type PlayerColor = 'yellow' | 'blue' | 'green' | 'red';

// État d'un pion selon la nouvelle architecture
export type PawnState =
  | { status: 'home'; slotIndex: number }
  | { status: 'circuit'; position: number; distanceTraveled: number }
  | { status: 'final'; position: number }
  | { status: 'finished' };

// Contexte partie Challenge (programme d'accompagnement)
export interface ChallengeContext {
  challengeId: string;
  enrollmentId: string;
  levelNumber: number;
  subLevelNumber: number;
  sectorId: string | null;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  avatar?: string;
  isAI: boolean;
  isHost?: boolean;
  isConnected?: boolean;
  isReady?: boolean;
  tokens: number;
  pawns: PawnState[]; // 1 à 4 pions par joueur (par défaut 1)
  startupId?: string;
  startupName?: string;
  isDefaultProject?: boolean;
}

// Ancien format (pour compatibilité)
export interface LegacyPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  avatar?: string;
  isAI: boolean;
  isHost?: boolean;
  isConnected?: boolean;
  isReady?: boolean;
  tokens: number;
  pawnsInBase: number;
  pawnsOnBoard: number[];
  pawnsFinished: number;
  startupId?: string;
}

// ===== GAME TYPES =====
export type GameMode = 'solo' | 'local' | 'online';
export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';
export type EventType = 'quiz' | 'funding' | 'duel' | 'opportunity' | 'challenge' | 'safe' | 'start' | 'finish';

export interface GameState {
  id: string;
  mode: GameMode;
  status: GameStatus;
  edition: string;
  players: Player[];
  currentPlayerIndex: number;
  currentTurn: number;
  diceValue: number | null;
  diceRolled: boolean;
  selectedPawnIndex: number | null;
  pendingEvent: GameEvent | null;
  winner: string | null;
  challengeContext?: ChallengeContext;
  createdAt: number;
  updatedAt: number;
}

export interface GameEvent {
  type: EventType;
  data: QuizEvent | FundingEvent | DuelEvent | OpportunityEvent | ChallengeEvent;
}

// ===== EVENT TYPES =====
export interface QuizEvent {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  reward: number;
  timeLimit: number;
}

export interface FundingEvent {
  id: string;
  name: string;
  description: string;
  type: 'subvention' | 'pret' | 'investisseur' | 'crowdfunding';
  amount: number;
  condition?: string;
  rarity: 'common' | 'rare' | 'legendary';
}

// Option de réponse pour un duel (toutes sont "correctes" mais avec des points différents)
export interface DuelOption {
  text: string;
  points: number; // 30, 20, ou 10
}

// Question de duel
export interface DuelQuestion {
  id: string;
  question: string;
  options: DuelOption[]; // 3 options avec points différents
  category: string;
}

// Événement duel (contient 3 questions)
export interface DuelEvent {
  id: string;
  questions: DuelQuestion[];
  category: string;
}

// État du duel en cours
export interface DuelState {
  challengerId: string;
  opponentId: string;
  questions: DuelQuestion[];
  challengerAnswers: number[];
  opponentAnswers: number[];
  challengerScore: number;
  opponentScore: number;
  phase: 'select_opponent' | 'intro' | 'challenger_turn' | 'opponent_prepare' | 'opponent_turn' | 'answering' | 'waiting' | 'result';
  currentQuestionIndex: number;
}

// Résultat du duel
export interface DuelResult {
  winnerId: string | null; // null si égalité
  challengerId: string;
  opponentId: string;
  challengerScore: number;
  opponentScore: number;
  challengerReward: number;
  opponentReward: number;
}

/** Payload pour démarrer un duel en ligne (mêmes questions pour les deux joueurs) */
export interface DuelStartPayload {
  challengerId: string;
  opponentId: string;
  questions: DuelQuestion[];
}

/** Payload pour envoyer son score en duel en ligne */
export interface DuelScorePayload {
  playerId: string;
  score: number;
}

export interface OpportunityEvent {
  id: string;
  title: string;
  description: string;
  effect: 'advance' | 'tokens' | 'protection' | 'special';
  value: number;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface ChallengeEvent {
  id: string;
  title: string;
  description: string;
  effect: 'retreat' | 'loseTokens' | 'skipTurn' | 'special';
  value: number;
  rarity: 'common' | 'rare' | 'legendary';
}

// ===== BOARD TYPES =====
export interface BoardCell {
  index: number;
  type: EventType;
  x: number;
  y: number;
  isPlayerStart?: PlayerColor;
  isPlayerPath?: PlayerColor;
}

// ===== USER & AUTH TYPES =====
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isGuest: boolean;
  createdAt: number;
  lastLogin: number;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: UserRank;
  xp: number;
  level: number;
  gamesPlayed: number;
  gamesWon: number;
  totalTokensEarned: number;
  achievements: string[];
  startups: Startup[];
  createdAt: number;
}

export type UserRank =
  | 'Stagiaire'
  | 'Aspirant'
  | 'Entrepreneur Débutant'
  | 'Entrepreneur Confirmé'
  | 'Expert Business'
  | 'Mogul'
  | 'CEO'
  | 'Légende';

// ===== STARTUP TYPES =====
export interface Startup {
  id: string;
  name: string;
  sector: string;
  description: string;
  targetCard?: TargetCard;
  missionCard?: MissionCard;
  createdAt: number;
  tokensInvested: number;
  valorisation: number;
  level: number;
  creatorId?: string;
  creatorName?: string;
}

export interface TargetCard {
  id: string;
  category: 'demographic' | 'geographic' | 'activity' | 'socioeconomic';
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
  xpMultiplier?: number;
}

export interface MissionCard {
  id: string;
  category: 'efficiency' | 'social' | 'innovation' | 'african';
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
  xpMultiplier?: number;
}

export interface SectorCard {
  id: string;
  title: string;
  rarity: 'common' | 'rare' | 'legendary';
  xpMultiplier: number;
}

// ===== EDITION TYPES =====
export interface Edition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  quizzes: QuizEvent[];
  opportunities: OpportunityEvent[];
  challenges: ChallengeEvent[];
  fundings: FundingEvent[];
  duels: DuelEvent[];
}

// ===== ROOM TYPES (MULTIPLAYER) =====
export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  edition: string;
  maxPlayers: number;
  players: RoomPlayer[];
  createdAt: number;
  gameId?: string;
}

export interface RoomPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
}

// ===== SETTINGS TYPES =====
export interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  language: 'fr' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

// ===== NAVIGATION TYPES =====
export type RootStackParamList = {
  index: undefined;
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(auth)/forgot-password': undefined;
  '(tabs)': undefined;
  '(game)/mode-selection': undefined;
  '(game)/local-setup': undefined;
  '(game)/online-setup': undefined;
  '(game)/challenge-game': { challengeId: string };
  '(game)/lobby/[roomId]': { roomId: string };
  '(game)/play/[gameId]': { gameId: string };
  '(game)/results/[gameId]': { gameId: string };
  '(challenges)/challenge-hub': undefined;
  '(challenges)/[challengeId]': { challengeId: string };
  '(challenges)/my-programs': undefined;
  '(startup)/inspiration-cards': undefined;
  '(startup)/creation': undefined;
  '(startup)/confirmation': undefined;
  settings: undefined;
};

// Re-export challenge types
export type {
  Challenge,
  ChallengeLevel,
  ChallengeSubLevel,
  ChallengeSector,
  ChallengeEnrollment,
  ChallengeDeliverables,
  ChallengeRules,
  ChallengeCard,
  ChallengeCardOption,
  ChallengeCardType,
  DeliverableType,
  EnrollmentStatus,
  ChampionStatus,
  SectorCategory,
  SubLevelRules,
} from './challenge';
export {
  getLevelProgress,
  getChallengeProgress,
  isLevelUnlocked,
  isSubLevelUnlocked,
} from './challenge';
