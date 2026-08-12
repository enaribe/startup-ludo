/**
 * useClassStore — la classe de l'élève, telle qu'elle vit sur son profil.
 *
 * ═══ POURQUOI CE STORE EXISTE ═══
 *
 * Le rattachement est PERMANENT, mais son nom lisible ne l'est pas : les règles
 * Firestore ferment `classes/{cid}` à l'élève — c'est délibéré, la collection
 * porte le périmètre de l'établissement. Le seul moment où « Terminale S2 »
 * transite est la réponse de `POST /api/class/link`, à la seconde du
 * rattachement. On le persiste donc ici, une fois, pour tout le reste de
 * l'année : sans cela l'accueil afficherait « votre classe » sans jamais
 * pouvoir la nommer.
 *
 * La SOURCE DE VÉRITÉ du rattachement reste `classLinks/{uid}` en Firestore —
 * un document que l'élève ne peut pas écrire. Ce store n'est qu'un CACHE
 * d'affichage : il ne donne aucun droit et n'est jamais lu par une règle. S'il
 * était vidé (réinstallation), le rattachement resterait valide et la classe
 * réapparaîtrait, simplement sans son nom.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ClassState {
  /** Noms de classe connus, par `classId`. Cache d'affichage uniquement. */
  classNames: Record<string, string>;
  /** Nom affiché de l'élève dans sa classe (« Fatou D. »), pour le suivi du prof. */
  learnerDisplayName: string | null;
  isHydrated: boolean;
}

interface ClassActions {
  /** Mémorise le résultat d'un rattachement réussi. */
  rememberLink: (classId: string, className: string, displayName: string) => void;
  /** Nom connu d'une classe, ou chaîne vide si jamais rencontrée. */
  getClassName: (classId: string) => string;
  setHydrated: () => void;
  /** Vide le cache — à la déconnexion, le profil suivant n'est pas le même élève. */
  clearClasses: () => void;
}

type ClassStore = ClassState & ClassActions;

const initialState: ClassState = {
  classNames: {},
  learnerDisplayName: null,
  isHydrated: false,
};

export const useClassStore = create<ClassStore>()(
  persist(
    immer<ClassStore>((set, get) => ({
      ...initialState,

      rememberLink: (classId, className, displayName) => {
        set((state) => {
          // Un nom vide n'écrase pas un nom déjà connu : la réponse serveur peut
          // être partielle, et perdre le nom rendrait l'accueil muet.
          if (classId && className) state.classNames[classId] = className;
          if (displayName) state.learnerDisplayName = displayName;
        });
      },

      getClassName: (classId) => get().classNames[classId] ?? '',

      setHydrated: () => {
        set((state) => {
          state.isHydrated = true;
        });
      },

      clearClasses: () => {
        set((state) => {
          state.classNames = {};
          state.learnerDisplayName = null;
        });
      },
    })),
    {
      name: 'startup-ludo-class',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      partialize: (state) => ({
        classNames: state.classNames,
        learnerDisplayName: state.learnerDisplayName,
      }),
    }
  )
);
