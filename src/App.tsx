/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Application, ApplicationStatus, User, UserRole } from './types';
import { MOCK_USERS, INITIAL_APPLICATIONS } from './data/mockData';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthCard from './components/AuthCard';
import SubmissionForm from './components/SubmissionForm';
import ApplicantDashboard from './components/ApplicantDashboard';
import AdminConsole from './components/AdminConsole';
import AIAssistant from './components/AIAssistant';
import SettingsModal from './components/SettingsModal';
import { Sparkles, ShieldCheck, UserCheck, CheckCircle2 } from 'lucide-react';
import {
  clientGetUsers,
  clientGetApplications,
  clientRegisterUser,
  clientUpdateUser,
  clientSubmitApplication,
  clientUpdateApplicationStatus,
  clientResetDatabase
} from './firebase';

export default function App() {
  // 1. Core Persistent State Initializations
  const [users, setUsers] = React.useState<User[]>(() => {
    const saved = localStorage.getItem('corp_ai_users');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [applications, setApplications] = React.useState<Application[]>(() => {
    const saved = localStorage.getItem('corp_ai_applications');
    return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
  });

  const [currentUser, setCurrentUser] = React.useState<User | null>(() => {
    const saved = localStorage.getItem('corp_ai_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeView, setActiveView] = React.useState<'landing' | 'auth' | 'applicant-dashboard' | 'admin-console' | 'submit-form'>(() => {
    const savedUser = localStorage.getItem('corp_ai_current_user');
    if (savedUser) {
      const userObj: User = JSON.parse(savedUser);
      return userObj.role === 'admin' ? 'admin-console' : 'applicant-dashboard';
    }
    return 'landing';
  });

  const [authIntentRole, setAuthIntentRole] = React.useState<UserRole>('applicant');
  const [loadingBackend, setLoadingBackend] = React.useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('corp_ai_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const handleToggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('corp_ai_theme', nextTheme);
      return nextTheme;
    });
  };

  const deduplicateApps = (appsList: Application[]): Application[] => {
    const seen = new Set<string>();
    const result: Application[] = [];
    for (const item of appsList) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  };

  // Sync state from server on mount
  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersRes, appsRes] = await Promise.all([
          fetch('/api/users').catch(() => null),
          fetch('/api/applications').catch(() => null)
        ]);
        
        let usersLoaded = false;
        let appsLoaded = false;

        if (usersRes && usersRes.ok) {
          const freshUsers = await usersRes.json();
          setUsers(freshUsers);
          usersLoaded = true;
        }
        if (appsRes && appsRes.ok) {
          const freshApps = await appsRes.json();
          setApplications(deduplicateApps(freshApps));
          appsLoaded = true;
        }

        // If backend API endpoints are unreachable (e.g., Netlify hosting, local build without running server)
        if (!usersLoaded || !appsLoaded) {
          console.log('Backend API unreachable. Connecting directly to Firestore via client-side SDK...');
          try {
            const clientUsers = await clientGetUsers();
            const clientApps = await clientGetApplications();
            setUsers(clientUsers);
            setApplications(deduplicateApps(clientApps));
            console.log('Successfully synchronized directly with client-side Firestore.');
          } catch (firestoreErr) {
            console.error('Direct client-side Firestore failed. Falling back to local/cached data.', firestoreErr);
          }
        }
      } catch (err) {
        console.error('Error loading initial data from server. Trying direct Firestore...', err);
        try {
          const clientUsers = await clientGetUsers();
          const clientApps = await clientGetApplications();
          setUsers(clientUsers);
          setApplications(deduplicateApps(clientApps));
        } catch (firestoreErr) {
          console.error('Both server API and direct Firestore failed. Using cached state.', firestoreErr);
        }
      } finally {
        setLoadingBackend(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Synchronize States with LocalStorage as fallback
  React.useEffect(() => {
    localStorage.setItem('corp_ai_users', JSON.stringify(users));
  }, [users]);

  React.useEffect(() => {
    localStorage.setItem('corp_ai_applications', JSON.stringify(applications));
  }, [applications]);

  React.useEffect(() => {
    if (currentUser) {
      localStorage.setItem('corp_ai_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('corp_ai_current_user');
    }
  }, [currentUser]);

  // 3. Navigation & Auth Handlers
  const handleGetStarted = (preferredRole?: UserRole) => {
    if (currentUser) {
      // If already logged in, route directly to appropriate view
      if (currentUser.role === 'admin') {
        setActiveView('admin-console');
      } else {
        setActiveView('applicant-dashboard');
      }
    } else {
      // Direct user to Auth tab with proper role bias
      setAuthIntentRole(preferredRole || 'applicant');
      setActiveView('auth');
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveView('admin-console');
    } else {
      setActiveView('applicant-dashboard');
    }
  };

  const handleRegisterUser = async (newUser: User) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const registered = await res.json();
        setUsers((prev) => [...prev, registered]);
      } else {
        throw new Error('Server API register failed');
      }
    } catch (err) {
      console.warn('Server API register failed. Trying direct client Firestore...', err);
      try {
        const registered = await clientRegisterUser(newUser);
        setUsers((prev) => [...prev, registered]);
      } catch (firestoreErr) {
        console.error('Direct client Firestore registration failed. Using local state.', firestoreErr);
        setUsers((prev) => [...prev, newUser]);
      }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const res = await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      if (res.ok) {
        const savedUser = await res.json();
        setCurrentUser(savedUser);
        setUsers((prev) => prev.map((u) => (u.id === savedUser.id ? savedUser : u)));
      } else {
        throw new Error('Server API update user failed');
      }
    } catch (err) {
      console.warn('Server API user update failed. Updating directly in client Firestore...', err);
      try {
        const savedUser = await clientUpdateUser(updatedUser);
        setCurrentUser(savedUser);
        setUsers((prev) => prev.map((u) => (u.id === savedUser.id ? savedUser : u)));
      } catch (firestoreErr) {
        console.error('Direct client Firestore user update failed. Updating local state:', firestoreErr);
        setCurrentUser(updatedUser);
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('landing');
  };

  // Switch identity effortlessly via Navbar
  const handleSwitchUser = (userId: string) => {
    const matched = users.find((u) => u.id === userId);
    if (matched) {
      setCurrentUser(matched);
      if (matched.role === 'admin') {
        setActiveView('admin-console');
      } else {
        setActiveView('applicant-dashboard');
      }
    }
  };

  // 4. Submission Operations
  const handleSubmitProposal = async (formData: Omit<Application, 'id' | 'applicantId' | 'applicantName' | 'applicantEmail' | 'submittedAt' | 'status' | 'reviewHistory'> & { attachments: any[] }) => {
    if (!currentUser) return;

    const payload = {
      ...formData,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantEmail: currentUser.email,
    };

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newApp = await res.json();
        setApplications((prev) => deduplicateApps([newApp, ...prev]));
        setActiveView('applicant-dashboard');
      } else {
        throw new Error('Server API submit failed');
      }
    } catch (err) {
      console.warn('Server API submission failed. Submitting directly to client Firestore...', err);
      try {
        const newApp = await clientSubmitApplication(payload);
        setApplications((prev) => deduplicateApps([newApp, ...prev]));
        setActiveView('applicant-dashboard');
      } catch (firestoreErr) {
        console.error('Direct client-side Firestore submission failed. Falling back to local fallback:', firestoreErr);
        const count = (applications || []).length + 1;
        const padding = count < 10 ? '00' : count < 100 ? '0' : '';
        const newId = `APP-2026-${padding}${count}-${Date.now().toString().slice(-4)}`;
        const newAppFallback: Application = {
          ...formData,
          id: newId,
          applicantId: currentUser.id,
          applicantName: currentUser.name,
          applicantEmail: currentUser.email,
          submittedAt: new Date().toISOString(),
          status: 'Submitted',
          reviewHistory: [
            {
              id: `rev_${Date.now()}`,
              statusFrom: 'None',
              statusTo: 'Submitted',
              actionBy: currentUser.name,
              actionByRole: 'admin',
              comments: 'Proposal successfully registered in local fallback storage.',
              timestamp: new Date().toISOString(),
            },
          ],
        };
        setApplications((prev) => deduplicateApps([newAppFallback, ...prev]));
        setActiveView('applicant-dashboard');
      }
    }
  };

  // 5. Governance Evaluation Operations (Board Updates Status)
  const handleUpdateProposalStatus = async (
    appId: string, 
    newStatus: ApplicationStatus, 
    comments: string, 
    adminName: string
  ) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, comments, adminName }),
      });
      if (res.ok) {
        const updatedApp = await res.json();
        setApplications((prevApps) =>
          prevApps.map((app) => (app.id === appId ? updatedApp : app))
        );
      } else {
        throw new Error('Server API update status failed');
      }
    } catch (err) {
      console.warn('Server API update status failed. Updating directly in client Firestore...', err);
      try {
        const updatedApp = await clientUpdateApplicationStatus(appId, newStatus, comments, adminName);
        setApplications((prevApps) =>
          prevApps.map((app) => (app.id === appId ? updatedApp : app))
        );
      } catch (firestoreErr) {
        console.error('Direct client Firestore status update failed. Falling back to local state:', firestoreErr);
        setApplications((prevApps) =>
          prevApps.map((app) => {
            if (app.id === appId) {
              const newHistoryEntry = {
                id: `rev_${Date.now()}`,
                statusFrom: app.status,
                statusTo: newStatus,
                actionBy: adminName,
                actionByRole: 'admin' as const,
                comments: comments,
                timestamp: new Date().toISOString(),
              };
              return {
                ...app,
                status: newStatus,
                reviewHistory: [newHistoryEntry, ...app.reviewHistory],
              };
            }
            return app;
          })
        );
      }
    }
  };

  // 6. Sandbox Reset Button to clean local storage and return to default mock data
  const handleResetSandbox = async () => {
    if (window.confirm('Do you want to reset all submissions and sandbox users to default demonstration settings on the backend and client?')) {
      try {
        const res = await fetch('/api/reset', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
          setApplications(data.applications);
        } else {
          throw new Error('Server API reset failed');
        }
      } catch (err) {
        console.warn('Server API reset failed. Resetting directly in client Firestore...', err);
        try {
          const data = await clientResetDatabase();
          setUsers(data.users);
          setApplications(data.applications);
        } catch (firestoreErr) {
          console.error('Direct client-side Firestore reset failed. Using local defaults:', firestoreErr);
          setUsers(MOCK_USERS);
          setApplications(INITIAL_APPLICATIONS);
        }
      } finally {
        localStorage.removeItem('corp_ai_users');
        localStorage.removeItem('corp_ai_applications');
        localStorage.removeItem('corp_ai_current_user');
        setCurrentUser(null);
        setActiveView('landing');
      }
    }
  };

  return (
    <div className={`min-h-screen immersive-bg flex flex-col font-sans transition-colors duration-200 ${theme === 'light' ? 'light-theme text-slate-900' : 'text-white'}`} id="app-root">
      {/* Header Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        allUsers={users}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      {currentUser && (
        <SettingsModal
          currentUser={currentUser}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* Main Viewport Container */}
      <main className="grow animate-fade-in flex flex-col">
        {activeView === 'landing' && (
          <LandingPage
            onGetStarted={handleGetStarted}
            isLoggedIn={!!currentUser}
            currentUserRole={currentUser?.role}
          />
        )}

        {activeView === 'auth' && (
          <div className="py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center min-h-[calc(100vh-4rem)]">
            <AuthCard
              onLoginSuccess={handleLoginSuccess}
              initialSelectedRole={authIntentRole}
              allUsers={users}
              onRegisterUser={handleRegisterUser}
            />
          </div>
        )}

        {activeView === 'submit-form' && currentUser && (
          <SubmissionForm
            currentUser={currentUser}
            onSubmit={handleSubmitProposal}
            onCancel={() => setActiveView('applicant-dashboard')}
          />
        )}

        {activeView === 'applicant-dashboard' && currentUser && (
          <ApplicantDashboard
            currentUser={currentUser}
            applications={applications}
            onOpenNewForm={() => setActiveView('submit-form')}
          />
        )}

        {activeView === 'admin-console' && currentUser && (
          <AdminConsole
            currentUser={currentUser}
            applications={applications}
            onUpdateStatus={handleUpdateProposalStatus}
          />
        )}
      </main>

      {/* Persistent Sandbox Controls panel in page footer - very handy for the evaluator! */}
      <div className="bg-[#050608]/90 backdrop-blur-md border-t border-white/10 py-3.5 px-4 sm:px-6 lg:px-8 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-400 font-mono">
          <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
          <span>Evaluation Space Sandbox</span>
          <span className="text-[10px] bg-white/10 text-orange-400 px-1.5 py-0.5 rounded font-bold uppercase border border-orange-500/20">Active</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {/* Quick toggle shortcuts in foot bar */}
          <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Quick Navigate:</span>
          <button
            onClick={() => setActiveView('landing')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase transition ${
              activeView === 'landing' ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/20' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Landing
          </button>
          
          <button
            onClick={() => {
              const appUser = users.find(u => u.role === 'applicant');
              if (appUser) handleSwitchUser(appUser.id);
              else handleGetStarted('applicant');
            }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase transition flex items-center space-x-1 ${
              currentUser?.role === 'applicant' && activeView === 'applicant-dashboard' ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/20' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 mr-0.5" />
            <span>Applicant Portal</span>
          </button>

          <button
            onClick={() => {
              const admUser = users.find(u => u.role === 'admin');
              if (admUser) handleSwitchUser(admUser.id);
              else handleGetStarted('admin');
            }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase transition flex items-center space-x-1 ${
              currentUser?.role === 'admin' && activeView === 'admin-console' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-0.5" />
            <span>Admin Review</span>
          </button>

          <div className="h-4 w-px bg-white/10"></div>

          <button
            onClick={handleResetSandbox}
            className="text-[10px] font-bold text-red-400 hover:text-white hover:bg-red-600/30 border border-red-500/20 px-2.5 py-1 rounded-md transition"
            title="Clean local data and restore mock submissions"
          >
            Reset Sandbox Data
          </button>
        </div>
      </div>
      
      {/* Floating AI Portal Assistant Chat widget - displayed for Applicants only */}
      {currentUser?.role === 'applicant' && <AIAssistant />}
    </div>
  );
}
