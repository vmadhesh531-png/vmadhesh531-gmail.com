import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { Application, User, ApplicationStatus } from './src/types';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getSupabaseClient, SUPABASE_PROJECT_ID, SUPABASE_SQL_SCHEMA } from './src/supabase';

const PORT = 3000;

// Load Firebase configuration
const CONFIG_PATH = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(CONFIG_PATH)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    console.log('[Firebase] Configuration loaded successfully.');
  } catch (error) {
    console.error('[Firebase] Failed to parse configuration file:', error);
  }
} else {
  console.warn('[Firebase] Warning: firebase-applet-config.json not found.');
}

// Initialize Firebase App and Firestore
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');

// Default initial data to seed if Firestore is empty
const DEFAULT_USERS: User[] = [
  {
    id: 'usr_1',
    email: 'applicant@company.ai',
    name: 'Sarah Jenkins',
    role: 'applicant',
    department: 'Customer Experience Operations',
    password: 'password123',
  },
  {
    id: 'usr_2',
    email: 'innovator@company.ai',
    name: 'Dr. Marcus Vance',
    role: 'applicant',
    department: 'R&D Lab and Engineering',
    password: 'password123',
  },
  {
    id: 'usr_admin',
    email: 'admin@company.ai',
    name: 'Chief AI Reviewer',
    role: 'admin',
    department: 'AI Governance Board',
    password: 'admin123',
  },
];

const DEFAULT_APPLICATIONS: Application[] = [
  {
    id: 'APP-2026-001',
    title: 'Cognitive CS Agent: Auto-Resolving Tier 1 Tickets',
    applicantId: 'usr_1',
    applicantName: 'Sarah Jenkins',
    applicantEmail: 'applicant@company.ai',
    department: 'Customer Experience Operations',
    category: 'Generative AI & LLMs',
    description: 'We experience high volumes of Tier 1 customer queries related to basic account settings, password resets, and subscription updates. This project aims to integrate a customized LLM assistant directly into our customer support channel to safely auto-resolve up to 45% of these tickets, freeing up human agents for complex matters.',
    proposedSolution: 'Using retrieval-augmented generation (RAG) hooked into our corporate wiki and user settings databases. Guardrails will filter out non-support queries, and an automatic human-handoff flag will trigger if confidence falls below 85% or if frustration patterns are detected.',
    teamSize: 4,
    budget: 45000,
    timeline: '3 Months (Short Term MVP)',
    expectedImpact: 'Reduce support queue waiting times from 12 minutes to 5 seconds. Save an estimated $120,000 annually in support agent overhead and increase customer satisfaction (CSAT) by 18 points.',
    submittedAt: '2026-06-15T09:30:00Z',
    status: 'Approved',
    attachments: [
      { name: 'architecture_diagram.pdf', size: '2.4 MB', type: 'application/pdf' },
      { name: 'roi_estimation_spreadsheet.xlsx', size: '420 KB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ],
    reviewHistory: [
      {
        id: 'rev_1',
        statusFrom: 'None',
        statusTo: 'Submitted',
        actionBy: 'Sarah Jenkins',
        actionByRole: 'admin',
        comments: 'Initial project submission with complete technical diagram and budget layout.',
        timestamp: '2026-06-15T09:30:00Z',
      },
      {
        id: 'rev_2',
        statusFrom: 'Submitted',
        statusTo: 'Under Review',
        actionBy: 'Elena Rostova (AI Governance)',
        actionByRole: 'admin',
        comments: 'Assigned to Technical Committee for feasibility review. Looks highly viable with clear RAG architecture.',
        timestamp: '2026-06-16T14:15:00Z',
      },
      {
        id: 'rev_3',
        statusFrom: 'Under Review',
        statusTo: 'Approved',
        actionBy: 'AI Governance Board',
        actionByRole: 'admin',
        comments: 'Funding approved. Excellent risk-mitigation strategy (confidence hand-off) and strong projected ROI. Sarah, please coordinate with IT Security before kickoff.',
        timestamp: '2026-06-20T11:00:00Z',
      },
    ],
  },
  {
    id: 'APP-2026-002',
    title: 'Defect Detection via Computer Vision in Assembly Line 4',
    applicantId: 'usr_2',
    applicantName: 'Dr. Marcus Vance',
    applicantEmail: 'innovator@company.ai',
    department: 'R&D Lab and Engineering',
    category: 'Computer Vision & OCR',
    description: 'Manual inspection of physical parts on Assembly Line 4 results in a 4% defect slip rate, causing expensive product returns. We propose setting up high-speed industrial cameras paired with a customized edge convolutional neural network (CNN) to detect micro-cracks in real-time.',
    proposedSolution: 'Installation of three high-definition synchronized focal lenses on Line 4. A lightweight CNN model trained on our proprietary historical defect dataset will perform inference locally at 60fps, raising an instant physical alarm and mechanical gateway diversion if a crack is spotted.',
    teamSize: 5,
    budget: 95000,
    timeline: '6 Months (Standard Pilot)',
    expectedImpact: 'Reduce defect slip rate from 4% to under 0.1%. Minimize assembly line stop-times by 22% by flagging structural defects prior to subsequent component layers.',
    submittedAt: '2026-06-22T10:00:00Z',
    status: 'Technical Review',
    attachments: [
      { name: 'camera_specs_costing.docx', size: '1.1 MB', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    ],
    reviewHistory: [
      {
        id: 'rev_4',
        statusFrom: 'None',
        statusTo: 'Submitted',
        actionBy: 'Dr. Marcus Vance',
        actionByRole: 'admin',
        comments: 'Proposal submitted. Requires local edge hardware deployment.',
        timestamp: '2026-06-22T10:00:00Z',
      },
      {
        id: 'rev_5',
        statusFrom: 'Submitted',
        statusTo: 'Under Review',
        actionBy: 'Admin Board',
        actionByRole: 'admin',
        comments: 'Initial validation complete. Routing to hardware and engineering teams for edge review.',
        timestamp: '2026-06-23T16:40:00Z',
      },
      {
        id: 'rev_6',
        statusFrom: 'Under Review',
        statusTo: 'Technical Review',
        actionBy: 'Hardware Committee (Tech Review)',
        actionByRole: 'admin',
        comments: 'Edge processing requirements are demanding. We need Marcus to specify heat dispersal limits of the camera enclosure on Line 4 and confirm physical clearance.',
        timestamp: '2026-06-26T09:12:00Z',
      },
    ],
  },
  {
    id: 'APP-2026-003',
    title: 'NLP Competitor Sentiment Tracker & Sales Oracle',
    applicantId: 'usr_1',
    applicantName: 'Sarah Jenkins',
    applicantEmail: 'applicant@company.ai',
    department: 'Customer Experience Operations',
    category: 'NLP & Sentiment Analysis',
    description: 'We currently review market trends manually, leading to delayed pricing strategies. This applet automates scraping of press releases, customer forums, and social media mentions of competitor products to score market sentiment in real-time.',
    proposedSolution: 'Scraping pipeline hosted in cloud run parsing RSS and public social feeds. Sentiment indices are grouped by product category and updated hourly onto a sales forecasting dashboard.',
    teamSize: 2,
    budget: 15000,
    timeline: '3 Months (Short Term MVP)',
    expectedImpact: 'Equip sales teams with dynamic competitor pricing counter-arguments 4 days faster than previous manual reports. Lift conversion rates by an expected 3.5%.',
    submittedAt: '2026-06-28T14:22:00Z',
    status: 'Submitted',
    attachments: [],
    reviewHistory: [
      {
        id: 'rev_7',
        statusFrom: 'None',
        statusTo: 'Submitted',
        actionBy: 'Sarah Jenkins',
        actionByRole: 'admin',
        comments: 'Submitted initial proposal. Budget is extremely modest and setup is lightweight.',
        timestamp: '2026-06-28T14:22:00Z',
      },
    ],
  }
];

// Supabase Data Mappers
function mapAppFromSupabase(data: any): Application {
  return {
    id: data.id,
    title: data.title,
    applicantId: data.applicant_id || data.applicantId || '',
    applicantName: data.applicant_name || data.applicantName || 'Applicant',
    applicantEmail: data.applicant_email || data.applicantEmail || '',
    department: data.department || '',
    category: data.category || 'General AI',
    description: data.description || '',
    proposedSolution: data.proposed_solution || data.proposedSolution || '',
    teamSize: Number(data.team_size || data.teamSize || 1),
    budget: Number(data.budget || 0),
    timeline: data.timeline || '3 Months',
    expectedImpact: data.expected_impact || data.expectedImpact || '',
    submittedAt: data.submitted_at || data.submittedAt || new Date().toISOString(),
    status: data.status || 'Submitted',
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    reviewHistory: Array.isArray(data.review_history) ? data.review_history : (Array.isArray(data.reviewHistory) ? data.reviewHistory : []),
  };
}

function mapAppToSupabase(app: Application): any {
  return {
    id: app.id,
    title: app.title,
    applicant_id: app.applicantId,
    applicant_name: app.applicantName,
    applicant_email: app.applicantEmail,
    department: app.department,
    category: app.category,
    description: app.description,
    proposed_solution: app.proposedSolution,
    team_size: app.teamSize,
    budget: app.budget,
    timeline: app.timeline,
    expected_impact: app.expectedImpact,
    submitted_at: app.submittedAt,
    status: app.status,
    attachments: app.attachments || [],
    review_history: app.reviewHistory || [],
  };
}

// Ensure database has seed data on startup
async function seedDatabase() {
  // 1. Seed Supabase if client is initialized
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      console.log(`[Supabase] Checking tables for project ${SUPABASE_PROJECT_ID}...`);
      const { data: existingUsers, error: usersErr } = await supabase.from('users').select('id');
      if (!usersErr && (!existingUsers || existingUsers.length === 0)) {
        console.log('[Supabase] Seeding default users...');
        await supabase.from('users').insert(DEFAULT_USERS);
      }

      const { data: existingApps, error: appsErr } = await supabase.from('applications').select('id');
      if (!appsErr && (!existingApps || existingApps.length === 0)) {
        console.log('[Supabase] Seeding default applications...');
        const mappedApps = DEFAULT_APPLICATIONS.map(mapAppToSupabase);
        await supabase.from('applications').insert(mappedApps);
      }
    } catch (err) {
      console.warn('[Supabase] Seeding warning:', err);
    }
  }

  // 2. Seed Firestore
  try {
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    if (usersSnapshot.empty) {
      console.log('[Firestore] Seeding default demonstration users...');
      for (const u of DEFAULT_USERS) {
        await setDoc(doc(db, 'users', u.id), u);
      }
    }

    const appsCol = collection(db, 'applications');
    const appsSnapshot = await getDocs(appsCol);
    if (appsSnapshot.empty) {
      console.log('[Firestore] Seeding default demonstration applications...');
      for (const app of DEFAULT_APPLICATIONS) {
        await setDoc(doc(db, 'applications', app.id), app);
      }
    }
  } catch (error) {
    console.error('[Firestore] Warning: Could not seed database:', error);
  }
}


enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize and seed Firebase DB
  await seedDatabase();

  // Create uploads directory if it doesn't exist
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  });
  const upload = multer({ storage });

  // Serve uploads folder statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // API: File Upload
  app.post('/api/upload', (req, res) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        console.error('[Upload Error]', err);
        res.status(400).json({ error: err.message || 'File upload failed' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const sizeMB = (req.file.size / (1024 * 1024)).toFixed(1);
      res.status(200).json({
        name: req.file.filename,
        size: `${sizeMB} MB`,
        type: req.file.mimetype || 'application/octet-stream',
      });
    });
  });

  // API: File Download
  app.get('/api/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      res.download(filePath, filename);
    } else {
      res.status(404).json({ error: 'Supporting file not found on secure server.' });
    }
  });

  // API: Get Supabase Information & SQL Migration Schema
  app.get('/api/supabase/info', (req, res) => {
    const supabase = getSupabaseClient();
    res.json({
      projectId: SUPABASE_PROJECT_ID,
      supabaseUrl: `https://${SUPABASE_PROJECT_ID}.supabase.co`,
      isConfigured: !!supabase,
      schemaSql: SUPABASE_SQL_SCHEMA,
      databaseHost: `db.${SUPABASE_PROJECT_ID}.supabase.co`,
      databasePort: 5432,
      databaseUser: 'postgres',
      databaseName: 'postgres',
    });
  });

  // API: Get all users
  app.get('/api/users', async (req, res) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && data && data.length > 0) {
          res.json(data as User[]);
          return;
        }
      } catch (sbErr) {
        console.warn('[Supabase] Get users fallback:', sbErr);
      }
    }

    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      const usersList: User[] = [];
      snapshot.forEach((doc) => {
        usersList.push(doc.data() as User);
      });
      res.json(usersList);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }
  });

  // API: Register new user
  app.post('/api/users', async (req, res) => {
    const newUser: User = req.body;
    
    if (!newUser.email || !newUser.name || !newUser.role) {
      res.status(400).json({ error: 'Missing required user fields' });
      return;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: existing } = await supabase.from('users').select('email').eq('email', newUser.email).single();
        if (existing) {
          res.status(400).json({ error: 'A user with this email address already exists in Supabase.' });
          return;
        }
        const { error: insErr } = await supabase.from('users').insert(newUser);
        if (!insErr) {
          // Also sync to Firestore
          try {
            await setDoc(doc(db, 'users', newUser.id), newUser);
          } catch (e) {}
          res.status(201).json(newUser);
          return;
        }
      } catch (sbErr) {
        console.warn('[Supabase] Insert user fallback:', sbErr);
      }
    }

    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      const exists = snapshot.docs.some(
        (doc) => (doc.data().email as string).toLowerCase() === newUser.email.toLowerCase()
      );

      if (exists) {
        res.status(400).json({ error: 'A user with this email address already exists.' });
        return;
      }

      const userDocRef = doc(db, 'users', newUser.id);
      await setDoc(userDocRef, newUser);
      res.status(201).json(newUser);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${newUser.id}`);
    }
  });

  // API: Update existing user (Profile or Password)
  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const updatedUser: User = req.body;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: upErr } = await supabase.from('users').update(updatedUser).eq('id', id);
        if (!upErr) {
          try {
            await setDoc(doc(db, 'users', id), updatedUser, { merge: true });
          } catch (e) {}
          res.json(updatedUser);
          return;
        }
      } catch (sbErr) {
        console.warn('[Supabase] Update user fallback:', sbErr);
      }
    }

    try {
      const userDocRef = doc(db, 'users', id);
      await setDoc(userDocRef, updatedUser, { merge: true });
      res.json(updatedUser);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${id}`);
    }
  });

  // API: Get all applications
  app.get('/api/applications', async (req, res) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('applications').select('*');
        if (!error && data && data.length > 0) {
          const appsList = data.map(mapAppFromSupabase);
          appsList.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          res.json(appsList);
          return;
        }
      } catch (sbErr) {
        console.warn('[Supabase] Get applications fallback:', sbErr);
      }
    }

    try {
      const appsCol = collection(db, 'applications');
      const snapshot = await getDocs(appsCol);
      const appsList: Application[] = [];
      snapshot.forEach((doc) => {
        appsList.push(doc.data() as Application);
      });
      // Sort applications by submittedAt desc
      appsList.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      res.json(appsList);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, 'applications');
    }
  });

  // API: Submit new application proposal
  app.post('/api/applications', async (req, res) => {
    const appData = req.body;

    if (!appData.title || !appData.applicantId || !appData.description) {
      res.status(400).json({ error: 'Missing required application fields' });
      return;
    }

    let count = 1;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: allApps } = await supabase.from('applications').select('id');
        if (allApps) count = allApps.length + 1;
      } catch (e) {}
    } else {
      try {
        const appsCol = collection(db, 'applications');
        const snapshot = await getDocs(appsCol);
        count = snapshot.size + 1;
      } catch (e) {}
    }

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

    if (supabase) {
      try {
        const { error: insErr } = await supabase.from('applications').insert(mapAppToSupabase(newApp));
        if (!insErr) {
          try {
            await setDoc(doc(db, 'applications', newId), newApp);
          } catch (e) {}
          res.status(201).json(newApp);
          return;
        }
      } catch (sbErr) {
        console.warn('[Supabase] Insert app fallback:', sbErr);
      }
    }

    try {
      await setDoc(doc(db, 'applications', newId), newApp);
      res.status(201).json(newApp);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'applications');
    }
  });

  // API: Update application status and review history
  app.put('/api/applications/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, comments, adminName } = req.body;

    if (!status || !comments || !adminName) {
      res.status(400).json({ error: 'Missing status, comments or adminName' });
      return;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: existingApp } = await supabase.from('applications').select('*').eq('id', id).single();
        if (existingApp) {
          const appItem = mapAppFromSupabase(existingApp);
          const newHistoryEntry = {
            id: `rev_${Date.now()}`,
            statusFrom: appItem.status,
            statusTo: status as ApplicationStatus,
            actionBy: adminName,
            actionByRole: 'admin' as const,
            comments: comments,
            timestamp: new Date().toISOString(),
          };

          const updatedApp: Application = {
            ...appItem,
            status: status as ApplicationStatus,
            reviewHistory: [newHistoryEntry, ...appItem.reviewHistory],
          };

          const { error: upErr } = await supabase.from('applications').update(mapAppToSupabase(updatedApp)).eq('id', id);
          if (!upErr) {
            try {
              await setDoc(doc(db, 'applications', id), updatedApp);
            } catch (e) {}
            res.json(updatedApp);
            return;
          }
        }
      } catch (sbErr) {
        console.warn('[Supabase] Update app fallback:', sbErr);
      }
    }

    try {
      const appDocRef = doc(db, 'applications', id);
      const appDoc = await getDoc(appDocRef);

      if (!appDoc.exists()) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      const appItem = appDoc.data() as Application;
      const newHistoryEntry = {
        id: `rev_${Date.now()}`,
        statusFrom: appItem.status,
        statusTo: status as ApplicationStatus,
        actionBy: adminName,
        actionByRole: 'admin' as const,
        comments: comments,
        timestamp: new Date().toISOString(),
      };

      const updatedApp: Application = {
        ...appItem,
        status: status as ApplicationStatus,
        reviewHistory: [newHistoryEntry, ...appItem.reviewHistory],
      };

      await setDoc(appDocRef, updatedApp);
      res.json(updatedApp);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `applications/${id}`);
    }
  });

  // API: Reset database
  app.post('/api/reset', async (req, res) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('applications').delete().neq('id', 'NONE');
        await supabase.from('users').delete().neq('id', 'NONE');
        await supabase.from('users').insert(DEFAULT_USERS);
        await supabase.from('applications').insert(DEFAULT_APPLICATIONS.map(mapAppToSupabase));
      } catch (sbErr) {
        console.warn('[Supabase] Reset database fallback:', sbErr);
      }
    }

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
      for (const u of DEFAULT_USERS) {
        await setDoc(doc(db, 'users', u.id), u);
      }
      for (const app of DEFAULT_APPLICATIONS) {
        await setDoc(doc(db, 'applications', app.id), app);
      }

      res.json({ message: 'Database reset successfully across Supabase & Firestore', users: DEFAULT_USERS, applications: DEFAULT_APPLICATIONS });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'reset');
    }
  });


  // Lazy initialize Gemini client
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('[Gemini SDK] GEMINI_API_KEY environment variable is missing. Will fall back to intelligent offline responder.');
        return null;
      }
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return geminiClient;
  }

  // Local intelligent fallback responder for VK AI Governance Portal
  function getLocalFallbackResponse(userPrompt: string): string {
    const query = userPrompt.toLowerCase();
    
    if (query.includes('submit') || query.includes('proposal') || query.includes('how to create') || query.includes('how do i') || query.includes('add project') || query.includes('submitting')) {
      return `To **submit a new project proposal** on the VK Corporate Portal:\n\n1. Use the quick navigation footer to switch to the **Applicant Dashboard**.\n2. Click the **"+ Submit Project Proposal"** button in the top-right corner of the console.\n3. Complete the interactive form with details including:\n   - **Title** and **AI/ML Category** (e.g., Computer Vision, Large Language Models)\n   - **Problem Description** and **Proposed Solution**\n   - **Requested Budget ($)**, **Proposed Team Size**, and **Project Timeline**\n   - **Expected Business & Operational Impact**\n4. Attach any supporting diagrams or Excel sheets in the file drag-and-drop zone.\n5. Click **"Submit Proposal to Board"** to commit the proposal to the secure ledger.`;
    }
    
    if (query.includes('status') || query.includes('phase') || query.includes('workflow') || query.includes('review') || query.includes('stage') || query.includes('history')) {
      return `The **VK Corporate Portal** features a structured multi-phase AI/ML feasibility workflow:\n\n1. 📥 **Submitted**: The project is registered and the initial review history entry is logged.\n2. 🔍 **Under Review**: The AI Board is assessing the proposal's baseline ROI and strategic alignment.\n3. ⚙️ **Technical Review**: Lead architects evaluate GPU/compute scaling, data readiness, and security protocols.\n4. ✅ **Approved** / ❌ **Rejected**: The final feasibility status with funding allocation details.\n\nYou can switch to the **Admin Review Console** to see the interactive status transition tools in action!`;
    }
    
    if (query.includes('role') || query.includes('switch') || query.includes('admin') || query.includes('applicant') || query.includes('test') || query.includes('sandbox')) {
      return `The portal includes a **simulation control bar** in the footer that lets you test both major workflow roles:\n\n- **Applicant Mode**: Access the **Applicant Dashboard** to submit project proposals, upload supporting documents, and track feasibility statuses.\n- **Board Reviewer Mode**: Access the **Admin Review Console** to act as the Chief AI Reviewer, comment on proposals, adjust budgets, and advance submissions through the workflow phases.`;
    }
    
    if (query.includes('reset') || query.includes('clear') || query.includes('wipe') || query.includes('default')) {
      return `You can **reset the sandbox data** at any time to restore the system to its clean default state:\n\n- Simply click the **"Reset Sandbox Data"** button located in the bottom simulation control bar.\n- This will re-seed the default project proposals (such as the CV Predictive Maintenance and Customer Support LLM) and clear any custom uploads in the Firestore database.`;
    }

    if (query.includes('document') || query.includes('file') || query.includes('upload') || query.includes('download') || query.includes('excel') || query.includes('pdf')) {
      return `The portal features a **secure document storage and download system**:\n\n- **Uploading**: When filling out the project proposal form, you can drag and drop or click to upload PDF, Excel, Docx, or PNG files up to 10MB.\n- **Downloading**: Both Applicants and Board Reviewers can click the **Download** button next to any attached document to retrieve files directly from the secure server storage.`;
    }

    if (query.includes('who') || query.includes('reviewer') || query.includes('board') || query.includes('sarah') || query.includes('marcus') || query.includes('user') || query.includes('jenkins')) {
      return `The system comes pre-configured with several **test profiles**:\n\n- **Sarah Jenkins** (Applicant, Retail Division): Author of the Customer Support LLM project.\n- **Dr. Marcus Vance** (Applicant, Operations Division): Author of the CV Predictive Maintenance project.\n- **Chief AI Reviewer** (Admin, AI Board): The persona responsible for reviewing submissions and managing the feasibility queue.`;
    }

    return `Welcome to the **VK Corporate Portal (AI Governance & Feasibility Console)**!\n\nAs your AI Governance Guide, I can help you with:\n- **Submitting project proposals**: Learn how to create and submit ideas.\n- **Workflow phases**: Understand the path from *Submitted* to *Technical Review* and *Approved*.\n- **Role simulation**: Learn how to use the footer controls to switch between Applicant and Admin roles.\n- **Document security**: Learn about uploading and downloading project attachments.\n\nWhat would you like to know more about?`;
  }

  // API: AI Guide for newcomers
  app.post('/api/gemini/chat', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage ? lastMessage.content : "Hello! What can you tell me about this portal?";

    try {
      const client = getGeminiClient();
      if (!client) {
        // Safe fallback to intelligent offline responder
        console.info('[Gemini SDK] No API key found. Using offline intelligent responder.');
        const fallbackText = getLocalFallbackResponse(userPrompt);
        res.json({ text: fallbackText });
        return;
      }
      
      const chatContext = `You are the VK AI Governance Guide, an intelligent and helpful virtual assistant for the VK Corporate Portal.
Your goal is to help newcomers understand the website, its purpose, its governance workflows, and how to use its features.

Website Name: VK Corporate Board Dashboard (AI Governance & Feasibility Console)

Key Info to Share:
1. What this website is: A portal where employees of VK Corporation propose AI/ML/CV/NLP project ideas, and the AI Governance Board (Admin reviewers) assesses them for ROI, safety, technical feasibility, and resource allocation.
2. Roles on the Portal:
   - Applicants (like Sarah Jenkins or Dr. Marcus Vance): submit project proposals, specify team size, timeline, budget, and track feasibility history.
   - Admins/Reviewers (like Chief AI Reviewer): review applications, provide feedback comments, and update statuses.
3. Interactive Sandbox Features:
   - There's a "Quick Navigate" tool in the footer to quickly switch between the Landing Page, the Applicant Dashboard, and the Admin Review Console.
   - You can click "Reset Sandbox Data" in the footer at any time to restore the default seed proposals and clean up local changes.
4. How to submit a project:
   - Access the Applicant Dashboard, click "+ Submit Project Proposal", fill in details like category, budget, timeline, and expected impact.

Please answer the user's questions clearly, politely, professionally, and in clean Markdown formatting. Keep your responses concise and engaging. Ensure you never output internal engineering details.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: chatContext,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.warn('[Gemini SDK] Live API call failed. Falling back to offline intelligent responder. Error:', error);
      try {
        const fallbackText = getLocalFallbackResponse(userPrompt);
        res.json({ text: fallbackText });
      } catch (fallbackErr) {
        res.status(500).json({ 
          error: error.message || 'The AI service is currently unavailable.' 
        });
      }
    }
  });

  // Vite Integration for Assets and SPA Client Delivery
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] VK Corporate Portal running on http://localhost:${PORT}`);
  });
}

startServer();
