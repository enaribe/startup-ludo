/**
 * useChallengeEnroll — Logique d'inscription à un programme challenge
 *
 * Centralise la logique partagée entre home.tsx et challenge-explorer.tsx :
 * - Affichage du formulaire d'inscription
 * - Création de l'enrollment uniquement après soumission du formulaire
 * - Navigation vers challenge-hub après inscription
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useChallengeStore, useAuthStore } from '@/stores';
import type { EnrollmentFormData } from '@/types/challenge';

export function useChallengeEnroll() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';

  const enrollInChallenge = useChallengeStore((s) => s.enrollInChallenge);
  const submitEnrollmentForm = useChallengeStore((s) => s.submitEnrollmentForm);
  const setActiveChallenge = useChallengeStore((s) => s.setActiveChallenge);
  const getActiveChallenge = useChallengeStore((s) => s.getActiveChallenge);
  const getEnrollmentForChallenge = useChallengeStore((s) => s.getEnrollmentForChallenge);

  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

  const activeChallengeName = getActiveChallenge()?.name ?? 'Programme';

  /**
   * Appelé quand l'utilisateur clique "Rejoindre" sur une carte.
   * On NE crée PAS encore l'enrollment — on attend la soumission du formulaire.
   */
  const handleEnroll = useCallback((challengeId: string) => {
    if (!userId) return;
    setActiveChallenge(challengeId);
    setPendingChallengeId(challengeId);
    setShowEnrollmentForm(true);
  }, [userId, setActiveChallenge]);

  /**
   * Appelé quand l'utilisateur clique "Continuer" sur une carte déjà inscrite.
   * Si formData manque encore, on réaffiche le formulaire.
   */
  const handleContinue = useCallback((challengeId: string) => {
    setActiveChallenge(challengeId);
    const enrollment = getEnrollmentForChallenge(challengeId, userId);
    if (enrollment && enrollment.formData == null) {
      setPendingChallengeId(challengeId);
      setShowEnrollmentForm(true);
    } else {
      router.push('/(challenges)/challenge-hub');
    }
  }, [setActiveChallenge, getEnrollmentForChallenge, userId, router]);

  /**
   * Soumission du formulaire :
   * 1. Crée l'enrollment (si pas encore existant)
   * 2. Sauvegarde les données du formulaire
   * 3. Navigue vers challenge-hub
   */
  const handleFormSubmit = useCallback((formData: EnrollmentFormData) => {
    if (!userId || !pendingChallengeId) return;

    // Crée l'enrollment maintenant (pas avant)
    const enrollment = enrollInChallenge(pendingChallengeId, userId);
    submitEnrollmentForm(enrollment.id, formData);

    setShowEnrollmentForm(false);
    setPendingChallengeId(null);
    router.push('/(challenges)/challenge-hub');
  }, [userId, pendingChallengeId, enrollInChallenge, submitEnrollmentForm, router]);

  const handleFormClose = useCallback(() => {
    setShowEnrollmentForm(false);
    setPendingChallengeId(null);
    // Si l'enrollment avait déjà été créé (cas continuer avec formData null),
    // on ne le supprime pas — l'utilisateur peut revenir plus tard.
  }, []);

  return {
    showEnrollmentForm,
    activeChallengeName,
    handleEnroll,
    handleContinue,
    handleFormSubmit,
    handleFormClose,
  };
}
