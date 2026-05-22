/**
 * Storage Service — upload de fichiers vers Firebase Storage.
 *
 * ⚠️ DÉSACTIVÉ EN ATTENDANT UN REBUILD NATIF.
 * `@react-native-firebase/storage` est un module natif. Tant que l'app n'a pas
 * été reconstruite (`npx expo prebuild --clean` + nouveau build), importer ce
 * module crashe l'app. Ce service expose donc des stubs qui lèvent une erreur
 * explicite si on les appelle.
 *
 * Pour réactiver : restaurer le bloc commenté en bas, supprimer les stubs, et
 * remettre `import storage from '@react-native-firebase/storage';` en tête.
 */
import { firebaseLog } from './config';

const NOT_AVAILABLE_MSG =
  'La photo de profil sera activée après la prochaine mise à jour de l\'application.';

/**
 * Upload une photo de profil dans Firebase Storage et retourne son URL publique.
 * STUB : lève une erreur tant que le module natif n'est pas disponible.
 */
export const uploadAvatar = async (_userId: string, _localUri: string): Promise<string> => {
  firebaseLog('uploadAvatar appelé alors que Storage est désactivé');
  throw new Error(NOT_AVAILABLE_MSG);
};

/** Supprime la photo de profil — STUB désactivé. */
export const deleteAvatar = async (_userId: string): Promise<void> => {
  firebaseLog('deleteAvatar appelé alors que Storage est désactivé');
};

/* ========================================================================
 * VERSION COMPLÈTE — à restaurer après le rebuild natif.
 * Remettre en tête : import storage from '@react-native-firebase/storage';
 * et : import { firebaseLog, getFirebaseErrorMessage } from './config';
 * ========================================================================
 *
 * // Chemin du fichier avatar d'un utilisateur (cf. storage.rules).
 * const avatarPath = (userId: string): string => `avatars/${userId}/avatar.jpg`;
 *
 * export const uploadAvatar = async (userId: string, localUri: string): Promise<string> => {
 *   try {
 *     firebaseLog('uploadAvatar', { userId });
 *     const ref = storage().ref(avatarPath(userId));
 *     await ref.putFile(localUri, { contentType: 'image/jpeg' });
 *     const url = await ref.getDownloadURL();
 *     firebaseLog('uploadAvatar success', { userId });
 *     return url;
 *   } catch (error) {
 *     firebaseLog('uploadAvatar error', error);
 *     throw new Error(getFirebaseErrorMessage(error));
 *   }
 * };
 *
 * export const deleteAvatar = async (userId: string): Promise<void> => {
 *   try {
 *     await storage().ref(avatarPath(userId)).delete();
 *     firebaseLog('deleteAvatar success', { userId });
 *   } catch (error) {
 *     firebaseLog('deleteAvatar error (ignored)', error);
 *   }
 * };
 */
