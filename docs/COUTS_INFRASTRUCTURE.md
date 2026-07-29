# Coûts d'infrastructure — Startup Ludo

> Analyse pour le modèle économique · Tarifs relevés le 28 juillet 2026
> Conversion utilisée : 1 $ ≈ 600 FCFA

L'application repose sur trois services payants :

| Service | Rôle dans l'app | Modèle de facturation |
|---|---|---|
| **Firebase** (Google) | Auth, base de données (Firestore + Realtime DB), stockage photos | Paiement à l'usage (plan Blaze) |
| **OpenAI** (GPT-4o-mini) | Génération d'idées de startup et de valorisations | Paiement au token |
| **Customer.io** | Marketing automation : identification des joueurs, événements, campagnes (push à venir) | Abonnement mensuel au nombre de profils |

---

## 1. Firebase — plan Blaze (paiement à l'usage)

Le niveau gratuit est généreux : un démarrage à ~1 000 joueurs/mois coûte quasiment 0 $, **sauf les SMS**.

| Service | Gratuit jusqu'à | Au-delà |
|---|---|---|
| Auth (email, Google, Apple, invité) | 50 000 utilisateurs actifs/mois | ~0,0055 $/utilisateur actif |
| **Auth par SMS (téléphone)** | 10 SMS/jour | **Payant dès le 1er SMS** : 0,01 $ (USA) → 0,46 $ selon pays. Sénégal ≈ 0,03–0,05 $/SMS |
| Firestore — lectures | 50 000/jour | 0,06 $/100 000 |
| Firestore — écritures | 20 000/jour | 0,18 $/100 000 |
| Firestore — stockage | 1 GiB | 0,26 $/GB/mois |
| Realtime DB — stockage | 1 GB | 5 $/GB |
| Realtime DB — téléchargement | 360 MB/jour (~10 GB/mois) | 1 $/GB |
| Storage (photos de profil) | 5 GB + 100 GB download/mois | ~0,11 $/GB |

**Postes à surveiller :**
- **SMS d'authentification** — seul coût actif dès le premier usage. Chaque joueur orienté vers Google/Apple Sign-In (gratuits) est une économie directe.
- **Download Realtime Database** — le multijoueur en ligne synchronise en continu ; c'est le premier quota qui sautera à fort volume.

---

## 2. OpenAI — GPT-4o-mini

| | Prix |
|---|---|
| Tokens d'entrée | 0,15 $ / million (0,075 $ si cache) |
| Tokens de sortie | 0,60 $ / million |

Une génération (idées ou valorisation) ≈ 1 000 tokens d'entrée + 300 de sortie ≈ **0,0003 $ l'appel** — moins d'un demi-franc CFA. Même 100 000 générations/mois ≈ 33 $. **Poste négligeable** : aucune raison de limiter les features IA pour des raisons de coût.

---

## 3. Customer.io — le plus gros coût fixe

| Palier | Prix |
|---|---|
| Essentials — 5 000 profils | **100 $/mois** (1 M emails/mois inclus) |
| ~10 000 profils | ~150 $/mois |
| ~50 000 profils | ~400 $/mois |

Facturation **au profil stocké** (actif ou non).

> ⚠️ **Attention aux invités** : l'app identifie aussi les comptes anonymes (`is_guest=true`),
> qui créent chacun un profil facturable alors qu'ils sont injoignables (pas d'email).
> Si le mode invité est très utilisé, envisager d'exclure les invités de l'identify.

---

## Estimation mensuelle par échelle

Hypothèses : 2 générations IA/joueur/mois · 20 % d'inscriptions par SMS (2 SMS chacune) · multijoueur modéré.

| Poste | 1 000 joueurs/mois | 10 000 joueurs/mois | 50 000 joueurs/mois |
|---|---|---|---|
| Firebase (hors SMS) | ~0 $ | ~10–30 $ | ~100–250 $ |
| SMS auth | ~15 $ | ~150 $ | ~750 $ |
| OpenAI | ~1 $ | ~7 $ | ~33 $ |
| Customer.io | 100 $ | ~150 $ | ~400 $ |
| **Total** | **~115 $ (≈ 70 000 FCFA)** | **~320–340 $ (≈ 200 000 FCFA)** | **~1 300–1 450 $ (≈ 850 000 FCFA)** |

---

## Enseignements pour le modèle économique

1. **Customer.io domine au démarrage** : 100 $/mois incompressibles. À justifier par la valeur marketing (rétention, campagnes) ; n'identifier que les vrais comptes.
2. **Les SMS deviennent le poste n°1 à l'échelle** : privilégier Google/Apple Sign-In dans le parcours d'inscription.
3. **L'IA est un non-sujet** : < 1 % du total.
4. **Actions recommandées** : mettre une alerte budget dans la console Firebase (Usage and billing) ; suivre le nombre de profils dans Customer.io ; vérifier le tarif SMS exact du Sénégal dans la [grille officielle Firebase](https://firebase.google.com/docs/phone-number-verification/pricing).

---

## Sources

- [Firebase Pricing (officiel)](https://firebase.google.com/pricing)
- [Grille tarifaire SMS Firebase par pays](https://firebase.google.com/docs/phone-number-verification/pricing)
- [SuperTokens — Firebase pricing breakdown](https://supertokens.com/blog/firebase-pricing)
- [Logto — Firebase Auth pricing 2026](https://blog.logto.io/firebase-authentication-pricing)
- [DevTK — GPT-4o mini API pricing](https://devtk.ai/en/models/gpt-4o-mini/)
- [CloudZero — OpenAI API costs 2026](https://www.cloudzero.com/blog/openai-pricing/)
- [Encharge — Customer.io pricing](https://encharge.io/customer-io-pricing/)
- [Sequenzy — Customer.io pricing expliqué](https://www.sequenzy.com/pricing/customerio)
