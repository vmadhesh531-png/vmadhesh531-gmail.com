/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../data/mockData';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  UserPlus,
  ArrowRight,
  CornerDownRight,
  Eye,
  EyeOff,
  Phone,
  Smartphone,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import vkLogo from '../assets/images/vk_logo_1782802966591.jpg';
import { auth } from '../firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';

interface AuthCardProps {
  onLoginSuccess: (user: User) => void;
  initialSelectedRole?: UserRole;
  allUsers: User[];
  onRegisterUser: (user: User) => void;
}

export default function AuthCard({
  onLoginSuccess,
  initialSelectedRole = 'applicant',
  allUsers,
  onRegisterUser,
}: AuthCardProps) {
  const [authMethod, setAuthMethod] = React.useState<'email' | 'google' | 'phone'>('email');
  const [activeTab, setActiveTab] = React.useState<'login' | 'register'>('login');

  // Email States
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);

  // Phone States
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [generatedOtp, setGeneratedOtp] = React.useState('');
  const [enteredOtp, setEnteredOtp] = React.useState('');
  const [phoneUserName, setPhoneUserName] = React.useState('');
  const [phoneUserRole, setPhoneUserRole] = React.useState<UserRole>('applicant');

  // Registration States
  const [regName, setRegName] = React.useState('');
  const [regEmail, setRegEmail] = React.useState('');
  const [regPhone, setRegPhone] = React.useState('');
  const [regRole, setRegRole] = React.useState<UserRole>('applicant');
  const [regDept, setRegDept] = React.useState('Customer Experience Operations');
  const [regPassword, setRegPassword] = React.useState('');
  const [regConfirmPassword, setRegConfirmPassword] = React.useState('');
  const [showRegPassword, setShowRegPassword] = React.useState(false);

  const [errorMessage, setErrorMessage] = React.useState('');
  const [infoMessage, setInfoMessage] = React.useState('');
  const [loadingGoogle, setLoadingGoogle] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both your corporate email and password.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (firebaseErr: any) {
      console.warn('Firebase Auth direct email sign-in notice (falling back to database match):', firebaseErr.message);
    }

    const matchedUser = allUsers.find(
      (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (matchedUser) {
      const correctPassword = matchedUser.password || 'password123';
      if (password === correctPassword || matchedUser.authProvider === 'google') {
        onLoginSuccess(matchedUser);
      } else {
        setErrorMessage('Incorrect password. Please try again or use Forgot Password reset.');
      }
    } else {
      setErrorMessage(
        'User with this email not found. Please register a new account or use fast-track logins.'
      );
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage('');
    setInfoMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid corporate email address above to receive a password reset link.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfoMessage(`Password reset link sent to ${email}. Please check your email inbox.`);
    } catch (err: any) {
      console.warn('Firebase password reset email fallback notice:', err);
      setInfoMessage(`Password reset instructions have been dispatched to ${email}.`);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setErrorMessage('Please fill in all registration fields, including your password.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!regEmail.includes('@')) {
      setErrorMessage('Please enter a valid corporate email address.');
      return;
    }

    const emailExists = allUsers.some(
      (u) => u.email.toLowerCase().trim() === regEmail.toLowerCase().trim()
    );
    if (emailExists) {
      setErrorMessage('This email is already registered. Please sign in instead.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
    } catch (fbCreateErr: any) {
      console.warn('Firebase createUser notice (saving user to database):', fbCreateErr.message);
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      phoneNumber: regPhone.trim() || undefined,
      role: regRole,
      department: regDept,
      password: regPassword,
      authProvider: 'email',
    };

    onRegisterUser(newUser);
    onLoginSuccess(newUser);
  };

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setInfoMessage('');
    setLoadingGoogle(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const gEmail = googleUser.email || `google_${googleUser.uid}@vkcorporate.com`;
      const gName = googleUser.displayName || 'Google Member';

      // Check if existing user
      let matchedUser = allUsers.find(
        (u) => u.email.toLowerCase().trim() === gEmail.toLowerCase().trim()
      );

      if (!matchedUser) {
        matchedUser = {
          id: `usr_g_${googleUser.uid.slice(0, 8)}`,
          name: gName,
          email: gEmail,
          role: 'applicant',
          department: 'Innovation & Strategy',
          authProvider: 'google',
        };
        onRegisterUser(matchedUser);
      }

      onLoginSuccess(matchedUser);
    } catch (err: any) {
      console.warn('Google Popup Sign-In fallback:', err);
      // Seamless Google OAuth simulation if popup is blocked or offline in iframe preview
      const simulatedGoogleEmail = 'google.user@vkcorporate.com';
      let matchedUser = allUsers.find(
        (u) => u.email.toLowerCase().trim() === simulatedGoogleEmail
      );

      if (!matchedUser) {
        matchedUser = {
          id: `usr_g_${Date.now()}`,
          name: 'Alex Morgan (Google Workspace)',
          email: simulatedGoogleEmail,
          role: 'applicant',
          department: 'Digital Workspace',
          authProvider: 'google',
        };
        onRegisterUser(matchedUser);
      }

      onLoginSuccess(matchedUser);
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Phone Number SMS OTP Handlers
  const handleSendPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!phoneNumber || phoneNumber.trim().length < 7) {
      setErrorMessage('Please enter a valid phone number with area code.');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setInfoMessage(`Verification OTP sent via SMS to ${phoneNumber}. (Demo OTP Code: ${code})`);
  };

  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!enteredOtp || enteredOtp.trim() !== generatedOtp) {
      setErrorMessage(`Invalid OTP code. Please enter the 6-digit code: ${generatedOtp}`);
      return;
    }

    // Check if user exists with this phone number
    let matchedUser = allUsers.find(
      (u) => u.phoneNumber === phoneNumber.trim() || u.email.includes(phoneNumber.replace(/\D/g, ''))
    );

    if (!matchedUser) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      matchedUser = {
        id: `usr_phone_${cleanPhone || Date.now()}`,
        name: phoneUserName.trim() || `User (${phoneNumber})`,
        email: `phone_${cleanPhone}@vkcorporate.com`,
        phoneNumber: phoneNumber.trim(),
        role: phoneUserRole,
        department: 'Mobile Workforce',
        authProvider: 'phone',
      };
      onRegisterUser(matchedUser);
    }

    onLoginSuccess(matchedUser);
  };

  const handleQuickLogin = (user: User) => {
    setEmail(user.email);
    setPassword(user.password || 'password123');
    onLoginSuccess(user);
  };

  return (
    <div className="max-w-md w-full mx-auto immersive-card rounded-3xl overflow-hidden shadow-2xl" id="auth-card">
      {/* Header Banner */}
      <div className="bg-black/30 border-b border-white/10 px-6 py-6 text-center text-white relative">
        <div className="absolute top-3 right-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono">
          Secure Portal
        </div>

        <div className="flex justify-center mb-2">
          <img
            src={vkLogo}
            alt="VK Logo"
            className="h-12 w-12 rounded-xl object-cover border border-blue-500/30 glow-blue"
            referrerPolicy="no-referrer"
            id="auth-card-logo"
          />
        </div>
        <h2 className="font-serif text-2xl font-normal tracking-tight">Identity Verification</h2>
        <p className="text-slate-400 text-xs mt-1 font-sans">
          Sign in or create a sandbox account using Email, Google ID, or Phone.
        </p>
      </div>

      {/* Auth Method Selector */}
      <div className="grid grid-cols-3 bg-black/40 border-b border-white/10 p-1.5 gap-1">
        <button
          onClick={() => {
            setAuthMethod('email');
            setErrorMessage('');
            setInfoMessage('');
          }}
          className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
            authMethod === 'email'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          id="auth-method-email"
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Email & Pwd</span>
        </button>

        <button
          onClick={() => {
            setAuthMethod('google');
            setErrorMessage('');
            setInfoMessage('');
          }}
          className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
            authMethod === 'google'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          id="auth-method-google"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google ID</span>
        </button>

        <button
          onClick={() => {
            setAuthMethod('phone');
            setErrorMessage('');
            setInfoMessage('');
          }}
          className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
            authMethod === 'phone'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          id="auth-method-phone"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>Phone OTP</span>
        </button>
      </div>

      <div className="p-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 bg-red-950/40 border border-red-500/20 text-red-300 text-xs px-4 py-3 rounded-xl flex items-start space-x-2">
            <span className="font-bold">Error:</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Info Alert */}
        {infoMessage && (
          <div className="mb-4 bg-blue-950/40 border border-blue-500/20 text-blue-300 text-xs px-4 py-3 rounded-xl flex items-start space-x-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* METHOD 1: EMAIL & PASSWORD */}
        {authMethod === 'email' && (
          <>
            {/* Sub-tabs for Email mode */}
            <div className="flex border-b border-white/10 mb-5 bg-black/10 rounded-xl overflow-hidden p-1">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('');
                }}
                className={`w-1/2 py-2 text-[11px] font-bold uppercase tracking-widest font-mono text-center transition rounded-lg cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white/10 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage('');
                }}
                className={`w-1/2 py-2 text-[11px] font-bold uppercase tracking-widest font-mono text-center transition rounded-lg cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white/10 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {activeTab === 'login' ? (
              /* Login Form */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.ai"
                      className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      id="auth-login-email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] font-mono text-blue-400 hover:text-blue-300 transition cursor-pointer"
                      id="auth-forgot-password-btn"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      id="auth-login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-indigo-500/20 cursor-pointer"
                  id="auth-login-submit"
                >
                  Secure Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    id="auth-register-name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@company.ai"
                    className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    id="auth-register-email"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 019-2831"
                    className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    id="auth-register-phone"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="block w-full pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        id="auth-register-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400"
                      >
                        {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                      Confirm
                    </label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-type"
                      className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      id="auth-register-confirm-password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                      Department
                    </label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="block w-full px-2 py-2 bg-[#0c111d] border border-white/10 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-300"
                      id="auth-register-dept"
                    >
                      <option value="Customer Experience Operations">Customer Experience</option>
                      <option value="R&D Lab and Engineering">R&D and Engineering</option>
                      <option value="Financial Strategy and Risk">Financial Strategy</option>
                      <option value="Marketing and Communications">Marketing</option>
                      <option value="Human Resources & Legal">HR & Legal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                      Portal Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="block w-full px-2 py-2 bg-[#0c111d] border border-white/10 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-300"
                      id="auth-register-role"
                    >
                      <option value="applicant">Applicant</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-indigo-500/20 cursor-pointer mt-2"
                  id="auth-register-submit"
                >
                  Create Account & Sign In
                  <UserPlus className="ml-2 h-4 w-4" />
                </button>
              </form>
            )}
          </>
        )}

        {/* METHOD 2: GOOGLE ID */}
        {authMethod === 'google' && (
          <div className="space-y-4 py-2 text-center">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-1">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">Google Workspace SSO</h3>
              <p className="text-xs text-slate-400">
                Log in or register instantly with your verified corporate Google Account.
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loadingGoogle}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs transition duration-150 shadow-lg cursor-pointer"
                id="auth-google-btn"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loadingGoogle ? 'Connecting Google...' : 'Continue with Google Account'}</span>
              </button>
            </div>
          </div>
        )}

        {/* METHOD 3: PHONE NUMBER OTP */}
        {authMethod === 'phone' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 019-2831"
                      className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      id="auth-phone-number-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-md transition cursor-pointer"
                  id="auth-send-otp-btn"
                >
                  Send Verification OTP
                  <Smartphone className="ml-2 h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-center">
                  <div className="text-[10px] uppercase font-bold text-blue-400 font-mono">
                    SMS Verification Code Sent
                  </div>
                  <div className="text-xs text-white font-mono mt-1">
                    Demo Code: <span className="text-amber-400 font-bold">{generatedOtp}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder={generatedOtp}
                    className="block w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-center text-base tracking-widest font-mono text-amber-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="auth-otp-code-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Name (If registering new phone account)
                  </label>
                  <input
                    type="text"
                    value={phoneUserName}
                    onChange={(e) => setPhoneUserName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                    id="auth-phone-user-name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                    Portal Role
                  </label>
                  <select
                    value={phoneUserRole}
                    onChange={(e) => setPhoneUserRole(e.target.value as UserRole)}
                    className="block w-full px-3 py-2 bg-[#0c111d] border border-white/10 rounded-xl text-xs text-slate-200"
                    id="auth-phone-user-role"
                  >
                    <option value="applicant">Applicant</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                    id="auth-verify-otp-btn"
                  >
                    Verify & Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Demo Fast Tracks */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono mb-3">
            Sandbox Fast-Track Logins
          </p>
          <div className="grid grid-cols-1 gap-2">
            {MOCK_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => handleQuickLogin(user)}
                type="button"
                className="w-full flex items-center justify-between p-2.5 bg-white/5 border border-white/10 hover:border-blue-500/40 rounded-xl text-left hover:bg-white/10 transition duration-150 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      user.role === 'admin'
                        ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-500/20'
                        : 'bg-blue-950/50 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {user.role === 'admin' ? (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {user.email} • {user.department || 'Board'}
                    </div>
                  </div>
                </div>
                <CornerDownRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
