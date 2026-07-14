import type { Router } from 'expo-router';

import type { PartnerProgram } from '@/types/program';
import { useProgramStore } from '@/stores';

/**
 * Démarre le flux de jeu d'un programme (écran QUICK GAME supprimé).
 *
 * - Si un persona valide est déjà mémorisé sur l'inscription → va DIRECT à
 *   l'écran de mode (locale / en ligne) en transmettant le profil.
 * - Sinon → ouvre d'abord l'écran de choix de profil (persona), qui enchaînera
 *   ensuite vers l'écran de mode.
 *
 * On peut TOUJOURS jouer (même parcours terminé) ; le formulaire de candidature
 * n'est proposé qu'en fin de partie (écran de résultats).
 */
export function startProgramPlay(
  router: Router,
  program: Pick<PartnerProgram, 'id' | 'profiles'>,
  userId: string,
  playerName?: string,
  replace = false,
): void {
  const enrollment = useProgramStore.getState().getEnrollmentForProgram(program.id, userId);
  const chosen = program.profiles?.find(
    (p) => p.id === enrollment?.profileId && p.enabled !== false && !p.isDraft,
  );

  const nav = replace ? router.replace : router.push;

  if (chosen) {
    nav({
      pathname: '/(programs)/play/mode/[programId]',
      params: {
        programId: program.id,
        playerName: (playerName ?? '').trim(),
        profileId: chosen.id,
        profileName: chosen.name,
      },
    });
    return;
  }

  nav({
    pathname: '/(programs)/play/profile/[programId]',
    params: { programId: program.id, playerName: (playerName ?? '').trim() },
  });
}
