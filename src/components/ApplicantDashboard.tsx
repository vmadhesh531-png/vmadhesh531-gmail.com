/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Application, ApplicationStatus, User } from '../types';
import { 
  FileText, Plus, HelpCircle, Search, Calendar, DollarSign, Users, 
  Sparkles, CheckCircle2, Clock, AlertCircle, Ban, ArrowRight, CornerRightDown, 
  MessageSquare, UserCircle, ChevronRight, FileSpreadsheet, Paperclip, Download,
  ArrowUpDown
} from 'lucide-react';

interface ApplicantDashboardProps {
  currentUser: User;
  applications: Application[];
  onOpenNewForm: () => void;
}

export default function ApplicantDashboard({ currentUser, applications = [], onOpenNewForm }: ApplicantDashboardProps) {
  const [selectedAppId, setSelectedAppId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('All');

  // Filter applications belonging to current user
  const userApps = React.useMemo(() => {
    return applications.filter((app) => app.applicantId === currentUser.id);
  }, [applications, currentUser.id]);

  // Search filtered user apps
  const searchedApps = React.useMemo(() => {
    return userApps.filter((app) => {
      const matchesSearch =
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.priority && app.priority.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [userApps, searchQuery, statusFilter]);

  // Handle selected app logic
  const activeApp = React.useMemo(() => {
    if (searchedApps.length === 0) return null;
    if (selectedAppId) {
      const found = searchedApps.find((app) => app.id === selectedAppId);
      if (found) return found;
    }
    return searchedApps[0]; // default to first
  }, [searchedApps, selectedAppId]);

  // Set default selected application
  React.useEffect(() => {
    if (userApps.length > 0 && !selectedAppId) {
      setSelectedAppId(userApps[0].id);
    }
  }, [userApps, selectedAppId]);

  // Metrics calculation
  const metrics = React.useMemo(() => {
    return {
      total: userApps.length,
      approved: userApps.filter((app) => app.status === 'Approved').length,
      reviewing: userApps.filter((app) => ['Under Review', 'Technical Review'].includes(app.status)).length,
      pending: userApps.filter((app) => app.status === 'Submitted').length,
    };
  }, [userApps]);

  // Chart data calculation for status distribution ring chart
  const chartData = React.useMemo(() => {
    const statuses: { name: ApplicationStatus; color: string }[] = [
      { name: 'Submitted', color: '#3b82f6' },
      { name: 'Under Review', color: '#6366f1' },
      { name: 'Technical Review', color: '#f59e0b' },
      { name: 'Approved', color: '#10b981' },
      { name: 'Rejected', color: '#f43f5e' },
    ];
    
    return statuses
      .map((status) => {
        const count = userApps.filter((app) => app.status === status.name).length;
        return {
          name: status.name,
          value: count,
          color: status.color,
        };
      })
      .filter((item) => item.value > 0);
  }, [userApps]);

  // Helper to color badge according to application status
  const getStatusStyle = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
        return { bg: 'bg-emerald-950/50 text-emerald-300 ring-emerald-500/30', icon: CheckCircle2, text: 'Approved', color: 'emerald' };
      case 'Rejected':
        return { bg: 'bg-rose-950/50 text-rose-300 ring-rose-500/30', icon: Ban, text: 'Rejected', color: 'rose' };
      case 'Technical Review':
        return { bg: 'bg-amber-950/50 text-amber-300 ring-amber-500/30', icon: AlertCircle, text: 'Technical Review', color: 'amber' };
      case 'Under Review':
        return { bg: 'bg-indigo-950/50 text-indigo-300 ring-indigo-500/30', icon: Clock, text: 'Under Review', color: 'indigo' };
      default:
        return { bg: 'bg-blue-950/50 text-blue-300 ring-blue-500/30', icon: FileText, text: 'Submitted', color: 'blue' };
    }
  };

  // Build sequential stages of application tracking
  const getTrackingStages = (app: Application) => {
    const isApproved = app.status === 'Approved';
    const isRejected = app.status === 'Rejected';
    
    // Stages array with title, description, and state
    const stages: {
      key: ApplicationStatus;
      title: string;
      desc: string;
      state: 'completed' | 'active' | 'pending' | 'failed';
    }[] = [
      {
        key: 'Submitted',
        title: '01. Proposal Submitted',
        desc: 'Fundamental details registered and secured.',
        state: 'completed', // always completed if it exists
      },
      {
        key: 'Under Review',
        title: '02. Board Feasibility',
        desc: 'Reviewing strategic relevance and departmental ROI alignment.',
        state: 
          app.status === 'Submitted' 
            ? 'active' 
            : ['Under Review', 'Technical Review', 'Approved', 'Rejected'].includes(app.status)
            ? 'completed'
            : 'pending',
      },
      {
        key: 'Technical Review',
        title: '03. Architecture Review',
        desc: 'Assessing engineering viability, GPU server loads, and data privacy.',
        state:
          app.status === 'Under Review'
            ? 'active'
            : app.status === 'Technical Review'
            ? 'active' // technically active/needs input
            : ['Approved', 'Rejected'].includes(app.status)
            ? 'completed'
            : 'pending',
      },
      {
        key: isRejected ? 'Rejected' : 'Approved',
        title: isRejected ? '04. Proposal Declined' : '04. Funding Approved',
        desc: isRejected 
          ? 'Project does not align with active strategic directions.' 
          : 'Corporate grant authorized. Development kickoff initiated.',
        state:
          isApproved 
            ? 'completed' 
            : isRejected 
            ? 'failed' 
            : 'pending',
      },
    ];

    return stages;
  };

  const getProgressPercent = (status: ApplicationStatus) => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Under Review':
        return 33;
      case 'Technical Review':
        return 66;
      case 'Approved':
      case 'Rejected':
        return 100;
      default:
        return 0;
    }
  };

  const exportToCSV = () => {
    if (userApps.length === 0) return;

    // Define CSV headers
    const headers = [
      'Proposal ID',
      'Title',
      'Category',
      'Budget ($)',
      'Estimated ROI (%)',
      'Department',
      'Status',
      'Submitted Date',
      'Executive Summary'
    ];

    // Map user applications to CSV rows, escaping double quotes properly
    const rows = userApps.map((app) => [
      app.id,
      `"${app.title.replace(/"/g, '""')}"`,
      `"${app.category.replace(/"/g, '""')}"`,
      app.budget,
      app.estimatedROI,
      `"${app.department.replace(/"/g, '""')}"`,
      app.status,
      new Date(app.submittedAt).toLocaleDateString(),
      `"${(app.summary || '').replace(/"/g, '""')}"`
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentUser.name.replace(/\s+/g, '_')}_Proposals_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="applicant-dashboard">
      {/* Welcome Banner */}
      <div className="immersive-card rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl opacity-40 -mr-10 -mt-10"></div>
        <div>
          <span className="font-mono text-xs text-blue-400 font-bold uppercase tracking-widest block mb-1.5">Applicant Workspace</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white tracking-tight">
            Welcome Back, {currentUser.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Department: <span className="font-semibold text-slate-300">{currentUser.department}</span> • Secure SSO Session ID: CS-4890
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={exportToCSV}
            disabled={userApps.length === 0}
            className="inline-flex items-center justify-center space-x-2 px-4 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 disabled:opacity-50 disabled:pointer-events-none rounded-xl text-xs font-bold transition cursor-pointer"
            id="applicant-btn-export-csv"
            title="Export history to CSV"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenNewForm}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 glow-indigo transition group cursor-pointer"
            id="applicant-btn-new-proposal"
          >
            <Plus className="h-4 w-4" />
            <span>New AI Proposal</span>
          </button>
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="immersive-card rounded-2xl p-5 mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border border-white/5 bg-slate-900/40 backdrop-blur-sm" id="top-search-filter-bar">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search proposals by title, status keyword, category, or priority..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-150"
            id="top-search-proposals"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-[10px] font-bold font-mono text-slate-400 hover:text-white transition uppercase tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono shrink-0">
            Quick Status:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['All', 'Submitted', 'Under Review', 'Technical Review', 'Approved', 'Rejected'].map((status) => {
              const isSelected = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase font-bold border transition duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                  }`}
                  id={`top-filter-status-${status.toLowerCase().replace(' ', '-')}`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Statistics & Ring Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Metric Cards (Left side, takes 8 columns on large screens) */}
        <div className="lg:col-span-8 grid grid-cols-2 gap-4">
          <div className="immersive-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Total Submissions</p>
              <p className="text-3xl font-normal text-white mt-2 font-serif">{metrics.total}</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-4">All registered AI ideas</p>
          </div>
          <div className="immersive-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Approved Funding</p>
              <p className="text-3xl font-normal text-emerald-400 mt-2 font-serif">{metrics.approved}</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-4">Funding secured</p>
          </div>
          <div className="immersive-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Actively Reviewing</p>
              <p className="text-3xl font-normal text-indigo-400 mt-2 font-serif">{metrics.reviewing}</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-4">In board & architecture review</p>
          </div>
          <div className="immersive-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Awaiting Board Triaging</p>
              <p className="text-3xl font-normal text-blue-400 mt-2 font-serif">{metrics.pending}</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-4">Newly registered submissions</p>
          </div>
        </div>

        {/* Ring Chart Card (Right side, takes 4 columns on large screens) */}
        <div className="lg:col-span-4 immersive-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Status Distribution</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Real-time tracking visualizer</p>
          </div>
          
          <div className="h-[140px] w-full flex items-center justify-center my-2 relative">
            {/* If there are no applications, show a friendly placeholder */}
            {userApps.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {userApps.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-serif font-normal text-white">{userApps.length}</span>
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Total</span>
              </div>
            )}
          </div>

          {/* Mini Legend */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] font-mono font-bold uppercase mt-1">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400">{item.name}</span>
                <span className="text-slate-500">({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Sidebar / Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Submissions List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="immersive-card rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-3">Submitted Proposals</h3>
            
            {/* Search Input & Status Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by title, status, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="search-proposals"
                />
              </div>
              
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                  Filter by Status
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Submitted', 'Under Review', 'Technical Review', 'Approved', 'Rejected'].map((status) => {
                    const isSelected = statusFilter === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`px-2 py-1 rounded text-[9px] font-mono uppercase font-bold border transition duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300'
                        }`}
                        id={`filter-status-${status.toLowerCase().replace(' ', '-')}`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List */}
            {searchedApps.length > 0 ? (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {searchedApps.map((app, idx) => {
                    const statusStyle = getStatusStyle(app.status);
                    const StatusIcon = statusStyle.icon;
                    const isSelected = activeApp?.id === app.id;

                    return (
                      <motion.button
                        key={`${app.id}-${idx}`}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.95, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.2 }}
                        layout
                        onClick={() => setSelectedAppId(app.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col space-y-2 cursor-pointer ${
                          isSelected 
                            ? 'border-blue-500/50 bg-blue-500/10 shadow-sm shadow-blue-500/10' 
                            : 'border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10'
                        }`}
                        style={{ originX: 0.5 }}
                      >
                        <div className="flex justify-between items-start gap-2 w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                              {app.id}
                            </span>
                            {app.priority && (
                              <span className={`px-1 py-0.2 rounded text-[8px] font-bold uppercase border ${
                                app.priority === 'High' 
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                  : app.priority === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {app.priority}
                              </span>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-white/5 ${statusStyle.bg}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {statusStyle.text}
                          </span>
                        </div>

                        <h4 className={`text-xs font-medium leading-snug line-clamp-2 ${isSelected ? 'text-white font-bold' : 'text-slate-300'}`}>
                          {app.title}
                        </h4>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-white/5 pt-1.5 mt-1">
                          <span>{app.category.split(' & ')[0]}</span>
                          <span>${app.budget.toLocaleString()}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-white/5">
                <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No proposals found</p>
                <p className="text-[10px] text-slate-500 mt-1">Submit your first AI initiative to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Content: Selected Proposal Details & Tracking */}
        <div className="lg:col-span-2 space-y-6">
          {activeApp ? (
            <div className="immersive-card rounded-3xl p-6 md:p-8 space-y-8">
              {/* Header Details */}
              <div className="border-b border-white/10 pb-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 font-mono tracking-wider uppercase block mb-1">
                      {activeApp.id} • Submitted on {new Date(activeApp.submittedAt).toLocaleDateString()}
                    </span>
                    <h3 className="font-serif text-xl md:text-2xl font-normal text-white leading-tight">
                      {activeApp.title}
                    </h3>
                  </div>
                  
                  {/* Big Status Display */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center space-x-3">
                    <div className={`p-2 rounded-xl text-black ${
                      activeApp.status === 'Approved' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/20' :
                      activeApp.status === 'Rejected' ? 'bg-rose-400 shadow-sm shadow-rose-400/20' :
                      activeApp.status === 'Technical Review' ? 'bg-amber-400 shadow-sm shadow-amber-400/20' :
                      activeApp.status === 'Under Review' ? 'bg-indigo-400 shadow-sm shadow-indigo-400/20' : 'bg-blue-400 shadow-sm shadow-blue-400/20'
                    }`}>
                      {React.createElement(getStatusStyle(activeApp.status).icon, { className: 'h-5 w-5 text-black' })}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Current Stage</p>
                      <p className="text-xs font-extrabold text-white uppercase tracking-wide">
                        {getStatusStyle(activeApp.status).text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STAGE-OF-THE-ART APPLICATION PROGRESS TRACKING TIMELINE */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-6 flex items-center">
                  <Clock className="h-4 w-4 mr-1.5 text-orange-400" />
                  Application Progress Tracking
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                  {/* Background Linking Line for desktop */}
                  <div className="absolute top-[21px] left-10 right-10 h-0.5 bg-white/5 hidden md:block z-0 overflow-hidden rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 via-indigo-500 to-emerald-500 transition-all duration-1000 ease-out"
                      style={{ width: `${getProgressPercent(activeApp.status)}%` }}
                    />
                  </div>

                  {/* Background Linking Line for mobile */}
                  <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-white/5 md:hidden z-0 overflow-hidden rounded-full">
                    <div 
                      className="w-full bg-gradient-to-b from-orange-500 via-indigo-500 to-emerald-500 transition-all duration-1000 ease-out"
                      style={{ height: `${getProgressPercent(activeApp.status)}%` }}
                    />
                  </div>

                  {getTrackingStages(activeApp).map((stage, idx) => {
                    let circleColor = 'border-white/10 bg-white/5 text-slate-500';
                    let titleColor = 'text-slate-500 font-medium';
                    let descColor = 'text-slate-500';

                    if (stage.state === 'completed') {
                      circleColor = 'border-orange-500 bg-orange-950/40 text-orange-400 ring-4 ring-orange-500/10 z-10';
                      titleColor = 'text-slate-200 font-semibold';
                      descColor = 'text-slate-400';
                    } else if (stage.state === 'active') {
                      circleColor = 'border-indigo-500 bg-indigo-950/40 text-indigo-400 ring-4 ring-indigo-500/10 animate-pulse z-10';
                      titleColor = 'text-indigo-300 font-bold';
                      descColor = 'text-slate-300';
                    } else if (stage.state === 'failed') {
                      circleColor = 'border-rose-500 bg-rose-950/40 text-rose-400 ring-4 ring-rose-500/10 z-10';
                      titleColor = 'text-rose-400 font-bold';
                      descColor = 'text-slate-400';
                    }

                    return (
                      <div key={idx} className="flex md:flex-col items-start gap-4 md:gap-0 relative z-10 text-left">
                        {/* Circle */}
                        <div className={`h-11 w-11 rounded-full border-2 flex items-center justify-center shrink-0 md:mb-3 transition-all ${circleColor}`}>
                          {stage.state === 'completed' && <CheckCircle2 className="h-5 w-5" />}
                          {stage.state === 'active' && (
                            activeApp.status === 'Technical Review' && stage.key === 'Technical Review' ? (
                              <AlertCircle className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )
                          )}
                          {stage.state === 'failed' && <Ban className="h-5 w-5" />}
                          {stage.state === 'pending' && <span className="text-xs font-mono font-bold">{idx + 1}</span>}
                        </div>

                        {/* Text */}
                        <div>
                          <h5 className={`text-xs md:text-xs leading-tight ${titleColor}`}>
                            {stage.title}
                          </h5>
                          <p className={`text-[10px] leading-relaxed mt-1 ${descColor}`}>
                            {stage.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Proposal Contents Grid */}
              <div className="border-t border-white/10 pt-8 space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400">
                  Proposal Content Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-orange-400 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Grant Budget</p>
                      <p className="text-sm font-bold text-white">${activeApp.budget.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 flex items-center space-x-3">
                    <Users className="h-5 w-5 text-orange-400 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Team size</p>
                      <p className="text-sm font-bold text-white">{activeApp.teamSize} Headcount</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-orange-400 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Timeline</p>
                      <p className="text-sm font-bold text-white truncate" title={activeApp.timeline}>
                        {activeApp.timeline.split(' (')[0]}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 flex items-center space-x-3">
                    <AlertCircle className={`h-5 w-5 shrink-0 ${
                      activeApp.priority === 'High' ? 'text-rose-400' :
                      activeApp.priority === 'Medium' ? 'text-amber-400' : 'text-blue-400'
                    }`} />
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Proposal Priority</p>
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        activeApp.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        activeApp.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {activeApp.priority || 'Medium'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-semibold text-white mb-1">Department Scope & Category</h5>
                    <p className="text-slate-300">
                      Proposed by <span className="font-medium text-white">{activeApp.applicantName}</span> from the <span className="font-medium text-white">{activeApp.department}</span> division in the <span className="font-semibold text-orange-400">{activeApp.category}</span> technology space.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-white mb-1">Bottleneck Statement</h5>
                    <p className="text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{activeApp.description}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-white mb-1">Proposed AI Technology</h5>
                    <p className="text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{activeApp.proposedSolution}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-white mb-1">Expected ROI / Impact</h5>
                    <p className="text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{activeApp.expectedImpact}</p>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              {activeApp.attachments && activeApp.attachments.length > 0 && (
                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-3 flex items-center">
                    <Paperclip className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Attached Supporting Files ({activeApp.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeApp.attachments.map((file, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <FileText className="h-5 w-5 text-orange-400 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-xs font-medium text-white truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{file.size} • {file.type.split('/')[1] || 'attached'}</p>
                          </div>
                        </div>
                        <a
                          href={`/api/download/${encodeURIComponent(file.name)}`}
                          download={file.name}
                          className="inline-flex items-center space-x-1 text-[9px] font-mono text-orange-400 hover:text-orange-300 bg-white/5 hover:bg-white/10 px-2 py-1 rounded uppercase border border-white/5 cursor-pointer transition"
                          title="Download Document"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Administrative Review History Logs */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-4 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1.5 text-slate-400" />
                  Administrative Review & Governance History
                </h4>

                <div className="space-y-4">
                  {activeApp.reviewHistory && activeApp.reviewHistory.length > 0 ? (
                    activeApp.reviewHistory.map((history, idx) => {
                      const isInitial = history.statusFrom === 'None';
                      
                      return (
                        <div key={history.id} className="flex gap-3 text-xs">
                          {/* Dot connector */}
                          <div className="flex flex-col items-center">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                              isInitial ? 'bg-white/5 text-slate-400 border border-white/10' : 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
                            }`}>
                              <UserCircle className="h-4.5 w-4.5" />
                            </div>
                            {idx < activeApp.reviewHistory.length - 1 && (
                              <div className="w-0.5 bg-white/10 grow mt-1"></div>
                            )}
                          </div>

                          {/* Detail comment box */}
                          <div className="bg-white/5 rounded-xl p-4 grow border border-white/10">
                            <div className="flex justify-between items-center flex-wrap gap-2 mb-1.5">
                              <div>
                                <span className="font-semibold text-white">{history.actionBy}</span>
                                <span className="text-slate-400 text-[10px] font-mono ml-2">({history.actionByRole})</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(history.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5 mb-2">
                              {isInitial ? (
                                <span className="text-[9px] bg-blue-950/50 text-blue-300 font-bold uppercase px-1.5 py-0.5 rounded border border-blue-500/20">
                                  Proposal Created
                                </span>
                              ) : (
                                <>
                                  <span className="text-[9px] bg-white/5 text-slate-400 px-1 py-0.5 rounded">
                                    {history.statusFrom}
                                  </span>
                                  <ChevronRight className="h-3 w-3 text-slate-500" />
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                    history.statusTo === 'Approved' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/20' :
                                    history.statusTo === 'Rejected' ? 'bg-rose-950/50 text-rose-300 border-rose-500/20' :
                                    history.statusTo === 'Technical Review' ? 'bg-amber-950/50 text-amber-300 border-amber-500/20' :
                                    history.statusTo === 'Under Review' ? 'bg-indigo-950/50 text-indigo-300 border-indigo-500/20' : 'bg-white/5 border-white/10'
                                  }`}>
                                    {history.statusTo}
                                  </span>
                                </>
                              )}
                            </div>

                            <p className="text-slate-300 leading-relaxed italic">
                              "{history.comments}"
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 italic">No administrative events recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="immersive-card rounded-3xl p-12 text-center">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-normal text-white">Select an AI Proposal</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Choose a submission from the list on the left to inspect its real-time development progress, review histories, and details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
