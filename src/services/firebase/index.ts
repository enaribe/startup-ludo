// Firebase Services - Main Export
export * from './config';
export * from './auth';
export * from './socialAuth';
export {
  createUserProfile,
  getUserProfile,
  updateFirestoreUserProfile,
  updateUserAchievements,
  updateUserStats,
  addStartup,
  deleteStartup,
  deleteChallengeEnrollment,
  getLeaderboard,
  saveGameSession,
  getGameHistory,
  subscribeToUserProfile,
  subscribeToLeaderboard,
  type LeaderboardEntry,
  type GameSession,
} from './firestore';
export type { UserProfile } from '@/types';
export * from './realtimeDb';
export {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowing,
  getFollowers,
  getFollowCounts,
  searchUsers as searchSocialUsers,
  type SocialUser,
} from './socialService';
export {
  uploadAvatar,
  deleteAvatar,
} from './storageService';
export {
  startPresenceSession,
  stopPresenceSession,
  setPresenceAppActive,
  setUserOnline,
  setUserInGame,
  subscribeToPresence,
  getPresenceState,
  getPresenceLabel,
  type PlayerPresenceState,
  type PresenceMap,
} from './presenceService';
export {
  isUsernameAvailable,
  reserveUsername,
  releaseUsername,
  getUserIdByUsername,
  getUsernameForUser,
  ensureUsernameForUser,
  validateUsernameFormat,
  getUsernameErrorMessage,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  type UsernameValidationError,
} from './usernameService';
