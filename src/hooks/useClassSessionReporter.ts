/**
 * useClassSessionReporter — remontée de la partie vers la séance de classe.
 *
 * Branché sur l'écran de jeu, il n'est ACTIF que si la partie porte un
 * `classContext`. Dans tous les autres cas (partie normale, programme,
 * challenge, online) chacune de ses fonctions est un no-op immédiat : le hook
 * peut donc être monté inconditionnellement, sans condition à l'appel.
 *
 * ═══ POURQUOI CE HOOK, ET PAS DES APPELS DIRECTS DEPUIS L'ÉCRAN ═══
 *
 * Trois exigences que l'écran de jeu ne doit pas avoir à porter :
 *
 *   1. LE JEU NE DOIT JAMAIS ATTENDRE LE RÉSEAU. Tout ce qui est exposé ici est
 *      synchrone et retourne `void` : il n'y a rien à `await`, donc rien qui
 *      puisse bloquer la boucle de jeu, même par inadvertance. En dessous, le
 *      service avale ses propres rejets.
 *   2. LE DÉBIT EST BORNÉ. La progression change à chaque case ; l'écrire à
 *      chaque fois coûterait des centaines d'écritures par partie et par élève,
 *      pour une information que l'enseignant lit toutes les 30 secondes. D'où
 *      le throttle à 10 s — avec envoi immédiat sur les événements notables
 *      (réponse à un quiz, fin de partie), qui eux ne doivent pas attendre.
 *   3. LE DERNIER ÉTAT NE SE PERD PAS. Un throttle naïf jette la mise à jour
 *      qui arrive pendant la période de garde. Ici elle est mémorisée et
 *      envoyée à l'expiration : l'enseignant voit toujours la position réelle,
 *      au pire avec 10 s de retard.
 */

import { useCallback, useEffect, useRef } from 'react';

import {
  enregistrerReponse,
  mettreAJourProgression,
  rejoindreSeance,
  terminerSeance,
} from '@/services/firebase/classService';
import type { ClassAnswer, ClassGameContext, ClassProgress } from '@/types/class';

/** Période minimale entre deux écritures de progression, en millisecondes. */
const THROTTLE_PROGRESSION_MS = 10_000;

/** Ce que le hook expose à l'écran de jeu. Tout est synchrone et sans effet visible. */
export interface ClassSessionReporter {
  /** True si la partie en cours appartient à une séance de classe. */
  readonly actif: boolean;
  /** Progression : envoyée au plus une fois par 10 s (la dernière valeur gagne). */
  signalerProgression: (progress: ClassProgress) => void;
  /** Réponse à un quiz : envoyée IMMÉDIATEMENT — c'est la donnée du rapport. */
  signalerReponse: (reponse: Omit<ClassAnswer, 'answeredAt'>) => void;
  /** Fin de partie : dernière écriture, statut `finished` (ou `abandoned`). */
  signalerFin: (data?: { progress?: ClassProgress; score?: number; abandoned?: boolean }) => void;
}

/**
 * @param classContext Contexte de séance de la partie en cours, ou `undefined`
 *        pour toute autre partie — auquel cas le hook est entièrement inerte.
 */
export function useClassSessionReporter(
  classContext: ClassGameContext | undefined
): ClassSessionReporter {
  const actif = !!classContext;

  // Le contexte est lu dans un ref et non dans les dépendances des callbacks :
  // les fonctions rendues doivent être STABLES. Une identité qui change à
  // chaque rendu ferait re-souscrire les `useCallback` de l'écran de jeu à
  // chaque tour — exactement ce qu'il faut éviter dans la boucle de jeu.
  const contexteRef = useRef<ClassGameContext | undefined>(classContext);
  contexteRef.current = classContext;

  /** Horodatage du dernier envoi de progression réellement parti. */
  const dernierEnvoiRef = useRef(0);
  /** Progression reçue pendant la période de garde, en attente d'envoi. */
  const enAttenteRef = useRef<ClassProgress | null>(null);
  /** Minuterie de vidange de `enAttenteRef`. */
  const minuterieRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Vrai une fois `signalerFin` passé : plus rien ne doit être écrit ensuite. */
  const termineRef = useRef(false);

  /** Envoi effectif, sans condition de débit. */
  const envoyerProgression = useCallback((progress: ClassProgress) => {
    const contexte = contexteRef.current;
    if (!contexte) return;
    dernierEnvoiRef.current = Date.now();
    enAttenteRef.current = null;
    // `void` en dessous : aucune promesse ne remonte jusqu'ici.
    mettreAJourProgression(contexte.sessionId, contexte.learnerId, {
      progress,
      score: progress.tokens,
    });
  }, []);

  const signalerProgression = useCallback(
    (progress: ClassProgress) => {
      if (!contexteRef.current || termineRef.current) return;

      const depuisDernier = Date.now() - dernierEnvoiRef.current;
      if (depuisDernier >= THROTTLE_PROGRESSION_MS) {
        envoyerProgression(progress);
        return;
      }

      // Dans la période de garde : on retient la valeur la plus récente et on
      // programme UNE vidange. Sans ce report, la dernière position d'une
      // partie qui se termine juste après une écriture serait perdue.
      enAttenteRef.current = progress;
      if (minuterieRef.current) return;
      minuterieRef.current = setTimeout(() => {
        minuterieRef.current = null;
        const enAttente = enAttenteRef.current;
        if (enAttente && !termineRef.current) envoyerProgression(enAttente);
      }, THROTTLE_PROGRESSION_MS - depuisDernier);
    },
    [envoyerProgression]
  );

  const signalerReponse = useCallback((reponse: Omit<ClassAnswer, 'answeredAt'>) => {
    const contexte = contexteRef.current;
    if (!contexte || termineRef.current) return;
    // Horodaté ICI, à l'instant de la réponse : si l'écriture part en différé
    // (hors ligne), le rapport pédagogique garde l'heure réelle et non celle de
    // la reconnexion.
    enregistrerReponse(contexte.sessionId, contexte.learnerId, {
      ...reponse,
      answeredAt: Date.now(),
    });
  }, []);

  const signalerFin = useCallback(
    (data?: { progress?: ClassProgress; score?: number; abandoned?: boolean }) => {
      const contexte = contexteRef.current;
      if (!contexte || termineRef.current) return;
      termineRef.current = true;

      // Une vidange de progression programmée écraserait le statut `finished`
      // par un `playing` quelques secondes plus tard : on l'annule.
      if (minuterieRef.current) {
        clearTimeout(minuterieRef.current);
        minuterieRef.current = null;
      }
      enAttenteRef.current = null;

      terminerSeance(contexte.sessionId, contexte.learnerId, data);
    },
    []
  );

  // Entrée en séance : un seul signal, au montage de la partie. `joinedAt` ne
  // doit pas être réécrit à chaque rendu, d'où le ref de garde.
  const entreeSignaleeRef = useRef(false);
  useEffect(() => {
    if (!classContext || entreeSignaleeRef.current) return;
    entreeSignaleeRef.current = true;
    rejoindreSeance(classContext.sessionId, classContext.learnerId);
  }, [classContext]);

  // Nettoyage : la minuterie ne doit pas survivre à l'écran de jeu.
  useEffect(
    () => () => {
      if (minuterieRef.current) clearTimeout(minuterieRef.current);
      minuterieRef.current = null;
    },
    []
  );

  return { actif, signalerProgression, signalerReponse, signalerFin };
}
