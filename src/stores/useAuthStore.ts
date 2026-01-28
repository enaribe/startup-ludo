import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

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

      login: async (_email, _password) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // TODO: Implement Firebase Auth login
          // const userCredential = await auth().signInWithEmailAndPassword(email, password);
          // const user = userCredential.user;
          // set((state) => {
          //   state.user = { ... };
          //   state.isAuthenticated = true;
          // });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Erreur de connexion';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      register: async (_email, _password, _displayName) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // TODO: Implement Firebase Auth registration
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : "Erreur d'inscription";
          });
        } finally {
          set((state) => {
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
          // TODO: Implement anonymous Firebase Auth
          const guestUser: User = {
            id: `guest_${Date.now()}`,
            email: '',
            displayName: 'Invité',
            isGuest: true,
            createdAt: Date.now(),
            lastLogin: Date.now(),
          };

          set((state) => {
            state.user = guestUser;
            state.isAuthenticated = true;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Erreur de connexion invité';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          // TODO: Implement Firebase Auth logout
          // await auth().signOut();
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Erreur de déconnexion';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      resetPassword: async (_email) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // TODO: Implement Firebase Auth password reset
          // await auth().sendPasswordResetEmail(email);
        } catch (error) {
          set((state) => {
            state.error =
              error instanceof Error ? error.message : 'Erreur de réinitialisation';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },
    }))
  )
);
