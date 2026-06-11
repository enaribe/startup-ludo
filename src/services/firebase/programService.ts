import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

import { FIRESTORE_COLLECTIONS, firebaseLog, getFirebaseErrorMessage } from './config';
import type { PartnerProgram, ProgramEnrollment, ProgramPartner, ProgramSession } from '@/types/program';

type QDocSnap = FirebaseFirestoreTypes.QueryDocumentSnapshot;

function programEnrollmentDocId(userId: string, programId: string): string {
  return `${userId}_${programId}`;
}

export async function getRemotePartners(): Promise<ProgramPartner[]> {
  try {
    const snapshot = await getDocs(collection(getFirestore(), FIRESTORE_COLLECTIONS.partners));
    return snapshot.docs.map((d: QDocSnap) => {
      const data = d.data();
      return { ...data, id: (data as { id?: string }).id ?? d.id } as ProgramPartner;
    });
  } catch (error) {
    firebaseLog('Failed to fetch partners catalog', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

export async function getRemotePrograms(): Promise<PartnerProgram[]> {
  try {
    const snapshot = await getDocs(collection(getFirestore(), FIRESTORE_COLLECTIONS.programs));
    return snapshot.docs.map((d: QDocSnap) => {
      const data = d.data();
      return { ...data, id: (data as { id?: string }).id ?? d.id } as PartnerProgram;
    });
  } catch (error) {
    firebaseLog('Failed to fetch programs catalog', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

export async function setProgramEnrollment(enrollment: ProgramEnrollment): Promise<void> {
  try {
    const docId = programEnrollmentDocId(enrollment.userId, enrollment.programId);
    firebaseLog('Setting program enrollment', { docId });
    await setDoc(
      doc(getFirestore(), FIRESTORE_COLLECTIONS.programEnrollments, docId),
      {
        ...enrollment,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    firebaseLog('Failed to set program enrollment', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

export async function getProgramEnrollmentsForUser(userId: string): Promise<ProgramEnrollment[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(getFirestore(), FIRESTORE_COLLECTIONS.programEnrollments),
        where('userId', '==', userId)
      )
    );

    return snapshot.docs.map((d: QDocSnap) => {
      const data = d.data();
      return { ...data, id: (data as { id?: string }).id ?? d.id } as ProgramEnrollment;
    });
  } catch (error) {
    firebaseLog('Failed to fetch program enrollments', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

export async function setProgramSession(session: ProgramSession): Promise<void> {
  try {
    firebaseLog('Setting program session', { sessionId: session.id });
    await setDoc(
      doc(getFirestore(), FIRESTORE_COLLECTIONS.programSessions, session.id),
      {
        ...session,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    firebaseLog('Failed to set program session', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

export async function getProgramSessionsForUser(userId: string): Promise<ProgramSession[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(getFirestore(), FIRESTORE_COLLECTIONS.programSessions),
        where('userId', '==', userId)
      )
    );

    return snapshot.docs.map((d: QDocSnap) => {
      const data = d.data();
      return { ...data, id: (data as { id?: string }).id ?? d.id } as ProgramSession;
    });
  } catch (error) {
    firebaseLog('Failed to fetch program sessions', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

