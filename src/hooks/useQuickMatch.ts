/**
 * useQuickMatch - Hook de matchmaking rapide
 *
 * Principe :
 * 1. Le joueur dépose un ticket dans la file d'attente
 * 2. On écoute la file pour détecter N joueurs compatibles
 * 3. Le joueur avec le ticket le PLUS ANCIEN devient "lead" → crée la room
 * 4. Les autres rejoignent la room via leur ticket mis à jour
 *
 * Ce design évite les doublons car c'est toujours le même qui décide (le plus ancien)
 * et la transaction RTDB empêche deux leads de matcher les mêmes tickets.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { multiplayerSync } from '@/services/multiplayer';
import type { MatchmakingTicket } from '@/services/firebase/config';

export type QuickMatchState = 'idle' | 'searching' | 'matched' | 'joining' | 'error';

interface QuickMatchParams {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  maxPlayers: 2 | 3 | 4;
  startupId: string;
  startupName: string;
  isDefaultProject: boolean;
  sector: string;
  edition: string;
}

interface QuickMatchResult {
  state: QuickMatchState;
  foundTickets: MatchmakingTicket[]; // joueurs en attente compatibles (inclut le mien)
  elapsedSeconds: number;
  roomId: string | null;
  error: string | null;
  start: (params: QuickMatchParams) => Promise<void>;
  cancel: () => Promise<void>;
}

export function useQuickMatch(): QuickMatchResult {
  const [state, setState] = useState<QuickMatchState>('idle');
  const [foundTickets, setFoundTickets] = useState<MatchmakingTicket[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs pour éviter les closures stales dans les subscriptions
  const myTicketIdRef = useRef<string | null>(null);
  const paramsRef = useRef<QuickMatchParams | null>(null);
  const leadAttemptInProgressRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubQueueRef = useRef<(() => void) | null>(null);
  const unsubTicketRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (unsubQueueRef.current) {
      unsubQueueRef.current();
      unsubQueueRef.current = null;
    }
    if (unsubTicketRef.current) {
      unsubTicketRef.current();
      unsubTicketRef.current = null;
    }
  }, []);

  const cancel = useCallback(async () => {
    cleanup();
    const ticketId = myTicketIdRef.current;
    if (ticketId) {
      await multiplayerSync.removeMatchmakingTicket(ticketId).catch(() => {});
      myTicketIdRef.current = null;
    }
    paramsRef.current = null;
    leadAttemptInProgressRef.current = false;
    setState('idle');
    setFoundTickets([]);
    setElapsedSeconds(0);
    setRoomId(null);
    setError(null);
  }, [cleanup]);

  // Cleanup à l'unmount
  useEffect(() => {
    return () => {
      cleanup();
      const ticketId = myTicketIdRef.current;
      if (ticketId) {
        multiplayerSync.removeMatchmakingTicket(ticketId).catch(() => {});
      }
    };
  }, [cleanup]);

  const start = useCallback(async (params: QuickMatchParams) => {
    setError(null);
    setState('searching');
    setElapsedSeconds(0);
    setFoundTickets([]);
    setRoomId(null);
    paramsRef.current = params;

    // Timer pour l'affichage
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    try {
      const ticketId = await multiplayerSync.enqueueMatchmakingTicket({
        userId: params.userId,
        displayName: params.displayName,
        avatarUrl: params.avatarUrl,
        maxPlayers: params.maxPlayers,
        startupId: params.startupId,
        startupName: params.startupName,
        isDefaultProject: params.isDefaultProject,
        sector: params.sector,
        edition: params.edition,
      });
      myTicketIdRef.current = ticketId;

      // Abonnement au propre ticket : détecter quand on est matché (par un autre lead)
      unsubTicketRef.current = multiplayerSync.subscribeToMatchmakingTicket(
        ticketId,
        async (ticket) => {
          if (!ticket) return;
          if (ticket.status === 'matched' && ticket.roomId) {
            // Un autre lead nous a matchés — on rejoint la room
            setState('joining');
            setRoomId(ticket.roomId);
          }
        }
      );

      // Abonnement à la queue : détecter quand on a N tickets compatibles
      unsubQueueRef.current = multiplayerSync.subscribeToMatchmakingQueue(
        async (allTickets) => {
          const myParams = paramsRef.current;
          const myTicketId = myTicketIdRef.current;
          if (!myParams || !myTicketId) return;

          // Filtre : mêmes critères, status waiting, triés par createdAt (déjà fait par RTDB)
          const compatible = allTickets.filter(
            (t) =>
              t.status === 'waiting' &&
              t.maxPlayers === myParams.maxPlayers
          );

          setFoundTickets(compatible);

          // Assez de joueurs ?
          if (compatible.length < myParams.maxPlayers) return;

          // Prendre les N plus anciens
          const group = compatible.slice(0, myParams.maxPlayers);
          const myTicket = group.find((t) => t.id === myTicketId);
          if (!myTicket) return; // Je ne suis pas dans le groupe des plus anciens → j'attends

          // Suis-je le plus ancien ? (donc le "lead")
          const oldest = group[0];
          if (!oldest || oldest.id !== myTicketId) return; // quelqu'un d'autre va être lead

          if (leadAttemptInProgressRef.current) return;
          leadAttemptInProgressRef.current = true;

          try {
            const createdRoomId = await multiplayerSync.tryCreateRoomFromTickets(
              group,
              myParams.userId,
              myParams.displayName
            );

            if (createdRoomId) {
              setRoomId(createdRoomId);
              setState('matched');
            }
            // Si null : un autre lead a gagné, on reste en searching et on retentera au prochain snapshot
          } finally {
            leadAttemptInProgressRef.current = false;
          }
        }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur de recherche';
      setError(msg);
      setState('error');
      cleanup();
    }
  }, [cleanup]);

  return {
    state,
    foundTickets,
    elapsedSeconds,
    roomId,
    error,
    start,
    cancel,
  };
}
