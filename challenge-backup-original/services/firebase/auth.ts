// Firebase Authentication Service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { auth, firebaseLog, getFirebaseErrorMessage } from './config';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
}

// Convert Firebase User to our AuthUser type
const mapFirebaseUser = (user: FirebaseUser): AuthUser => ({
  id: user.uid,
  email: user.email,
  displayName: user.displayName,
  isAnonymous: user.isAnonymous,
  emailVerified: user.emailVerified,
});

// Sign in with email and password
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  try {
    firebaseLog('Attempting email login', { email });
    const credential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    firebaseLog('Email login successful', { uid: credential.user.uid });
    return mapFirebaseUser(credential.user);
  } catch (error) {
    firebaseLog('Email login failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Register with email and password
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<AuthUser> => {
  try {
    firebaseLog('Attempting registration', { email, displayName });
    const credential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name
    await updateProfile(credential.user, { displayName });

    firebaseLog('Registration successful', { uid: credential.user.uid });
    return mapFirebaseUser(credential.user);
  } catch (error) {
    firebaseLog('Registration failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Sign in anonymously (guest mode)
export const loginAsGuest = async (): Promise<AuthUser> => {
  try {
    firebaseLog('Attempting anonymous login');
    const credential: UserCredential = await signInAnonymously(auth);

    // Set a default display name for guests
    await updateProfile(credential.user, { displayName: 'Invité' });

    firebaseLog('Anonymous login successful', { uid: credential.user.uid });
    return mapFirebaseUser(credential.user);
  } catch (error) {
    firebaseLog('Anonymous login failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Sign out
export const logout = async (): Promise<void> => {
  try {
    firebaseLog('Attempting logout');
    await signOut(auth);
    firebaseLog('Logout successful');
  } catch (error) {
    firebaseLog('Logout failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    firebaseLog('Sending password reset email', { email });
    await sendPasswordResetEmail(auth, email);
    firebaseLog('Password reset email sent');
  } catch (error) {
    firebaseLog('Password reset failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Update user profile
export const updateUserProfile = async (
  updates: { displayName?: string; photoURL?: string }
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Aucun utilisateur connecté');
  }

  try {
    firebaseLog('Updating user profile', updates);
    await updateProfile(user, updates);
    firebaseLog('Profile updated successfully');
  } catch (error) {
    firebaseLog('Profile update failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Get current user
export const getCurrentUser = (): AuthUser | null => {
  const user = auth.currentUser;
  return user ? mapFirebaseUser(user) : null;
};

// Subscribe to auth state changes
export const subscribeToAuthState = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  firebaseLog('Subscribing to auth state changes');

  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      firebaseLog('Auth state changed: user signed in', { uid: firebaseUser.uid });
      callback(mapFirebaseUser(firebaseUser));
    } else {
      firebaseLog('Auth state changed: user signed out');
      callback(null);
    }
  });

  return unsubscribe;
};
