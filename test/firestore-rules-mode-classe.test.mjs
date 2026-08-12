/**
 * Tests des règles Firestore du MODE CLASSE.
 *
 * POURQUOI CE FICHIER : jusqu'ici les règles du Mode Classe n'avaient jamais été
 * testées, seulement COMPILÉES. Or la compilation ne dit rien de ce que chaque
 * rôle peut réellement faire — c'est précisément là que les écarts « Missing or
 * insufficient permissions » se logeaient, écran après écran.
 *
 * CE QUI EST VÉRIFIÉ, pour chaque rôle (enseignant, directeur, super admin,
 * élève, sponsor) : les cas AUTORISÉS **et** les cas REFUSÉS. Un test qui ne
 * vérifie que les autorisations ne prouve rien — il passerait tout aussi bien
 * sur un `allow read, write: if true`.
 *
 * LA RÈGLE D'OR TESTÉE EXPLICITEMENT : une requête (`list`) n'est acceptée que
 * si son FILTRE garantit à lui seul la lisibilité de chaque résultat possible.
 * Firestore ne filtre jamais après coup, il refuse la requête entière. Les
 * listings sont donc testés en tant que REQUÊTES, pas en lectures document par
 * document — c'est la seule forme qui reproduit le comportement du back-office.
 *
 * Exécution : `node --test test/firestore-rules-mode-classe.test.mjs`
 * (l'émulateur Firestore doit tourner — cf. `emulators:exec` dans le README).
 */

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════
// JEU D'ESSAI — deux établissements, pour prouver l'ÉTANCHÉITÉ entre eux
// ═══════════════════════════════════════════════════════════════════════

const ETAB_A = 'etab_a';
const ETAB_B = 'etab_b';

const CLASSE_A1 = 'classe_a1'; // Établissement A, enseignée par PROF_A.
const CLASSE_A2 = 'classe_a2'; // Établissement A, enseignée par un collègue.
const CLASSE_B1 = 'classe_b1'; // Établissement B — jamais accessible à A.

const SEANCE_A1 = 'seance_a1'; // Séance de PROF_A sur CLASSE_A1, `running`.
const SEANCE_A2 = 'seance_a2'; // Séance du COLLÈGUE sur CLASSE_A2.
const SEANCE_B1 = 'seance_b1'; // Séance de l'établissement B.
const SEANCE_DIR = 'seance_dir'; // Séance du DIRECTEUR-ENSEIGNANT sur CLASSE_A2.

const ELEVE_A1 = 'eleve_a1'; // Élève de CLASSE_A1, rattaché à UID_ELEVE.
const ELEVE_A2 = 'eleve_a2'; // Autre élève de CLASSE_A1 (test d'usurpation).

const UID_PROF_A = 'uid_prof_a';
const UID_PROF_A1_CO = 'uid_prof_a1_co'; // Co-enseignant de CLASSE_A1 (classe PARTAGÉE avec PROF_A).
const UID_PROF_COLLEGUE = 'uid_prof_collegue';
const UID_PROF_B = 'uid_prof_b';
const UID_DIRECTEUR_A = 'uid_directeur_a';
// Double rôle : rôle establishment_admin, MAIS un `classIds` non vide — le
// modèle du « directeur qui enseigne » (cf. buildSchoolClaims : `teacher` reste
// false, seul `classIds` porte ses classes). C'est le persona que les clauses
// `isTeacher()` excluaient à tort.
const UID_DIR_ENSEIGNANT = 'uid_dir_enseignant';
const UID_DIRECTEUR_B = 'uid_directeur_b';
const UID_SUPER = 'uid_super';
const UID_ELEVE = 'uid_eleve';
const UID_ELEVE_NON_RATTACHE = 'uid_eleve_libre';
const UID_SPONSOR = 'uid_sponsor';

/**
 * Claims des rôles du back-office.
 *
 * ⚠️ `admin: true` est porté par TOUS les rôles du back-office, rôles scolaires
 * compris — c'est la cohérence voulue par le projet. Les claims ci-dessous le
 * reproduisent fidèlement : sans lui, on testerait des comptes qui n'existent
 * pas, et on manquerait l'exclusion des rôles scolaires dans `isAdmin()`.
 */
const CLAIMS = {
  [UID_PROF_A]: {
    admin: true,
    teacher: true,
    establishmentId: ETAB_A,
    classIds: [CLASSE_A1],
  },
  [UID_PROF_A1_CO]: {
    admin: true,
    teacher: true,
    establishmentId: ETAB_A,
    classIds: [CLASSE_A1],
  },
  [UID_PROF_COLLEGUE]: {
    admin: true,
    teacher: true,
    establishmentId: ETAB_A,
    classIds: [CLASSE_A2],
  },
  [UID_PROF_B]: {
    admin: true,
    teacher: true,
    establishmentId: ETAB_B,
    classIds: [CLASSE_B1],
  },
  [UID_DIRECTEUR_A]: { admin: true, establishment_admin: true, establishmentId: ETAB_A },
  [UID_DIR_ENSEIGNANT]: {
    admin: true,
    establishment_admin: true,
    establishmentId: ETAB_A,
    classIds: [CLASSE_A2],
  },
  [UID_DIRECTEUR_B]: { admin: true, establishment_admin: true, establishmentId: ETAB_B },
  [UID_SUPER]: { admin: true, super_admin: true },
  // Un élève est un JOUEUR : AUCUN claim scolaire. C'est l'hypothèse centrale
  // de tout le modèle de sécurité, elle est donc reproduite telle quelle.
  [UID_ELEVE]: {},
  [UID_ELEVE_NON_RATTACHE]: {},
  // Le sponsor porte `admin: true` mais n'a rien à voir avec le Mode Classe.
  [UID_SPONSOR]: { admin: true, sponsor: true, editionIds: ['ed1'] },
};

let testEnv;

/** Firestore authentifié en tant que `uid`, avec ses claims réels. */
function db(uid) {
  return testEnv.authenticatedContext(uid, CLAIMS[uid]).firestore();
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-mode-classe',
    firestore: {
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

/**
 * Réinstalle le jeu d'essai avant chaque scénario, règles DÉSACTIVÉES.
 *
 * `withSecurityRulesDisabled` est indispensable : les documents de départ
 * (le miroir `classLinks`, notamment) sont écrits par l'Admin SDK en production
 * et par personne d'autre — aucun rôle testé ne peut les créer.
 */
async function reinitialiser() {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();

    await setDoc(doc(d, 'establishments', ETAB_A), {
      name: 'Lycée A',
      isActive: true,
      licenseValidUntil: Date.now() + 86_400_000,
      maxTeachers: 10,
      maxLearners: 300,
    });
    await setDoc(doc(d, 'establishments', ETAB_B), { name: 'Lycée B', isActive: true });

    await setDoc(doc(d, 'classes', CLASSE_A1), {
      establishmentId: ETAB_A,
      name: 'Terminale 1',
      level: 'lycee',
      learnerCount: 2,
      joinCode: null,
      joinCodeExpiresAt: null,
    });
    await setDoc(doc(d, 'classes', CLASSE_A2), {
      establishmentId: ETAB_A,
      name: 'Terminale 2',
      level: 'lycee',
      learnerCount: 0,
    });
    await setDoc(doc(d, 'classes', CLASSE_B1), {
      establishmentId: ETAB_B,
      name: 'Seconde B',
      level: 'lycee',
      learnerCount: 0,
    });

    await setDoc(doc(d, 'classes', CLASSE_A1, 'learners', ELEVE_A1), {
      firstName: 'Awa',
      lastName: 'Diop',
      linkedUid: UID_ELEVE,
      isActive: true,
    });
    await setDoc(doc(d, 'classes', CLASSE_A1, 'learners', ELEVE_A2), {
      firstName: 'Moussa',
      lastName: 'Fall',
      linkedUid: null,
      isActive: true,
    });

    await setDoc(doc(d, 'classSessions', SEANCE_A1), {
      establishmentId: ETAB_A,
      classId: CLASSE_A1,
      teacherId: UID_PROF_A,
      status: 'running',
      title: 'Séance test',
    });
    await setDoc(doc(d, 'classSessions', SEANCE_A2), {
      establishmentId: ETAB_A,
      classId: CLASSE_A2,
      teacherId: UID_PROF_COLLEGUE,
      status: 'scheduled',
      title: 'Séance du collègue',
    });
    await setDoc(doc(d, 'classSessions', SEANCE_DIR), {
      establishmentId: ETAB_A,
      classId: CLASSE_A2,
      teacherId: UID_DIR_ENSEIGNANT,
      status: 'scheduled',
      title: 'Séance du directeur-enseignant',
    });
    await setDoc(doc(d, 'classSessions', SEANCE_B1), {
      establishmentId: ETAB_B,
      classId: CLASSE_B1,
      teacherId: UID_PROF_B,
      status: 'running',
      title: 'Séance B',
    });

    await setDoc(doc(d, 'classSessions', SEANCE_A1, 'content', 'generated'), {
      quizzes: [{ id: 'q1', question: '2+2 ?', correctAnswer: '4' }],
    });
    await setDoc(doc(d, 'classSessions', SEANCE_A1, 'sourceDocs', 'src1'), {
      name: 'cours.pdf',
      charCount: 42,
    });

    // Miroir de rattachement — écrit UNIQUEMENT par l'Admin SDK en production.
    await setDoc(doc(d, 'classLinks', UID_ELEVE), {
      classId: CLASSE_A1,
      learnerId: ELEVE_A1,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ÉTABLISSEMENTS
// ═══════════════════════════════════════════════════════════════════════

describe('establishments', () => {
  before(reinitialiser);

  it('le directeur lit SON établissement', async () => {
    await assertSucceeds(getDoc(doc(db(UID_DIRECTEUR_A), 'establishments', ETAB_A)));
  });

  it("l'enseignant lit son établissement (validité de la licence avant séance)", async () => {
    await assertSucceeds(getDoc(doc(db(UID_PROF_A), 'establishments', ETAB_A)));
  });

  it("le directeur ne lit PAS l'établissement d'un concurrent", async () => {
    await assertFails(getDoc(doc(db(UID_DIRECTEUR_A), 'establishments', ETAB_B)));
  });

  it("le directeur modifie l'identité de son établissement", async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_DIRECTEUR_A), 'establishments', ETAB_A), { name: 'Lycée A bis' })
    );
  });

  it('le directeur ne PROLONGE PAS sa propre licence', async () => {
    await assertFails(
      updateDoc(doc(db(UID_DIRECTEUR_A), 'establishments', ETAB_A), {
        licenseValidUntil: Date.now() + 10 * 365 * 86_400_000,
      })
    );
  });

  it("le directeur ne relève PAS ses propres quotas", async () => {
    await assertFails(
      updateDoc(doc(db(UID_DIRECTEUR_A), 'establishments', ETAB_A), { maxLearners: 99_999 })
    );
  });

  it("l'enseignant n'écrit PAS l'établissement", async () => {
    await assertFails(
      updateDoc(doc(db(UID_PROF_A), 'establishments', ETAB_A), { name: 'Piraté' })
    );
  });

  it('le sponsor ne lit AUCUN établissement', async () => {
    await assertFails(getDoc(doc(db(UID_SPONSOR), 'establishments', ETAB_A)));
  });

  it("l'élève ne lit AUCUN établissement", async () => {
    await assertFails(getDoc(doc(db(UID_ELEVE), 'establishments', ETAB_A)));
  });

  it('le super admin liste les établissements (sélecteur du back-office)', async () => {
    await assertSucceeds(getDocs(collection(db(UID_SUPER), 'establishments')));
  });

  it('le directeur ne LISTE PAS la collection (il lit son seul document)', async () => {
    await assertFails(getDocs(collection(db(UID_DIRECTEUR_A), 'establishments')));
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CLASSES — dont les LISTINGS, cœur des refus en cascade
// ═══════════════════════════════════════════════════════════════════════

describe('classes', () => {
  before(reinitialiser);

  it("l'enseignant lit SA classe par son id", async () => {
    await assertSucceeds(getDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1)));
  });

  it("l'enseignant ne lit PAS la classe d'un collègue du même établissement", async () => {
    await assertFails(getDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A2)));
  });

  it("l'enseignant ne lit PAS la classe d'un autre établissement", async () => {
    await assertFails(getDoc(doc(db(UID_PROF_A), 'classes', CLASSE_B1)));
  });

  it("l'enseignant ne LISTE PAS la collection classes", async () => {
    await assertFails(getDocs(collection(db(UID_PROF_A), 'classes')));
  });

  it("l'enseignant ne peut pas énumérer les classes par joinCode (listing refusé)", async () => {
    await assertFails(
      getDocs(query(collection(db(UID_PROF_A), 'classes'), where('joinCode', '==', 'ABC234')))
    );
  });

  it('le directeur LISTE les classes de son établissement (requête filtrée)', async () => {
    await assertSucceeds(
      getDocs(
        query(collection(db(UID_DIRECTEUR_A), 'classes'), where('establishmentId', '==', ETAB_A))
      )
    );
  });

  it("le directeur ne liste PAS les classes d'un autre établissement", async () => {
    await assertFails(
      getDocs(
        query(collection(db(UID_DIRECTEUR_A), 'classes'), where('establishmentId', '==', ETAB_B))
      )
    );
  });

  it('le directeur ne liste PAS la collection sans filtre', async () => {
    await assertFails(getDocs(collection(db(UID_DIRECTEUR_A), 'classes')));
  });

  it('le directeur crée une classe dans SON établissement', async () => {
    await assertSucceeds(
      setDoc(doc(db(UID_DIRECTEUR_A), 'classes', 'nouvelle_a'), {
        establishmentId: ETAB_A,
        name: 'Première A',
        level: 'lycee',
        learnerCount: 0,
      })
    );
  });

  it("le directeur ne crée PAS de classe dans un autre établissement", async () => {
    await assertFails(
      setDoc(doc(db(UID_DIRECTEUR_A), 'classes', 'nouvelle_b'), {
        establishmentId: ETAB_B,
        name: 'Squattée',
        level: 'lycee',
      })
    );
  });

  it("l'enseignant OUVRE la fenêtre de rattachement de sa classe", async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1), {
        joinCode: 'ABC234',
        joinCodeExpiresAt: Date.now() + 900_000,
        updatedAt: Date.now(),
      })
    );
  });

  it("l'enseignant FERME la fenêtre de rattachement de sa classe", async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1), {
        joinCode: null,
        joinCodeExpiresAt: null,
        updatedAt: Date.now(),
      })
    );
  });

  it("l'enseignant met à jour learnerCount après un mouvement d'élève", async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1), {
        learnerCount: 3,
        updatedAt: Date.now(),
      })
    );
  });

  it("l'enseignant ne RENOMME PAS sa classe (geste de la direction)", async () => {
    await assertFails(
      updateDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1), { name: 'Ma classe à moi' })
    );
  });

  it("l'enseignant ne DÉPLACE PAS sa classe vers un autre établissement", async () => {
    await assertFails(
      updateDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1), { establishmentId: ETAB_B })
    );
  });

  it("l'enseignant n'ouvre PAS de fenêtre sur la classe d'un collègue", async () => {
    await assertFails(
      updateDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A2), {
        joinCode: 'XYZ789',
        joinCodeExpiresAt: Date.now() + 900_000,
      })
    );
  });

  it("l'enseignant ne SUPPRIME PAS sa classe", async () => {
    await assertFails(deleteDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1)));
  });

  it("l'élève ne lit AUCUNE classe, même en devinant son id", async () => {
    await assertFails(getDoc(doc(db(UID_ELEVE), 'classes', CLASSE_A1)));
  });

  it('le sponsor ne lit AUCUNE classe', async () => {
    await assertFails(getDoc(doc(db(UID_SPONSOR), 'classes', CLASSE_A1)));
  });
});

// ═══════════════════════════════════════════════════════════════════════
// ÉLÈVES — la liste nominative de mineurs, donnée la plus sensible
// ═══════════════════════════════════════════════════════════════════════

describe('classes/{id}/learners', () => {
  before(reinitialiser);

  it("l'enseignant liste les élèves de SA classe", async () => {
    await assertSucceeds(getDocs(collection(db(UID_PROF_A), 'classes', CLASSE_A1, 'learners')));
  });

  it("l'enseignant ajoute un élève à SA classe", async () => {
    await assertSucceeds(
      setDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1, 'learners', 'nouveau'), {
        firstName: 'Fatou',
        lastName: 'Sow',
        isActive: true,
        linkedUid: null,
      })
    );
  });

  it("l'enseignant RETIRE un élève (isActive: false, jamais une suppression)", async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1, 'learners', ELEVE_A2), {
        isActive: false,
        linkedUid: null,
      })
    );
  });

  it("l'enseignant ne lit PAS les élèves de la classe d'un collègue", async () => {
    await assertFails(getDocs(collection(db(UID_PROF_A), 'classes', CLASSE_A2, 'learners')));
  });

  it("l'enseignant ne lit PAS les élèves d'un autre établissement", async () => {
    await assertFails(getDocs(collection(db(UID_PROF_A), 'classes', CLASSE_B1, 'learners')));
  });

  it('le directeur lit les élèves des classes de son établissement', async () => {
    await assertSucceeds(
      getDocs(collection(db(UID_DIRECTEUR_A), 'classes', CLASSE_A1, 'learners'))
    );
  });

  it("le directeur ne lit PAS les élèves d'un autre établissement", async () => {
    await assertFails(getDocs(collection(db(UID_DIRECTEUR_B), 'classes', CLASSE_A1, 'learners')));
  });

  it("l'élève rattaché ne lit PAS la liste de sa propre classe", async () => {
    await assertFails(getDocs(collection(db(UID_ELEVE), 'classes', CLASSE_A1, 'learners')));
  });

  it("l'élève ne lit PAS sa propre fiche en direct (elle passe par l'API)", async () => {
    await assertFails(getDoc(doc(db(UID_ELEVE), 'classes', CLASSE_A1, 'learners', ELEVE_A1)));
  });

  it("l'élève ne s'auto-rattache PAS en écrivant linkedUid", async () => {
    await assertFails(
      updateDoc(doc(db(UID_ELEVE), 'classes', CLASSE_A1, 'learners', ELEVE_A2), {
        linkedUid: UID_ELEVE,
      })
    );
  });

  it('le sponsor ne lit AUCUNE liste d’élèves', async () => {
    await assertFails(getDocs(collection(db(UID_SPONSOR), 'classes', CLASSE_A1, 'learners')));
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SÉANCES — dont les LISTINGS par teacherId / establishmentId / classId
// ═══════════════════════════════════════════════════════════════════════

describe('classSessions', () => {
  before(reinitialiser);

  it("l'enseignant LISTE ses séances par teacherId (écran /seances)", async () => {
    await assertSucceeds(
      getDocs(
        query(collection(db(UID_PROF_A), 'classSessions'), where('teacherId', '==', UID_PROF_A))
      )
    );
  });

  it("l'enseignant LISTE les séances d'une de ses classes (fiche de classe)", async () => {
    await assertSucceeds(
      getDocs(
        query(collection(db(UID_PROF_A), 'classSessions'), where('classId', '==', CLASSE_A1))
      )
    );
  });

  it("l'enseignant ne liste PAS les séances d'une classe qui n'est pas la sienne", async () => {
    await assertFails(
      getDocs(
        query(collection(db(UID_PROF_A), 'classSessions'), where('classId', '==', CLASSE_A2))
      )
    );
  });

  it("l'enseignant ne liste PAS les séances d'un collègue", async () => {
    await assertFails(
      getDocs(
        query(
          collection(db(UID_PROF_A), 'classSessions'),
          where('teacherId', '==', UID_PROF_COLLEGUE)
        )
      )
    );
  });

  it("l'enseignant ne liste PAS toute la collection", async () => {
    await assertFails(getDocs(collection(db(UID_PROF_A), 'classSessions')));
  });

  it('le directeur LISTE les séances de son établissement (requête filtrée)', async () => {
    await assertSucceeds(
      getDocs(
        query(
          collection(db(UID_DIRECTEUR_A), 'classSessions'),
          where('establishmentId', '==', ETAB_A)
        )
      )
    );
  });

  it("le directeur ne liste PAS les séances d'un autre établissement", async () => {
    await assertFails(
      getDocs(
        query(
          collection(db(UID_DIRECTEUR_A), 'classSessions'),
          where('establishmentId', '==', ETAB_B)
        )
      )
    );
  });

  it("l'enseignant CRÉE une séance sur sa classe, à son nom", async () => {
    await assertSucceeds(
      setDoc(doc(db(UID_PROF_A), 'classSessions', 'seance_neuve'), {
        establishmentId: ETAB_A,
        classId: CLASSE_A1,
        teacherId: UID_PROF_A,
        status: 'scheduled',
        title: 'Nouvelle',
      })
    );
  });

  it("l'enseignant ne crée PAS de séance sur la classe d'un collègue", async () => {
    await assertFails(
      setDoc(doc(db(UID_PROF_A), 'classSessions', 'seance_volee'), {
        establishmentId: ETAB_A,
        classId: CLASSE_A2,
        teacherId: UID_PROF_A,
        status: 'scheduled',
      })
    );
  });

  it("l'enseignant ne crée PAS de séance au nom d'un collègue", async () => {
    await assertFails(
      setDoc(doc(db(UID_PROF_A), 'classSessions', 'seance_usurpee'), {
        establishmentId: ETAB_A,
        classId: CLASSE_A1,
        teacherId: UID_PROF_COLLEGUE,
        status: 'scheduled',
      })
    );
  });

  it("l'enseignant OUVRE sa séance (scheduled → running)", async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_A1), {
        status: 'running',
        startedAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
  });

  it("l'enseignant CLÔTURE sa séance", async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_A1), {
        status: 'ended',
        endedAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
  });

  it("l'enseignant ne s'APPROPRIE PAS la séance d'un collègue", async () => {
    await assertFails(
      updateDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_A2), { teacherId: UID_PROF_A })
    );
  });

  it("le directeur ne PILOTE PAS une séance (lecture seule)", async () => {
    await assertFails(
      updateDoc(doc(db(UID_DIRECTEUR_A), 'classSessions', SEANCE_A1), { status: 'ended' })
    );
  });

  it("l'élève rattaché LIT les séances `running` de sa classe", async () => {
    await assertSucceeds(
      getDocs(
        query(
          collection(db(UID_ELEVE), 'classSessions'),
          where('classId', '==', CLASSE_A1),
          where('status', '==', 'running')
        )
      )
    );
  });

  it("l'élève ne voit PAS les séances non lancées de sa classe", async () => {
    await assertFails(
      getDocs(
        query(
          collection(db(UID_ELEVE), 'classSessions'),
          where('classId', '==', CLASSE_A1),
          where('status', '==', 'scheduled')
        )
      )
    );
  });

  it("l'élève ne voit PAS les séances d'une autre classe", async () => {
    await assertFails(
      getDocs(
        query(
          collection(db(UID_ELEVE), 'classSessions'),
          where('classId', '==', CLASSE_B1),
          where('status', '==', 'running')
        )
      )
    );
  });

  it("un élève NON rattaché ne voit aucune séance", async () => {
    await assertFails(
      getDocs(
        query(
          collection(db(UID_ELEVE_NON_RATTACHE), 'classSessions'),
          where('classId', '==', CLASSE_A1),
          where('status', '==', 'running')
        )
      )
    );
  });

  it("l'élève n'écrit PAS une séance", async () => {
    await assertFails(
      updateDoc(doc(db(UID_ELEVE), 'classSessions', SEANCE_A1), { status: 'ended' })
    );
  });

  it('le sponsor ne lit AUCUNE séance', async () => {
    await assertFails(getDoc(doc(db(UID_SPONSOR), 'classSessions', SEANCE_A1)));
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CONTENU ET COURS SOURCE — dont le WIZARD, séance pas encore créée
// ═══════════════════════════════════════════════════════════════════════

describe('classSessions/{id}/content et /sourceDocs', () => {
  before(reinitialiser);

  it("l'enseignant lit le contenu de SA séance", async () => {
    await assertSucceeds(
      getDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_A1, 'content', 'generated'))
    );
  });

  it("l'enseignant corrige le contenu de SA séance", async () => {
    await assertSucceeds(
      setDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_A1, 'content', 'generated'), {
        quizzes: [],
        reviewedAt: Date.now(),
      })
    );
  });

  it("l'enseignant dépose un cours sur SA séance", async () => {
    await assertSucceeds(
      setDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_A1, 'sourceDocs', 'src2'), {
        name: 'chapitre2.pdf',
        charCount: 100,
      })
    );
  });

  it("WIZARD — l'enseignant écrit sourceDocs AVANT que la séance existe", async () => {
    // Cas normal du wizard : l'id est tiré au montage, les cours et le contenu
    // sont écrits d'abord, la séance n'est créée qu'à la validation finale.
    await assertSucceeds(
      setDoc(doc(db(UID_PROF_A), 'classSessions', 'sess_brouillon', 'sourceDocs', 'src1'), {
        name: 'brouillon.pdf',
        charCount: 10,
      })
    );
  });

  it('WIZARD — écriture des chunks du cours (sous-sous-collection)', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(UID_PROF_A), 'classSessions', 'sess_brouillon', 'sourceDocs', 'src1', 'chunks', '0'),
        { i: 0, content: 'texte du cours' }
      )
    );
  });

  it("WIZARD — l'enseignant écrit le contenu généré AVANT que la séance existe", async () => {
    await assertSucceeds(
      setDoc(doc(db(UID_PROF_A), 'classSessions', 'sess_brouillon', 'content', 'generated'), {
        quizzes: [{ id: 'q1', question: 'Test ?' }],
        generatedAt: Date.now(),
      })
    );
  });

  it("WIZARD — l'enseignant relit le contenu qu'il vient de générer", async () => {
    await assertSucceeds(
      getDoc(doc(db(UID_PROF_A), 'classSessions', 'sess_brouillon', 'content', 'generated'))
    );
  });

  it("l'enseignant ne lit PAS le contenu de la séance d'un collègue", async () => {
    await assertFails(
      getDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_A2, 'content', 'generated'))
    );
  });

  it("l'enseignant n'écrit PAS le contenu de la séance d'un collègue", async () => {
    await assertFails(
      setDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_A2, 'content', 'generated'), {
        quizzes: [],
      })
    );
  });

  it("l'enseignant ne lit PAS les cours d'un autre établissement", async () => {
    await assertFails(
      getDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_B1, 'sourceDocs', 'src1'))
    );
  });

  it("l'élève rattaché LIT le contenu d'une séance `running` de sa classe", async () => {
    await assertSucceeds(
      getDoc(doc(db(UID_ELEVE), 'classSessions', SEANCE_A1, 'content', 'generated'))
    );
  });

  it("l'élève n'ÉCRIT PAS le contenu de la séance", async () => {
    await assertFails(
      setDoc(doc(db(UID_ELEVE), 'classSessions', SEANCE_A1, 'content', 'generated'), {
        quizzes: [],
      })
    );
  });

  it("l'élève ne lit PAS les COURS SOURCE du professeur", async () => {
    await assertFails(
      getDoc(doc(db(UID_ELEVE), 'classSessions', SEANCE_A1, 'sourceDocs', 'src1'))
    );
  });

  it("un élève NON rattaché ne lit pas le contenu", async () => {
    await assertFails(
      getDoc(doc(db(UID_ELEVE_NON_RATTACHE), 'classSessions', SEANCE_A1, 'content', 'generated'))
    );
  });

  it('le directeur lit le contenu des séances de son établissement', async () => {
    await assertSucceeds(
      getDoc(doc(db(UID_DIRECTEUR_A), 'classSessions', SEANCE_A1, 'content', 'generated'))
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════
// PARTICIPANTS — progression de l'élève en séance
// ═══════════════════════════════════════════════════════════════════════

describe('classSessions/{id}/participants', () => {
  before(reinitialiser);

  it("l'élève écrit SA propre ligne de participation", async () => {
    await assertSucceeds(
      setDoc(doc(db(UID_ELEVE), 'classSessions', SEANCE_A1, 'participants', ELEVE_A1), {
        score: 10,
        answers: [],
      })
    );
  });

  it("l'élève ne peut PAS écrire la ligne d'un camarade", async () => {
    await assertFails(
      setDoc(doc(db(UID_ELEVE), 'classSessions', SEANCE_A1, 'participants', ELEVE_A2), {
        score: 999,
      })
    );
  });

  it("l'élève ne participe PAS à une séance d'une autre classe", async () => {
    await assertFails(
      setDoc(doc(db(UID_ELEVE), 'classSessions', SEANCE_B1, 'participants', ELEVE_A1), {
        score: 10,
      })
    );
  });

  it("un élève NON rattaché n'écrit aucune participation", async () => {
    await assertFails(
      setDoc(doc(db(UID_ELEVE_NON_RATTACHE), 'classSessions', SEANCE_A1, 'participants', ELEVE_A1), {
        score: 10,
      })
    );
  });

  it("l'enseignant LIT les participants de SA séance (suivi en direct)", async () => {
    await assertSucceeds(
      getDocs(collection(db(UID_PROF_A), 'classSessions', SEANCE_A1, 'participants'))
    );
  });

  it("l'enseignant ne lit PAS les participants de la séance d'un collègue", async () => {
    await assertFails(
      getDocs(collection(db(UID_PROF_A), 'classSessions', SEANCE_A2, 'participants'))
    );
  });

  it('le directeur lit les participants des séances de son établissement', async () => {
    await assertSucceeds(
      getDocs(collection(db(UID_DIRECTEUR_A), 'classSessions', SEANCE_A1, 'participants'))
    );
  });

  it("personne ne SUPPRIME une trace de participation, pas même l'enseignant", async () => {
    await assertFails(
      deleteDoc(doc(db(UID_PROF_A), 'classSessions', SEANCE_A1, 'participants', ELEVE_A1))
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CLASSLINKS — le miroir qui fonde tous les droits de l'élève
// ═══════════════════════════════════════════════════════════════════════

describe('classLinks', () => {
  before(reinitialiser);

  it("l'élève lit SON miroir de rattachement", async () => {
    await assertSucceeds(getDoc(doc(db(UID_ELEVE), 'classLinks', UID_ELEVE)));
  });

  it("l'élève ne lit PAS le miroir d'un autre", async () => {
    await assertFails(getDoc(doc(db(UID_ELEVE_NON_RATTACHE), 'classLinks', UID_ELEVE)));
  });

  it("PERSONNE ne s'auto-délivre un rattachement — c'est tout le modèle", async () => {
    await assertFails(
      setDoc(doc(db(UID_ELEVE_NON_RATTACHE), 'classLinks', UID_ELEVE_NON_RATTACHE), {
        classId: CLASSE_A1,
        learnerId: ELEVE_A2,
      })
    );
  });

  it("l'élève ne réécrit PAS son propre miroir pour changer de classe", async () => {
    await assertFails(
      updateDoc(doc(db(UID_ELEVE), 'classLinks', UID_ELEVE), { classId: CLASSE_B1 })
    );
  });

  it("l'enseignant lui-même n'écrit pas les miroirs (Admin SDK uniquement)", async () => {
    await assertFails(
      setDoc(doc(db(UID_PROF_A), 'classLinks', UID_ELEVE), { classId: CLASSE_A1 })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════
// ISOLATION DES RÔLES SCOLAIRES — isAdmin() les exclut
// ═══════════════════════════════════════════════════════════════════════

describe("isAdmin() exclut les rôles scolaires", () => {
  before(reinitialiser);

  it("l'enseignant LIT les éditions (contenu du jeu, public) — voie du wizard", async () => {
    // Vérifie que le wizard « séance sur une édition » n'est pas cassé par
    // l'exclusion des rôles scolaires dans isAdmin() : la lecture est publique.
    await assertSucceeds(getDocs(collection(db(UID_PROF_A), 'editions')));
  });

  it("l'enseignant n'ÉCRIT PAS une édition (isAdmin l'exclut)", async () => {
    await assertFails(
      setDoc(doc(db(UID_PROF_A), 'editions', 'ed1'), { name: 'Piratée' })
    );
  });

  it("le directeur n'ÉCRIT PAS le contenu du jeu (gameData)", async () => {
    await assertFails(setDoc(doc(db(UID_DIRECTEUR_A), 'gameData', 'progression'), { x: 1 }));
  });

  it("l'enseignant ne lit PAS les leads du site vitrine (preorders)", async () => {
    await assertFails(getDocs(collection(db(UID_PROF_A), 'preorders')));
  });

  it("l'enseignant ne lit PAS les documents source des programmes partenaires", async () => {
    await assertFails(
      getDoc(doc(db(UID_PROF_A), 'programs', 'prog1', 'sourceDocs', 'doc1'))
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SUPER ADMIN — accès de support, sur tout le périmètre
// ═══════════════════════════════════════════════════════════════════════

describe('super admin', () => {
  before(reinitialiser);

  it('lit toute classe', async () => {
    await assertSucceeds(getDoc(doc(db(UID_SUPER), 'classes', CLASSE_B1)));
  });

  it('lit les élèves de toute classe', async () => {
    await assertSucceeds(getDocs(collection(db(UID_SUPER), 'classes', CLASSE_A1, 'learners')));
  });

  it('liste toutes les classes sans filtre (écran /etablissements)', async () => {
    await assertSucceeds(getDocs(collection(db(UID_SUPER), 'classes')));
  });

  it('lit toute séance', async () => {
    await assertSucceeds(getDoc(doc(db(UID_SUPER), 'classSessions', SEANCE_B1)));
  });

  it('crée un établissement (geste commercial)', async () => {
    await assertSucceeds(
      setDoc(doc(db(UID_SUPER), 'establishments', 'etab_neuf'), { name: 'Nouveau client' })
    );
  });

  it("prolonge une licence (ce que le directeur ne peut pas faire)", async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_SUPER), 'establishments', ETAB_A), {
        licenseValidUntil: Date.now() + 31_536_000_000,
      })
    );
  });
});

// Garde-fou : un jeu d'essai vide ferait passer des tests pour de mauvaises
// raisons (`assertFails` réussit aussi quand il n'y a rien à lire).
describe('intégrité du jeu d’essai', () => {
  before(reinitialiser);

  it('les documents de départ existent bien', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const d = ctx.firestore();
      for (const ref of [
        doc(d, 'classes', CLASSE_A1),
        doc(d, 'classSessions', SEANCE_A1),
        doc(d, 'classLinks', UID_ELEVE),
        doc(d, 'classes', CLASSE_A1, 'learners', ELEVE_A1),
        doc(d, 'classSessions', SEANCE_A1, 'content', 'generated'),
      ]) {
        const snap = await getDoc(ref);
        assert.equal(snap.exists(), true, `document manquant : ${ref.path}`);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// AUDIT #2 — CUMULS, CLASSE PARTAGÉE, DOUBLE RÔLE
//
// Trois écarts découverts à l'usage après le premier audit :
//   1. le DIRECTEUR ne pouvait exécuter AUCUNE requête `classSessions`
//      filtrée par classe (recalcul des cumuls, historique de la fiche
//      élève) : sa seule clause portait sur `establishmentId`, que le
//      filtre ne prouve pas — refus EN BLOC ;
//   2. `seanceDeMaClasse` était « propriétaire seulement » : sur une classe
//      PARTAGÉE, participants/contenu/cours des séances d'un collègue
//      étaient fermés au co-enseignant — le recalcul échouait à moitié ;
//   3. les écritures `classSessions` exigeaient `isTeacher()`, or le
//      directeur qui enseigne n'a PAS le claim `teacher` (buildSchoolClaims
//      ne pose que `classIds`) : il ne pouvait ni créer ni piloter SA séance.
// ═══════════════════════════════════════════════════════════════════════

describe('audit #2 — cumuls, classe partagée, double rôle', () => {
  before(reinitialiser);

  // ── 1. Requêtes du directeur filtrées par CLASSE ────────────────────

  it('le directeur LISTE les séances par CLASSE (recalcul des cumuls, fiche élève)', async () => {
    await assertSucceeds(
      getDocs(
        query(collection(db(UID_DIRECTEUR_A), 'classSessions'), where('classId', '==', CLASSE_A1))
      )
    );
  });

  it("le directeur ne liste PAS par une classe d'un AUTRE établissement", async () => {
    await assertFails(
      getDocs(
        query(collection(db(UID_DIRECTEUR_A), 'classSessions'), where('classId', '==', CLASSE_B1))
      )
    );
  });

  // ── 2. Classe partagée : les séances des collègues ──────────────────

  it('le CO-ENSEIGNANT lit les participants de la séance d’un collègue (classe partagée)', async () => {
    await assertSucceeds(
      getDocs(collection(db(UID_PROF_A1_CO), 'classSessions', SEANCE_A1, 'participants'))
    );
  });

  it('le CO-ENSEIGNANT lit le contenu généré de cette séance', async () => {
    await assertSucceeds(
      getDoc(doc(db(UID_PROF_A1_CO), 'classSessions', SEANCE_A1, 'content', 'generated'))
    );
  });

  it("un enseignant SANS cette classe ne lit toujours PAS ces participants", async () => {
    await assertFails(
      getDocs(collection(db(UID_PROF_COLLEGUE), 'classSessions', SEANCE_A1, 'participants'))
    );
  });

  // ── 3. Écriture du cumul sur la fiche élève ─────────────────────────

  it("l'enseignant écrit le CUMUL d'un élève de sa classe (clôture de séance)", async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_PROF_A), 'classes', CLASSE_A1, 'learners', ELEVE_A1), {
        masteryByCategory: { marketing: { correct: 2, total: 3 } },
        totalSessions: 1,
        lastPlayedAt: Date.now(),
        countedSessionIds: [SEANCE_A1],
        updatedAt: Date.now(),
      })
    );
  });

  it('le directeur écrit le cumul (bouton « Recalculer » de la fiche de classe)', async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_DIRECTEUR_A), 'classes', CLASSE_A1, 'learners', ELEVE_A1), {
        masteryByCategory: {},
        totalSessions: 0,
        lastPlayedAt: null,
        countedSessionIds: [],
        updatedAt: Date.now(),
      })
    );
  });

  it("un enseignant d'une AUTRE classe n'écrit pas de cumul", async () => {
    await assertFails(
      updateDoc(doc(db(UID_PROF_COLLEGUE), 'classes', CLASSE_A1, 'learners', ELEVE_A1), {
        totalSessions: 99,
      })
    );
  });

  it("l'élève ne gonfle PAS ses propres compteurs", async () => {
    await assertFails(
      updateDoc(doc(db(UID_ELEVE), 'classes', CLASSE_A1, 'learners', ELEVE_A1), {
        masteryByCategory: { marketing: { correct: 100, total: 100 } },
      })
    );
  });

  // ── 4. Double rôle : le directeur qui enseigne ──────────────────────

  it('le DIRECTEUR-ENSEIGNANT crée une séance sur SA classe, à son nom', async () => {
    await assertSucceeds(
      setDoc(doc(db(UID_DIR_ENSEIGNANT), 'classSessions', 'seance_dir_new'), {
        establishmentId: ETAB_A,
        classId: CLASSE_A2,
        teacherId: UID_DIR_ENSEIGNANT,
        status: 'scheduled',
        title: 'Séance créée par le directeur',
      })
    );
  });

  it('le DIRECTEUR-ENSEIGNANT pilote SA séance (scheduled → running)', async () => {
    await assertSucceeds(
      updateDoc(doc(db(UID_DIR_ENSEIGNANT), 'classSessions', SEANCE_DIR), {
        status: 'running',
        startedAt: Date.now(),
      })
    );
  });

  it("le directeur-enseignant ne crée PAS de séance sur une classe qu'il n'enseigne pas", async () => {
    await assertFails(
      setDoc(doc(db(UID_DIR_ENSEIGNANT), 'classSessions', 'seance_dir_hors_classe'), {
        establishmentId: ETAB_A,
        classId: CLASSE_A1,
        teacherId: UID_DIR_ENSEIGNANT,
        status: 'scheduled',
      })
    );
  });

  it('le directeur SANS classe ne crée toujours PAS de séance', async () => {
    await assertFails(
      setDoc(doc(db(UID_DIRECTEUR_A), 'classSessions', 'seance_dir_sans_classe'), {
        establishmentId: ETAB_A,
        classId: CLASSE_A1,
        teacherId: UID_DIRECTEUR_A,
        status: 'scheduled',
      })
    );
  });

  it("le directeur ne pilote toujours PAS la séance d'un enseignant", async () => {
    await assertFails(
      updateDoc(doc(db(UID_DIRECTEUR_A), 'classSessions', SEANCE_A1), { status: 'ended' })
    );
  });
});
