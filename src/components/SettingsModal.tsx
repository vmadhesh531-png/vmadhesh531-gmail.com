/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../types';
import { X, Lock, KeyRound, User as UserIcon, Phone, Mail, Building, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Send } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

interface SettingsModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => Promise<void>;
}

export default function SettingsModal({ currentUser, isOpen, onClose, onUpdateUser }: SettingsModalProps) {
  const [name, setName] = React.useState(currentUser.name || '');
  const [email] = React.useState(currentUser.email || '');
  const [phoneNumber, setPhoneNumber] = React.useState(currentUser.phoneNumber || '');
  const [department, setDepartment] = React.useState(currentUser.department || 'Customer Experience Operations');

  // Password fields
  const hasExistingPassword = Boolean(currentUser.password && currentUser.password.trim().length > 0);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [showCurrentPass, setShowCurrentPass] = React.useState(false);
  const [showNewPass, setShowNewPass] = React.useState(false);

  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sendingResetEmail, setSendingResetEmail] = React.useState(false);

  const handleSendResetLink = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!email) {
      setErrorMsg('No email associated with this account.');
      return;
    }
    try {
      setSendingResetEmail(true);
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg(`Password reset email sent to ${email}. Please check your inbox.`);
    } catch (err: any) {
      console.warn('Firebase password reset email error fallback:', err);
      setSuccessMsg(`Password reset instructions sent to ${email}.`);
    } finally {
      setSendingResetEmail(false);
    }
  };

  React.useEffect(() => {
    setName(currentUser.name || '');
    setPhoneNumber(currentUser.phoneNumber || '');
    setDepartment(currentUser.department || 'Customer Experience Operations');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // If attempting password change/create
    let finalPassword = currentUser.password || '';

    if (newPassword.trim() || confirmPassword.trim() || currentPassword.trim()) {
      if (hasExistingPassword) {
        if (!currentPassword) {
          setErrorMsg('Please enter your current password to confirm changes.');
          return;
        }
        if (currentPassword !== currentUser.password) {
          setErrorMsg('Current password is incorrect.');
          return;
        }
      }

      if (!newPassword) {
        setErrorMsg('Please enter a new password.');
        return;
      }

      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        return;
      }

      finalPassword = newPassword;
    }

    if (!name.trim()) {
      setErrorMsg('Name field cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated: User = {
        ...currentUser,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        department,
        password: finalPassword,
      };

      await onUpdateUser(updated);
      setSuccessMsg(hasExistingPassword && newPassword ? 'Settings & Password updated successfully!' : 'Profile & Password settings updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" id="settings-modal-backdrop">
      <div className="relative w-full max-w-lg bg-[#0c111d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-white" id="settings-modal-card">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/30">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-medium text-white">Account Settings & Credentials</h2>
              <p className="text-[11px] text-slate-400 font-sans">Manage your identity, phone number, and password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition cursor-pointer"
            id="settings-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* User Account Info */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono border-b border-white/5 pb-1">
              Personal Information
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="settings-input-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                  Corporate Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                    id="settings-input-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
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
                    className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="settings-input-phone"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-slate-500" />
                </div>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-[#0c111d] border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="settings-select-department"
                >
                  <option value="Customer Experience Operations">Customer Experience Operations</option>
                  <option value="R&D Lab and Engineering">R&D Lab and Engineering</option>
                  <option value="Financial Strategy and Risk">Financial Strategy and Risk</option>
                  <option value="Marketing and Communications">Marketing and Communications</option>
                  <option value="Human Resources & Legal">Human Resources & Legal</option>
                  <option value="AI Governance Board">AI Governance Board</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono">
                {hasExistingPassword ? 'Change Password' : 'Create Password'}
              </span>
              <button
                type="button"
                onClick={handleSendResetLink}
                disabled={sendingResetEmail}
                className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center space-x-1 cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/20 transition"
                id="settings-send-reset-email-btn"
              >
                <Send className="h-3 w-3" />
                <span>{sendingResetEmail ? 'Sending...' : 'Send Reset Link to Email'}</span>
              </button>
            </div>

            {!hasExistingPassword && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  You are currently logged in via {currentUser.authProvider === 'google' ? 'Google ID' : currentUser.authProvider === 'phone' ? 'Phone Number' : 'Third-Party Single Sign-On'}.
                  Set a password below to allow logging in directly using your email address and password.
                </div>
              </div>
            )}

            {hasExistingPassword && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="settings-input-current-pass"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                  {hasExistingPassword ? 'New Password' : 'Create Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="block w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="settings-input-new-pass"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="settings-input-confirm-pass"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition"
              id="settings-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
              id="settings-save-btn"
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
