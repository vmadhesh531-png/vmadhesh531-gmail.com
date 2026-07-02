import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 1. Firebase Config
import firebaseConfig from './firebase-applet-config.json';

// 2. Supabase Config
const supabaseUrl = 'https://iljzdqdmnjbtreorpvfu.supabase.co';
const supabaseAnonKey = 'sb_publishable_7T8RQmprdEL8PYB05pLkDA__uOvIvCB';

async function extract() {
  console.log('Starting Database Extraction...');
  const outDir = path.join(process.cwd(), 'database_dumps');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // --- FIREBASE EXTRACT ---
  try {
    console.log('Connecting to Firestore...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

    console.log('Fetching users from Firestore...');
    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    const usersList: any[] = [];
    usersSnap.forEach((doc) => {
      usersList.push({ id: doc.id, ...doc.data() });
    });
    fs.writeFileSync(path.join(outDir, 'firestore_users.json'), JSON.stringify(usersList, null, 2), 'utf-8');
    console.log(`Extracted ${usersList.length} users from Firestore.`);

    console.log('Fetching applications from Firestore...');
    const appsCol = collection(db, 'applications');
    const appsSnap = await getDocs(appsCol);
    const appsList: any[] = [];
    appsSnap.forEach((doc) => {
      appsList.push({ id: doc.id, ...doc.data() });
    });
    fs.writeFileSync(path.join(outDir, 'firestore_applications.json'), JSON.stringify(appsList, null, 2), 'utf-8');
    console.log(`Extracted ${appsList.length} applications from Firestore.`);

  } catch (err) {
    console.error('Error extracting from Firestore:', err);
  }

  // --- SUPABASE EXTRACT ---
  try {
    console.log('Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('Fetching users from Supabase...');
    const { data: users, error: usersErr } = await supabase.from('users').select('*');
    if (usersErr) {
      console.error('Error fetching users from Supabase:', usersErr);
    } else {
      fs.writeFileSync(path.join(outDir, 'supabase_users.json'), JSON.stringify(users, null, 2), 'utf-8');
      console.log(`Extracted ${users ? users.length : 0} users from Supabase.`);
    }

    console.log('Fetching applications from Supabase...');
    const { data: apps, error: appsErr } = await supabase.from('applications').select('*');
    if (appsErr) {
      console.error('Error fetching applications from Supabase:', appsErr);
    } else {
      fs.writeFileSync(path.join(outDir, 'supabase_applications.json'), JSON.stringify(apps, null, 2), 'utf-8');
      console.log(`Extracted ${apps ? apps.length : 0} applications from Supabase.`);
    }
  } catch (err) {
    console.error('Error extracting from Supabase:', err);
  }

  console.log('Extraction complete. Files written to "database_dumps" directory.');
}

extract();
