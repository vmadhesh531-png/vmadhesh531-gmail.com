/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles, FileText, BarChart3, ChevronRight, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import vkLogo from '../assets/images/vk_logo_1782802966591.jpg';

interface LandingPageProps {
  onGetStarted: (role?: 'applicant' | 'admin') => void;
  isLoggedIn: boolean;
  currentUserRole?: 'applicant' | 'admin';
}

export default function LandingPage({ onGetStarted, isLoggedIn, currentUserRole }: LandingPageProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col" id="landing-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-white/10">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          {/* Logo Hero */}
          <div className="flex justify-center mb-6">
            <img
              src={vkLogo}
              alt="VK Logo"
              className="h-24 w-24 rounded-3xl object-cover shadow-2xl border border-blue-500/30 glow-blue"
              referrerPolicy="no-referrer"
              id="landing-logo-hero"
            />
          </div>

          {/* Header Tag */}
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-400 font-medium text-[11px] mb-8 animate-fade-in font-mono uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-sans">AI-driven Enterprise Advancement Fund 2026</span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-white tracking-tight leading-none mb-8">
            VK Corporate <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent font-medium">
              Submission Portal
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-sans leading-relaxed mb-12">
            Submit your advanced AI proposal, track feasibility reviews in real-time, and collaborate with the Governance Board to unlock developmental funding and server infrastructure.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 max-w-lg mx-auto">
            {isLoggedIn ? (
              <button
                onClick={() => onGetStarted(currentUserRole)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/20 glow-indigo transition duration-150 group cursor-pointer"
                id="landing-cta-dashboard"
              >
                Go to Your Dashboard
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onGetStarted('applicant')}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/20 glow-indigo transition duration-150 group cursor-pointer"
                  id="landing-cta-applicant"
                >
                  Applicant Portal
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => onGetStarted('admin')}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-sm font-semibold rounded-xl text-white bg-white/5 hover:bg-white/10 border border-white/10 transition duration-150 cursor-pointer"
                  id="landing-cta-admin"
                >
                  <ShieldCheck className="mr-2 h-4.5 w-4.5 text-blue-400" />
                  Review Console (Admin)
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="immersive-card rounded-2xl p-6 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Fund Allocation Pool</p>
              <h3 className="text-3xl font-normal text-white font-serif">$2.5M USD</h3>
              <p className="text-xs text-slate-400 mt-2 font-mono">Available for corporate AI deployment grants</p>
            </div>
            <div className="immersive-card rounded-2xl p-6 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">SLA Review Timeline</p>
              <h3 className="text-3xl font-normal text-blue-400 font-serif">7 Days</h3>
              <p className="text-xs text-slate-400 mt-2 font-mono">Maximum timeline from submission to final decision</p>
            </div>
            <div className="immersive-card rounded-2xl p-6 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Success Deployment Rate</p>
              <h3 className="text-3xl font-normal text-white font-serif">74.5%</h3>
              <p className="text-xs text-slate-400 mt-2 font-mono">Approved projects reaching final production MVP</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Split Section */}
      <section className="py-20 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-normal text-white tracking-tight">How the Portal Operates</h2>
            <p className="text-sm text-slate-400 mt-3 font-sans">Accelerating proposal review with transparent progress tracking, alignment assessment, and structural review history.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col space-y-4 p-6 rounded-2xl immersive-card immersive-card-hover transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold">1</div>
              <div>
                <h3 className="text-base font-medium text-white flex items-center">
                  <FileText className="h-4.5 w-4.5 mr-2 text-blue-400" />
                  Define Proposal details
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Provide fundamental details of your proposed artificial intelligence project, including budget breakdown, direct team size requirements, AI modeling category, and key deliverables.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col space-y-4 p-6 rounded-2xl immersive-card immersive-card-hover transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold">2</div>
              <div>
                <h3 className="text-base font-medium text-white flex items-center">
                  <BarChart3 className="h-4.5 w-4.5 mr-2 text-blue-400" />
                  Transparent Progress Tracking
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Track your proposal stage interactively as it migrates from initial Submission, through technical security assessment and Governance board committee voting, up to final approval.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col space-y-4 p-6 rounded-2xl immersive-card immersive-card-hover transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold">3</div>
              <div>
                <h3 className="text-base font-medium text-white flex items-center">
                  <CheckCircle2 className="h-4.5 w-4.5 mr-2 text-blue-400" />
                  Administrative Review Log
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Review absolute decision histories. Board members submit direct commentary and requests for revisions, fully cataloged chronologically for perfect governance compliance.
                </p>
              </div>
            </div>
          </div>

          {/* Quick FAQ / Guide */}
          <div className="mt-20 rounded-2xl immersive-card p-6 md:p-8">
            <h3 className="font-serif text-xl font-normal text-white flex items-center mb-6">
              <HelpCircle className="h-5 w-5 mr-2 text-blue-400" />
              Submission Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-300 leading-relaxed">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-blue-400 mb-1">Who can apply?</p>
                  <p className="text-slate-400">Any corporate department lead or technology manager looking to deploy AI systems to reduce operational costs or improve experience parameters.</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-400 mb-1">What budget restrictions apply?</p>
                  <p className="text-slate-400">Grants generally range between $10k and $150k. Higher requirements need special authorization from corporate treasury.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-blue-400 mb-1">How long does review take?</p>
                  <p className="text-slate-400">Initial assessment is completed in 48 hours. Governance board decisions are released within 7 business days max.</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-400 mb-1">Can I revise submitted forms?</p>
                  <p className="text-slate-400">If reviewed with a "Technical Review" status, applicants can incorporate requested notes and administrative feedback for immediate re-assessment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black/40 text-slate-500 py-8 border-t border-white/5 text-center text-[10px] font-mono tracking-widest">
        <p>© 2026 VK CORPORATE SUBMISSION PORTAL. ALL INTERNAL RIGHTS RESERVED. SECURITY CLASSIFICATION: RESTRICTED.</p>
      </footer>
    </div>
  );
}
