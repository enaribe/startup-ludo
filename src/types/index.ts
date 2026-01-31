// ===== PLAYER TYPES =====
export type PlayerColor = 'yellow' | 'blue' | 'green' | 'red';

// État d'un pion selon la nouvelle architecture
export type PawnState =
  | { status: 'home'; slotIndex: number }           // À la maison (slot 0-3)
  | { status: 'circuit'; position: number }         // Sur le circuit principal (0-35)
  | { status: 'final'; position: number }           // Sur le chemin final (0-3)
  | { status: 'finished' };                         // A atteint le centre

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
  selectedPawnIndex: number | null; // Index du pion sélectionné (0-3)
  pendingEvent: GameEvent | null;
  winner: string | null;
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

export interface DuelEvent {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  stake: number;
  category: string;
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
  '(game)/lobby/[roomId]': { roomId: string };
  '(game)/play/[gameId]': { gameId: string };
  '(game)/results/[gameId]': { gameId: string };
  '(startup)/inspiration-cards': undefined;
  '(startup)/creation': undefined;
  '(startup)/confirmation': undefined;
  settings: undefined;
};
