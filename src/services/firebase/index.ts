// Firebase Services - Main Export
export * from './config';
export * from './auth';
export * from './socialAuth';
export {
  createUserProfile,
  getUserProfile,
  updateFirestoreUserProfile,
  updateUserStats,
  addStartup,
  deleteStartup,
  getLeaderboard,
  saveGameSession,
  getGameHistory,
  subscribeToUserProfile,
  subscribeToLeaderboard,
  type LeaderboardEntry,
  type GameSession,
} from './firestore';
export * from './realtimeDb';
