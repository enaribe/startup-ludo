/**
 * emailOtp — vérification d'email par code à 6 chiffres (OTP).
 *
 * Firebase ne sait envoyer nativement qu'un LIEN de vérification ; pour un
 * code saisi dans l'app, on génère et envoie l'OTP nous-mêmes via Brevo.
 *
 * Deux endpoints HTTP (POST, `Authorization: Bearer <idToken Firebase>`) :
 *   - sendEmailOtp   : génère un code, le stocke haché dans
 *     `emailOtps/{uid}` (TTL 10 min, cooldown 60 s entre envois) et
 *     l'envoie à l'adresse du compte via l'API Brevo.
 *   - verifyEmailOtp : compare le code ({ code: "123456" }), 5 essais max,
 *     puis marque `emailVerified: true` via l'Admin SDK et supprime l'OTP.
 *
 * Sécurité : la collection `emailOtps` n'a AUCUNE règle Firestore → refusée
 * par défaut aux clients, seul l'Admin SDK y accède. Le code n'est jamais
 * stocké en clair (SHA-256 salé par l'uid).
 *
 * Secrets/params à poser avant déploiement :
 *   firebase functions:secrets:set SENDGRID_API_KEY   (clé SG.xxx)
 *   (SENDGRID_SENDER_EMAIL : adresse expéditrice sur le domaine authentifié
 *    du compte SendGrid — ici adepme.sn — posée via .env des functions ou la
 *    valeur par défaut ci-dessous)
 */

import * as admin from 'firebase-admin';
import { defineSecret, defineString } from 'firebase-functions/params';
import { onRequest, type Request } from 'firebase-functions/v2/https';
import { createHash, randomInt } from 'crypto';

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const SENDGRID_SENDER_EMAIL = defineString('SENDGRID_SENDER_EMAIL', {
  default: 'noreply@adepme.sn',
});
const SENDER_NAME = 'Startup Ludo';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

/** Hash salé par l'uid : un même code chez deux joueurs donne deux hashs. */
const hashCode = (code: string, uid: string): string =>
  createHash('sha256').update(`${uid}:${code}`).digest('hex');

/** Résout l'utilisateur depuis l'en-tête `Authorization: Bearer <idToken>`. */
async function requireAuth(req: Request): Promise<admin.auth.DecodedIdToken | null> {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization ?? '');
  if (!match) return null;
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch {
    return null;
  }
}

function otpEmailHtml(code: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0C243E;border-radius:16px;color:#fff">
    <h2 style="color:#FFBC40;margin:0 0 8px">Startup Ludo</h2>
    <p style="margin:0 0 16px;color:#dbe4ee">Voici ton code de v&eacute;rification&nbsp;:</p>
    <p style="font-size:36px;letter-spacing:10px;font-weight:bold;text-align:center;margin:16px 0;color:#fff">${code}</p>
    <p style="margin:16px 0 0;color:#8fa3b8;font-size:13px">
      Ce code expire dans 10&nbsp;minutes. Si tu n'es pas &agrave; l'origine de
      cette demande, ignore simplement cet email.
    </p>
  </div>`;
}

export const sendEmailOtp = onRequest(
  { secrets: [SENDGRID_API_KEY], region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method-not-allowed' });
      return;
    }
    const decoded = await requireAuth(req);
    if (!decoded) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }

    const user = await admin.auth().getUser(decoded.uid);
    if (!user.email) {
      res.status(400).json({ error: 'no-email' });
      return;
    }
    if (user.emailVerified) {
      res.json({ ok: true, alreadyVerified: true });
      return;
    }

    const ref = admin.firestore().collection('emailOtps').doc(user.uid);
    const now = Date.now();
    const existing = await ref.get();
    if (existing.exists) {
      const lastSentAt = (existing.get('lastSentAt') as number | undefined) ?? 0;
      if (now - lastSentAt < RESEND_COOLDOWN_MS) {
        res.status(429).json({
          error: 'cooldown',
          retryInMs: RESEND_COOLDOWN_MS - (now - lastSentAt),
        });
        return;
      }
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await ref.set({
      codeHash: hashCode(code, user.uid),
      email: user.email,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
    });

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY.value()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: user.email }] }],
        from: { name: SENDER_NAME, email: SENDGRID_SENDER_EMAIL.value() },
        subject: 'Ton code de vérification Startup Ludo',
        content: [{ type: 'text/html', value: otpEmailHtml(code) }],
      }),
    });

    // SendGrid répond 202 (accepté) sans corps en cas de succès
    if (!sendgridResponse.ok) {
      console.error('[emailOtp] SendGrid a refusé l\'envoi', sendgridResponse.status, await sendgridResponse.text());
      res.status(502).json({ error: 'send-failed' });
      return;
    }

    console.log('[emailOtp] Code envoyé', { uid: user.uid });
    res.json({ ok: true });
  }
);

export const verifyEmailOtp = onRequest({ region: 'us-central1' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }
  const decoded = await requireAuth(req);
  if (!decoded) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }

  const code = String((req.body as { code?: unknown } | undefined)?.code ?? '');
  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ error: 'invalid-code' });
    return;
  }

  const ref = admin.firestore().collection('emailOtps').doc(decoded.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    res.status(400).json({ error: 'no-otp' });
    return;
  }

  const attempts = (snap.get('attempts') as number | undefined) ?? 0;
  if (attempts >= MAX_ATTEMPTS) {
    res.status(429).json({ error: 'too-many-attempts' });
    return;
  }
  if (Date.now() > ((snap.get('expiresAt') as number | undefined) ?? 0)) {
    res.status(400).json({ error: 'expired' });
    return;
  }
  if (snap.get('codeHash') !== hashCode(code, decoded.uid)) {
    await ref.update({ attempts: attempts + 1 });
    res.status(400).json({ error: 'invalid-code' });
    return;
  }

  await admin.auth().updateUser(decoded.uid, { emailVerified: true });
  await ref.delete();
  console.log('[emailOtp] Email vérifié', { uid: decoded.uid });
  res.json({ ok: true });
});
