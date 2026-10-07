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
 * CIBLAGE_SPONSOR_ACTIF — filtrage des cartes promues par secteur et région.
 *
 * ═══ EN PAUSE DEPUIS LE 06/10/2026 ═══
 *
 * Le ciblage fonctionne, mais il suppose une base de joueurs assez large pour
 * que chaque segment reste atteignable. Ce n'est pas encore le cas : une
 * campagne ciblée sur un secteur ne touchait presque personne, et l'annonceur
 * en concluait que le produit ne marche pas (retour du point de test).
 *
 * À `false`, toutes les cartes sont diffusées à tous les joueurs. Les champs
 * de ciblage restent saisissables dans le back-office et leurs valeurs sont
 * conservées : c'est la DIFFUSION qui les ignore, pas la configuration. Le
 * jour où la base le justifie, repasser ce drapeau à `true` suffit — rien à
 * ressaisir côté annonceurs.
 */
export const CIBLAGE_SPONSOR_ACTIF = false;

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
