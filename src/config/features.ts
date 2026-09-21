/**
 * Interrupteurs de fonctionnalités (feature flags).
 *
 * SPONSOR_FEATURES_ENABLED — circuit sponsor complet (Espace Annonceur) :
 *   - cartes sponsors en partie (opportunités / financements / événements
 *     promus avec liens externes) tirées du feed des campagnes ;
 *   - popup d'édition sponsorisée au choix de l'édition (local-setup,
 *     create-room) ;
 *   - métriques de vues/durée des parties sponsorisées (useGameStore) ;
 *   - listeners Firestore du feed et des compteurs de vues (EventManager) ;
 *   - popup de déclaration de région (ciblage des campagnes) sur l'accueil
 *     et l'entrée « Région » des paramètres ;
 *   - section « Mes opportunités » du profil.
 *
 * → Passer à `false` pour tout désactiver d'un coup.
 */
export const SPONSOR_FEATURES_ENABLED = true;

/**
 * CLASS_MODE_ENABLED — Mode Classe (parcours élève : rattachement par code
 * de salle d'attente ou QR, mes classes, séances) :
 *   - carte « Mode Classe » de l'écran de sélection de mode ;
 *   - accès direct au groupe de routes (class) (deep link compris).
 *
 * → Passer à `false` pour tout désactiver d'un coup.
 */
export const CLASS_MODE_ENABLED = true;

/**
 * EMAIL_OTP_ENABLED — vérification d'email par code à l'inscription
 * (écran verify-email + Cloud Functions sendEmailOtp/verifyEmailOtp via
 * SendGrid). En pause tant que la clé SendGrid n'est pas posée et les
 * functions pas déployées : l'inscription email enchaîne directement sur
 * le choix du pseudo, comme avant.
 *
 * → Passer à `true` pour réactiver tout le parcours d'un coup.
 */
export const EMAIL_OTP_ENABLED = false;
