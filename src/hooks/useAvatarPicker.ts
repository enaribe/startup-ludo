/**
 * useAvatarPicker — gestion de la photo / avatar de profil.
 *
 * Deux sources possibles :
 *  1. Avatar prédéfini (assets/images/avatars/) — `saveAvatar()` : ne dépend
 *     d'aucun module natif, fonctionne sans rebuild.
 *  2. Photo personnelle (caméra / galerie) — `changeAvatar()` : DÉSACTIVÉ tant
 *     que le rebuild natif (`expo-image-picker` + Firebase Storage) n'est pas
 *     fait. Voir le bloc commenté dans ce fichier et dans `storageService.ts`.
 */
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useAuthStore, useUserStore } from '@/stores';
import { updateFirestoreUserProfile } from '@/services/firebase';

export function useAvatarPicker() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);

  const [isSaving, setIsSaving] = useState(false);

  /**
   * Enregistre une valeur d'avatar (`avatar://avatarN` ou URL) dans Firestore
   * + les stores locaux. Utilisé par la galerie d'avatars prédéfinis.
   */
  const saveAvatar = useCallback(
    async (value: string) => {
      if (!user || isSaving) return;
      setIsSaving(true);
      try {
        await updateFirestoreUserProfile(user.id, { avatarUrl: value });
        setUser({ ...user, photoURL: value });
        if (profile) {
          setProfile({ ...profile, avatarUrl: value });
        }
      } catch (error) {
        Alert.alert(
          'Échec de la mise à jour',
          error instanceof Error ? error.message : "Impossible d'enregistrer l'avatar."
        );
      } finally {
        setIsSaving(false);
      }
    },
    [user, profile, isSaving, setUser, setProfile]
  );

  /**
   * Import d'une photo personnelle (caméra / galerie).
   * DÉSACTIVÉ : nécessite un rebuild natif (expo-image-picker + Storage).
   */
  const changeAvatar = useCallback(() => {
    Alert.alert(
      'Bientôt disponible',
      "L'import d'une photo personnelle sera activé dans une prochaine mise à jour."
    );
  }, []);

  return { saveAvatar, changeAvatar, isSaving };
}
