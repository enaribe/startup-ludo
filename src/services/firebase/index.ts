// Firebase Services - Main Export
export * from './config';
export {
  saveForumSession,
  updateForumLeaderboard,
  getForumLeaderboard,
  forumPlayerNameToDocId,
  type ForumSession,
  type ForumLeaderboardEntry,
  type ForumLeaderboardPlayerInput,
} from './forumService';
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
