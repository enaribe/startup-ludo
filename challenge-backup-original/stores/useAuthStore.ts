import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@/types';
import {
  loginWithEmail,
  registerWithEmail,
  loginAsGuest as firebaseLoginAsGuest,
  logout as firebaseLogout,
  resetPassword as firebaseResetPassword,
  subscribeToAuthState,
  type AuthUser,
} from '@/services/firebase';
import {
  createUserProfile,
  getUserProfile,
} from '@/services/firebase';
import { useUserStore } from './useUserStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,
  error: null,
};

// Convert AuthUser to our User type
const mapAuthUserToUser = (authUser: AuthUser): User => ({
  id: authUser.id,
  email: authUser.email ?? '',
  displayName: authUser.displayName ?? 'Joueur',
  isGuest: authUser.isAnonymous,
  createdAt: Date.now(),
  lastLogin: Date.now(),
});

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    immer((set, _get) => ({
      ...initialState,

      setUser: (user) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = user !== null;
          state.isLoading = false;
        });
      },

      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
          state.isLoading = false;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      initializeAuth: () => {
        set((state) => {
          state.isLoading = true;
        });

        // Subscribe to Firebase auth state changes
        const unsubscribe = subscribeToAuthState(async (authUser) => {
          if (authUser) {
            // User is signed in
            const user = mapAuthUserToUser(authUser);
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.isLoading = false;
              state.isInitialized = true;
            });

            // Load user profile from Firestore
            try {
              const profile = await getUserProfile(authUser.id);
              if (profile) {
                useUserStore.getState().setProfile(profile);
              }
            } catch (error) {
              console.error('Failed to load user profile:', error);
            }
          } else {
            // User is signed out
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.isLoading = false;
              state.isInitialized = true;
            });
            useUserStore.getState().reset();
          }
        });

        return unsubscribe;
      },

      login: async (email, password) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const authUser = await loginWithEmail(email, password);
          const user = mapAuthUserToUser(authUser);

          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });

          // Load user profile
          const profile = await getUserProfile(authUser.id);
          if (profile) {
            useUserStore.getState().setProfile(profile);
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Erreur de connexion';
            state.isLoading = false;
          });
        }
      },

      register: async (email, password, displayName) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const authUser = await registerWithEmail(email, password, displayName);
          const user = mapAuthUserToUser(authUser);

          // Create user profile in Firestore
          const profile = await createUserProfile(authUser.id, {
            email: authUser.email,
            displayName,
          });

          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });

          useUserStore.getState().setProfile(profile);
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : "Erreur d'inscription";
            state.isLoading = false;
          });
        }
      },

      loginAsGuest: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const authUser = await firebaseLoginAsGuest();
          const user = mapAuthUserToUser(authUser);

          // Create guest profile in Firestore
          const profile = await createUserProfile(authUser.id, {
            email: null,
            displayName: 'Invité',
          });

          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });

          useUserStore.getState().setProfile(profile);
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Erreur de connexion invité';
            state.isLoading = false;
          });
        }
      },

      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          await firebaseLogout();
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
          });
          useUserStore.getState().reset();
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Erreur de déconnexion';
            state.isLoading = false;
          });
        }
      },

      resetPassword: async (email) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await firebaseResetPassword(email);
          set((state) => {
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error =
              error instanceof Error ? error.message : 'Erreur de réinitialisation';
            state.isLoading = false;
          });
        }
      },
    }))
  )
);
