/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../types';
import { LogOut, ShieldCheck, UserCheck, RefreshCw, Sparkles, Sun, Moon, Settings } from 'lucide-react';
import vkLogo from '../assets/images/vk_logo_1782802966591.jpg';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser: (userId: string) => void;
  allUsers: User[];
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
}

export default function Navbar({ currentUser, onLogout, onSwitchUser, allUsers, theme = 'dark', onToggleTheme, onOpenSettings }: NavbarProps) {
  const [showSwitchDropdown, setShowSwitchDropdown] = React.useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-[#050608]/80 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="relative h-10 w-10 flex-shrink-0">
              <img
                src={vkLogo}
                alt="VK Logo"
                className="h-10 w-10 rounded-xl object-cover shadow-md border border-blue-500/30 glow-blue"
                referrerPolicy="no-referrer"
                id="nav-logo-img"
              />
            </div>
            <div>
              <span className="font-serif font-semibold text-lg text-white tracking-tight block">
                VK Corporate
              </span>
              <span className="font-mono text-[9px] text-blue-400 tracking-widest font-semibold uppercase block -mt-1">
                Submission Portal
              </span>
            </div>
          </div>

          {/* User Section & Dynamic Role Quick Switcher */}
          {currentUser ? (
            <div className="flex items-center space-x-4">
              {/* Quick Switch Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-lg text-xs font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Simulate switching between different roles easily"
                  id="navbar-role-switcher"
                >
                  <RefreshCw className="h-3 w-3 animate-spin-slow text-blue-400 mr-1" />
                  <span>Simulate: </span>
                  <span className="font-semibold text-white capitalize">
                    {currentUser.role === 'admin' ? 'Admin' : 'Applicant'}
                  </span>
                </button>

                {showSwitchDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0c111d] border border-white/10 shadow-2xl py-1 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">
                        Switch Identity
                      </p>
                    </div>
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user.id);
                          setShowSwitchDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 flex items-center justify-between transition-colors ${
                          currentUser.id === user.id
                            ? 'bg-blue-500/10 text-blue-400 font-semibold'
                            : 'text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
                        </div>
                        {user.role === 'admin' ? (
                          <span className="bg-white/5 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex items-center border border-white/5">
                            <ShieldCheck className="h-2.5 w-2.5 mr-0.5 text-indigo-400" />
                            Admin
                          </span>
                        ) : (
                          <span className="bg-white/5 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex items-center border border-white/5">
                            <UserCheck className="h-2.5 w-2.5 mr-0.5 text-blue-400" />
                            Applicant
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Metadata */}
              <div className="hidden md:flex items-center space-x-3 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white flex items-center justify-end">
                    {currentUser.name}
                    {currentUser.role === 'admin' && (
                      <Sparkles className="h-3 w-3 ml-1 text-blue-400 animate-pulse" />
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {currentUser.department || 'Corporate Member'}
                  </div>
                </div>

                <div className="h-8 w-px bg-white/10"></div>

                {currentUser.role === 'admin' ? (
                  <span className="bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">
                    Governance
                  </span>
                ) : (
                  <span className="bg-blue-950/40 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">
                    Applicant
                  </span>
                )}
              </div>

              {/* Theme Toggle Button */}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition duration-150 flex items-center space-x-1 text-xs font-medium cursor-pointer"
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                  id="navbar-theme-toggle-btn"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-400" />
                      <span className="hidden sm:inline text-[11px] font-mono">Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-400" />
                      <span className="hidden sm:inline text-[11px] font-mono">Dark</span>
                    </>
                  )}
                </button>
              )}

              {/* Settings Button */}
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition duration-150 flex items-center space-x-1 text-xs font-medium cursor-pointer"
                  title="Account Settings & Password"
                  id="navbar-settings-btn"
                >
                  <Settings className="h-4 w-4 text-blue-400" />
                  <span className="hidden sm:inline text-[11px] font-mono">Settings</span>
                </button>
              )}

              {/* Log Out */}
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition duration-150 cursor-pointer"
                title="Log Out"
                id="navbar-logout-btn"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {/* Theme Toggle for logged out */}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition duration-150 flex items-center space-x-1 text-xs font-medium cursor-pointer"
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                  id="navbar-theme-toggle-loggedout-btn"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-400" />
                      <span className="hidden sm:inline text-[11px] font-mono">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-400" />
                      <span className="hidden sm:inline text-[11px] font-mono">Dark Mode</span>
                    </>
                  )}
                </button>
              )}
              <span className="font-mono text-xs text-slate-500 hidden sm:inline">
                Secure Enterprise Portal
              </span>
              <div className="h-4 w-px bg-white/10 hidden sm:inline"></div>
              <span className="bg-white/5 text-slate-300 border border-white/10 px-2.5 py-1 rounded-md text-[9px] font-semibold tracking-wider uppercase font-mono">
                v1.2.0
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
