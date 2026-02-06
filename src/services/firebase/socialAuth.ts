/**
 * Social Authentication Service
 * Google Sign-In, Apple Sign-In, and Phone Auth with @react-native-firebase/auth
 */

import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import type { AuthUser } from './auth';
import { firebaseLog, getFirebaseErrorMessage } from './config';

// ============================================
// CONFIGURATION
// ============================================

// Web Client ID from Firebase Console > Authentication > Sign-in method > Google
const GOOGLE_WEB_CLIENT_ID = '767192713144-pvimhe0rof56hjpc89b25jfmct2q2kh8.apps.googleusercontent.com';

/**
 * Configure Google Sign-In
 * Call this once at app startup
 */
export const configureGoogleSignIn = (): void => {
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });
    firebaseLog('Google Sign-In configured');
  } catch (error) {
    firebaseLog('Failed to configure Google Sign-In', error);
  }
};

// ============================================
// GOOGLE SIGN-IN
// ============================================

/**
 * Sign in with Google
 * Returns Firebase AuthUser on success
 */
export const signInWithGoogle = async (): Promise<AuthUser> => {
  try {
    firebaseLog('Starting Google Sign-In');

    // Check if Google Play Services are available (Android only)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Perform Google Sign-In
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      throw new Error('Google Sign-In was cancelled');
    }

    const { idToken } = response.data;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    firebaseLog('Google Sign-In successful, authenticating with Firebase');

    // Create Firebase credential from Google token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase with the Google credential
    const userCredential = await auth().signInWithCredential(googleCredential);

    firebaseLog('Firebase authentication successful', { uid: userCredential.user.uid });

    return mapFirebaseUser(userCredential.user);
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          throw new Error('Connexion Google annulée');
        case statusCodes.IN_PROGRESS:
          throw new Error('Connexion déjà en cours');
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error('Google Play Services non disponible');
        default:
          firebaseLog('Google Sign-In error', error);
          throw new Error(getFirebaseErrorMessage(error));
      }
    }
    firebaseLog('Google Sign-In error', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/**
 * Link Google account to current anonymous user
 */
export const linkGoogleAccount = async (): Promise<AuthUser> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('Aucun utilisateur connecté');
  }

  try {
    firebaseLog('Linking Google account');

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      throw new Error('Google Sign-In was cancelled');
    }

    const { idToken } = response.data;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await currentUser.linkWithCredential(googleCredential);

    firebaseLog('Google account linked successfully', { uid: userCredential.user.uid });

    return mapFirebaseUser(userCredential.user);
  } catch (error) {
    firebaseLog('Failed to link Google account', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    firebaseLog('Signed out from Google');
  } catch (error) {
    firebaseLog('Error signing out from Google', error);
  }
};

// ============================================
// APPLE SIGN-IN
// ============================================

/**
 * Check if Apple Sign-In is available
 */
export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return await AppleAuthentication.isAvailableAsync();
};

/**
 * Sign in with Apple
 * Returns Firebase AuthUser on success
 */
export const signInWithApple = async (): Promise<AuthUser> => {
  try {
    firebaseLog('Starting Apple Sign-In');

    // Check availability
    const isAvailable = await isAppleSignInAvailable();
    if (!isAvailable) {
      throw new Error('Apple Sign-In non disponible sur cet appareil');
    }

    // Generate nonce for security
    const nonce = await generateNonce();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    );

    // Request Apple Sign-In
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const { identityToken, fullName } = appleCredential;

    if (!identityToken) {
      throw new Error('No identity token received from Apple');
    }

    firebaseLog('Apple Sign-In successful, authenticating with Firebase');

    // Create Firebase credential from Apple token
    const credential = auth.AppleAuthProvider.credential(identityToken, nonce);

    // Sign in to Firebase with the Apple credential
    const userCredential = await auth().signInWithCredential(credential);

    // Update display name if provided by Apple (only on first sign-in)
    if (fullName?.givenName && !userCredential.user.displayName) {
      const displayName = [fullName.givenName, fullName.familyName]
        .filter(Boolean)
        .join(' ');

      if (displayName) {
        await userCredential.user.updateProfile({ displayName });
      }
    }

    firebaseLog('Firebase authentication successful', { uid: userCredential.user.uid });

    return mapFirebaseUser(userCredential.user);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const appleError = error as { code: string };
      if (appleError.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Connexion Apple annulée');
      }
    }
    firebaseLog('Apple Sign-In error', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/**
 * Link Apple account to current anonymous user
 */
export const linkAppleAccount = async (): Promise<AuthUser> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('Aucun utilisateur connecté');
  }

  try {
    firebaseLog('Linking Apple account');

    const isAvailable = await isAppleSignInAvailable();
    if (!isAvailable) {
      throw new Error('Apple Sign-In non disponible sur cet appareil');
    }

    const nonce = await generateNonce();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    );

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const { identityToken } = appleCredential;

    if (!identityToken) {
      throw new Error('No identity token received from Apple');
    }

    const credential = auth.AppleAuthProvider.credential(identityToken, nonce);
    const userCredential = await currentUser.linkWithCredential(credential);

    firebaseLog('Apple account linked successfully', { uid: userCredential.user.uid });

    return mapFirebaseUser(userCredential.user);
  } catch (error) {
    firebaseLog('Failed to link Apple account', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// ============================================
// PHONE AUTHENTICATION
// ============================================

// Store confirmation result for verification step
let phoneAuthConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;
let verificationId: string | null = null;

/**
 * Send SMS verification code to phone number
 * @param phoneNumber - Phone number in E.164 format (e.g., +33612345678)
 */
export const sendPhoneVerificationCode = async (phoneNumber: string): Promise<void> => {
  try {
    firebaseLog('Sending phone verification code', { phoneNumber });

    // Format phone number if needed
    const formattedNumber = formatPhoneNumber(phoneNumber);

    // Send verification code
    phoneAuthConfirmation = await auth().signInWithPhoneNumber(formattedNumber);

    firebaseLog('Verification code sent successfully');
  } catch (error) {
    firebaseLog('Failed to send verification code', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/**
 * Verify the SMS code and sign in
 * @param code - 6-digit verification code
 */
export const verifyPhoneCode = async (code: string): Promise<AuthUser> => {
  if (!phoneAuthConfirmation) {
    throw new Error('Aucun code de vérification envoyé. Veuillez demander un nouveau code.');
  }

  try {
    firebaseLog('Verifying phone code');

    const userCredential = await phoneAuthConfirmation.confirm(code);

    if (!userCredential) {
      throw new Error('Échec de la vérification du code');
    }

    firebaseLog('Phone authentication successful', { uid: userCredential.user.uid });

    // Clear the confirmation
    phoneAuthConfirmation = null;

    return mapFirebaseUser(userCredential.user);
  } catch (error) {
    firebaseLog('Phone verification failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/**
 * Link phone number to current user
 * @param phoneNumber - Phone number in E.164 format
 */
export const sendPhoneLinkCode = async (phoneNumber: string): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('Aucun utilisateur connecté');
  }

  try {
    firebaseLog('Sending phone link verification code', { phoneNumber });

    const formattedNumber = formatPhoneNumber(phoneNumber);

    // verifyPhoneNumber returns a different type - it gives us a verificationId
    const result = await auth().verifyPhoneNumber(formattedNumber);
    verificationId = result.verificationId;

    firebaseLog('Verification code sent for linking');
  } catch (error) {
    firebaseLog('Failed to send link verification code', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/**
 * Verify code and link phone to current user
 * @param code - 6-digit verification code
 */
export const verifyPhoneLinkCode = async (code: string): Promise<AuthUser> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('Aucun utilisateur connecté');
  }

  if (!verificationId) {
    throw new Error('Aucun code de vérification envoyé. Veuillez demander un nouveau code.');
  }

  try {
    firebaseLog('Verifying phone link code');

    // For linking, we need to create a credential and link it
    const credential = auth.PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await currentUser.linkWithCredential(credential);

    firebaseLog('Phone linked successfully', { uid: userCredential.user.uid });

    verificationId = null;

    return mapFirebaseUser(userCredential.user);
  } catch (error) {
    firebaseLog('Phone link verification failed', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/**
 * Resend verification code
 * @param phoneNumber - Phone number in E.164 format
 */
export const resendPhoneVerificationCode = async (phoneNumber: string): Promise<void> => {
  // Simply call sendPhoneVerificationCode again
  await sendPhoneVerificationCode(phoneNumber);
};

// ============================================
// HELPERS
// ============================================

/**
 * Generate a secure random nonce
 */
const generateNonce = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(new Uint8Array(randomBytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Format phone number to E.164 format
 * Assumes French numbers if no country code provided
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // If starts with 0, assume French number and add +33
  if (cleaned.startsWith('0')) {
    cleaned = '+33' + cleaned.substring(1);
  }

  // If doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

/**
 * Map Firebase User to AuthUser type
 */
const mapFirebaseUser = (user: FirebaseAuthTypes.User): AuthUser => ({
  id: user.uid,
  email: user.email,
  displayName: user.displayName,
  isAnonymous: user.isAnonymous,
  emailVerified: user.emailVerified,
  photoURL: user.photoURL,
  phoneNumber: user.phoneNumber,
});
