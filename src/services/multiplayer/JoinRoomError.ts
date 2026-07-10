export type JoinRoomErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_STARTED'
  | 'ROOM_FINISHED'
  | 'ROOM_FULL'
  | 'NOT_ENROLLED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class JoinRoomError extends Error {
  readonly code: JoinRoomErrorCode;

  constructor(code: JoinRoomErrorCode, message: string) {
    super(message);
    this.name = 'JoinRoomError';
    this.code = code;
  }
}

interface JoinRoomErrorDisplay {
  title: string;
  message: string;
}

export function getJoinRoomErrorDisplay(code: JoinRoomErrorCode): JoinRoomErrorDisplay {
  switch (code) {
    case 'ROOM_NOT_FOUND':
      return {
        title: 'Code invalide',
        message: 'Aucun salon trouvé avec ce code. Vérifie le code et réessaie.',
      };
    case 'ROOM_STARTED':
      return {
        title: 'Partie déjà démarrée',
        message: 'Cette partie a déjà commencé. Tu ne peux plus la rejoindre.',
      };
    case 'ROOM_FINISHED':
      return {
        title: 'Partie terminée',
        message: 'Cette partie est déjà terminée.',
      };
    case 'ROOM_FULL':
      return {
        title: 'Salon plein',
        message: 'Ce salon est complet (maximum 4 joueurs).',
      };
    case 'NOT_ENROLLED':
      return {
        title: 'Programme réservé',
        message: 'Ce salon est réservé aux joueurs inscrits à ce programme.',
      };
    case 'NETWORK_ERROR':
      return {
        title: 'Problème de connexion',
        message: 'Vérifie ta connexion internet et réessaie.',
      };
    case 'UNKNOWN':
    default:
      return {
        title: 'Erreur',
        message: 'Une erreur inattendue est survenue. Réessaie dans un instant.',
      };
  }
}

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('timeout') ||
    msg.includes('connection')
  );
}
