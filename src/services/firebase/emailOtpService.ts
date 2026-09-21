/**
 * Email OTP Service — vérification d'email par code à 6 chiffres.
 *
 * Appelle les Cloud Functions `sendEmailOtp` / `verifyEmailOtp` en HTTP
 * direct (Authorization: Bearer <idToken>) : pas besoin du module natif
 * @react-native-firebase/functions, donc pas de rebuild.
 *
 * Toutes les fonctions retournent un résultat typé et ne throw jamais.
 */

import auth from '@react-native-firebase/auth';

import { firebaseLog } from './config';

const FUNCTIONS_BASE_URL = 'https://us-central1-startup-ludo-new.cloudfunctions.net';

export type EmailOtpError =
  | 'unauthenticated'
  | 'no-email'
  | 'cooldown'
  | 'send-failed'
  | 'invalid-code'
  | 'expired'
  | 'no-otp'
  | 'too-many-attempts'
  | 'network';

interface OtpResult {
  ok: boolean;
  alreadyVerified?: boolean;
  error?: EmailOtpError;
  /** Pour `cooldown` : délai restant avant de pouvoir renvoyer un code. */
  retryInMs?: number;
}

async function callOtpEndpoint(path: string, body?: object): Promise<OtpResult> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) return { ok: false, error: 'unauthenticated' };
    const idToken = await currentUser.getIdToken();

    const response = await fetch(`${FUNCTIONS_BASE_URL}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body ?? {}),
    });

    const data = (await response.json().catch(() => ({}))) as OtpResult;
    if (!response.ok) {
      firebaseLog('Email OTP endpoint refused', { path, status: response.status, data });
      return { ok: false, error: data.error ?? 'network', retryInMs: data.retryInMs };
    }
    return { ok: true, alreadyVerified: data.alreadyVerified };
  } catch (error) {
    firebaseLog('Email OTP call failed', { path, error });
    return { ok: false, error: 'network' };
  }
}

/** Envoie (ou renvoie) le code à l'adresse email du compte connecté. */
export function sendEmailOtp(): Promise<OtpResult> {
  return callOtpEndpoint('sendEmailOtp');
}

/**
 * Vérifie le code saisi. En cas de succès, recharge l'utilisateur Firebase
 * local pour que `emailVerified` passe à true immédiatement.
 */
export async function verifyEmailOtp(code: string): Promise<OtpResult> {
  const result = await callOtpEndpoint('verifyEmailOtp', { code });
  if (result.ok) {
    await auth().currentUser?.reload().catch(() => {});
  }
  return result;
}
