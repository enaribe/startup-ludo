/**
 * Firebase Authentication Service
 * Uses @react-native-firebase/auth for native authentication
 */
import auth, { FirebaseAuthTypes, onAuthStateChanged } from '@react-native-firebase/auth';
import { firebaseLog, getFirebaseErrorMessage } from './config';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  photoURL?: string | null;
  phoneNumber?: string | null;
}

// Convert Firebase User to our AuthUser type
const mapFirebaseUser = (user: FirebaseAuthTypes.User): AuthUser => ({
  id: user.uid,
  email: user.email,
  displayName: user.displayName,
  isAnonymous: user.isAnonymous,
  emailVerified: user.emailVerified,
  photoURL: user.photoURL,
  phoneNumber: user.phoneNumber,
});

// Sign in with email and password
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  try {
    firebaseLog('Attempting email login', { email });
    const credential = await auth().signInWithEmailAndPassword(email, password);
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
    const credential = await auth().createUserWithEmailAndPassword(email, password);

    // Update display name
    await credential.user.updateProfile({ displayName });

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
    const credential = await auth().signInAnonymously();

    // Set a default display name for guests
    await credential.user.updateProfile({ displayName: 'Invité' });

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
    await auth().signOut();
    firebaseLog('Logout successful');
  } catch (error) {
    firebaseLog('Logout failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Delete user account
export const deleteUserAccount = async (): Promise<void> => {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('Aucun utilisateur connecté');
  }

  try {
    firebaseLog('Attempting to delete user account', { uid: user.uid });
    await user.delete();
    firebaseLog('User account deleted successfully');
  } catch (error) {
    firebaseLog('Account deletion failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    firebaseLog('Sending password reset email', { email });
    await auth().sendPasswordResetEmail(email);
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
  const user = auth().currentUser;
  if (!user) {
    throw new Error('Aucun utilisateur connecté');
  }

  try {
    firebaseLog('Updating user profile', updates);
    await user.updateProfile(updates);
    firebaseLog('Profile updated successfully');
  } catch (error) {
    firebaseLog('Profile update failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Get current user
export const getCurrentUser = (): AuthUser | null => {
  const user = auth().currentUser;
  return user ? mapFirebaseUser(user) : null;
};

// Subscribe to auth state changes
export const subscribeToAuthState = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  firebaseLog('Subscribing to auth state changes');
  console.log('[Firebase Auth] Setting up onAuthStateChanged listener...');

  // v22+ syntax: use standalone onAuthStateChanged function
  const unsubscribe = onAuthStateChanged(auth(), (firebaseUser) => {
    console.log('[Firebase Auth] onAuthStateChanged callback triggered');
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

// Get the native auth instance for use in other modules
export const getAuthInstance = () => auth();
