import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { User, Application, ApplicationStatus } from './types';
import { MOCK_USERS, INITIAL_APPLICATIONS } from './data/mockData';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');
const auth = getAuth(app);

export { db, auth };

export async function clientGetUsers(): Promise<User[]> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const usersList: User[] = [];
    snapshot.forEach((doc) => {
      usersList.push(doc.data() as User);
    });
    if (usersList.length === 0) {
      // Seed default users if empty
      for (const u of MOCK_USERS) {
        await setDoc(doc(db, 'users', u.id), u);
        usersList.push(u);
      }
    }
    return usersList;
  } catch (error) {
    console.error('Error fetching users directly from client Firestore:', error);
    throw error;
  }
}

export async function clientRegisterUser(newUser: User): Promise<User> {
  try {
    const userDocRef = doc(db, 'users', newUser.id);
    await setDoc(userDocRef, newUser);
    return newUser;
  } catch (error) {
    console.error('Error registering user directly in client Firestore:', error);
    throw error;
  }
}

export async function clientUpdateUser(updatedUser: User): Promise<User> {
  try {
    const userDocRef = doc(db, 'users', updatedUser.id);
    await setDoc(userDocRef, updatedUser, { merge: true });
    return updatedUser;
  } catch (error) {
    console.error('Error updating user directly in client Firestore:', error);
    throw error;
  }
}

export async function clientGetApplications(): Promise<Application[]> {
  try {
    const appsCol = collection(db, 'applications');
    const snapshot = await getDocs(appsCol);
    const appsList: Application[] = [];
    snapshot.forEach((doc) => {
      appsList.push(doc.data() as Application);
    });
    if (appsList.length === 0) {
      // Seed default applications if empty
      for (const app of INITIAL_APPLICATIONS) {
        await setDoc(doc(db, 'applications', app.id), app);
        appsList.push(app);
      }
    }
    // Sort desc by submittedAt
    appsList.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return appsList;
  } catch (error) {
    console.error('Error fetching applications directly from client Firestore:', error);
    throw error;
  }
}

export async function clientSubmitApplication(appData: any): Promise<Application> {
  try {
    const appsCol = collection(db, 'applications');
    const snapshot = await getDocs(appsCol);
    const count = snapshot.size + 1;
    const padding = count < 10 ? '00' : count < 100 ? '0' : '';
    const newId = `APP-2026-${padding}${count}`;

    const newApp: Application = {
      ...appData,
      id: newId,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      reviewHistory: [
        {
          id: `rev_${Date.now()}`,
          statusFrom: 'None',
          statusTo: 'Submitted',
          actionBy: appData.applicantName || 'Applicant',
          actionByRole: 'admin',
          comments: 'Proposal successfully registered in the secure ledger.',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await setDoc(doc(db, 'applications', newId), newApp);
    return newApp;
  } catch (error) {
    console.error('Error submitting application directly to client Firestore:', error);
    throw error;
  }
}

export async function clientUpdateApplicationStatus(id: string, status: ApplicationStatus, comments: string, adminName: string): Promise<Application> {
  try {
    const appDocRef = doc(db, 'applications', id);
    const appDoc = await getDoc(appDocRef);

    if (!appDoc.exists()) {
      throw new Error('Application not found');
    }

    const appItem = appDoc.data() as Application;
    const newHistoryEntry = {
      id: `rev_${Date.now()}`,
      statusFrom: appItem.status,
      statusTo: status,
      actionBy: adminName,
      actionByRole: 'admin' as const,
      comments: comments,
      timestamp: new Date().toISOString(),
    };

    const updatedApp: Application = {
      ...appItem,
      status: status,
      reviewHistory: [newHistoryEntry, ...appItem.reviewHistory],
    };

    await setDoc(appDocRef, updatedApp);
    return updatedApp;
  } catch (error) {
    console.error('Error updating status directly in client Firestore:', error);
    throw error;
  }
}

export async function clientResetDatabase(): Promise<{ users: User[], applications: Application[] }> {
  try {
    // Delete existing users
    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    for (const d of usersSnap.docs) {
      await deleteDoc(doc(db, 'users', d.id));
    }

    // Delete existing applications
    const appsCol = collection(db, 'applications');
    const appsSnap = await getDocs(appsCol);
    for (const d of appsSnap.docs) {
      await deleteDoc(doc(db, 'applications', d.id));
    }

    // Seed default users and apps
    for (const u of MOCK_USERS) {
      await setDoc(doc(db, 'users', u.id), u);
    }
    for (const app of INITIAL_APPLICATIONS) {
      await setDoc(doc(db, 'applications', app.id), app);
    }

    return { users: MOCK_USERS, applications: INITIAL_APPLICATIONS };
  } catch (error) {
    console.error('Error resetting client Firestore:', error);
    throw error;
  }
}
