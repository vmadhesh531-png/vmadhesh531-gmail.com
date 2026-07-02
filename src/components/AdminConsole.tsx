/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Application, ApplicationStatus, ReviewHistoryEntry, User } from '../types';
import { 
  ShieldCheck, Search, Filter, Calendar, DollarSign, Users, 
  Sparkles, CheckCircle2, Clock, AlertCircle, Ban, ArrowRight, MessageSquare, 
  UserCircle, ChevronRight, FileText, Download, Save, History, Building2
} from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

interface AdminConsoleProps {
  currentUser: User;
  applications: Application[];
  onUpdateStatus: (
    appId: string, 
    newStatus: ApplicationStatus, 
    comments: string, 
    adminName: string
  ) => void;
}

export default function AdminConsole({ currentUser, applications = [], onUpdateStatus }: AdminConsoleProps) {
  const [selectedAppId, setSelectedAppId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('All');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('All');

  // Review Outcome Form States
  const [newStatus, setNewStatus] = React.useState<ApplicationStatus>('Under Review');
  const [feedbackComments, setFeedbackComments] = React.useState('');
  const [formSuccessMessage, setFormSuccessMessage] = React.useState('');

  // Handle selected app logic
  const activeApp = React.useMemo(() => {
    if (applications.length === 0) return null;
    if (selectedAppId) {
      const found = applications.find((app) => app.id === selectedAppId);
      if (found) return found;
    }
    return applications[0]; // default to first
  }, [applications, selectedAppId]);

  // Sync Form States when active application changes
  React.useEffect(() => {
    if (activeApp) {
      setNewStatus(activeApp.status);
      setFeedbackComments('');
      setFormSuccessMessage('');
    }
  }, [activeApp]);

  // Set default selected application
  React.useEffect(() => {
    if (applications.length > 0 && !selectedAppId) {
      setSelectedAppId(applications[0].id);
    }
  }, [applications, selectedAppId]);

  // Filter application dataset
  const filteredApps = React.useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = 
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.priority && app.priority.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || app.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [applications, searchQuery, statusFilter, categoryFilter]);

  // Metrics calculations across entire portfolio
  const metrics = React.useMemo(() => {
    const totalCount = applications.length;
    const approvedCount = applications.filter((a) => a.status === 'Approved').length;
    const approvedBudget = applications
      .filter((a) => a.status === 'Approved')
      .reduce((sum, a) => sum + a.budget, 0);
    const pendingReview = applications.filter((a) => ['Submitted', 'Under Review', 'Technical Review'].includes(a.status)).length;
    
    return {
      total: totalCount,
      approved: approvedCount,
      totalGrantPaid: approvedBudget,
      pending: pendingReview,
    };
  }, [applications]);

  // Helper to color badge according to application status
  const getStatusStyle = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
        return { bg: 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/20', icon: CheckCircle2, text: 'Approved' };
      case 'Rejected':
        return { bg: 'bg-rose-950/50 text-rose-300 border border-rose-500/20', icon: Ban, text: 'Rejected' };
      case 'Technical Review':
        return { bg: 'bg-amber-950/50 text-amber-300 border border-amber-500/20', icon: AlertCircle, text: 'Technical Review' };
      case 'Under Review':
        return { bg: 'bg-indigo-950/50 text-indigo-300 border border-indigo-500/20', icon: Clock, text: 'Under Review' };
      default:
        return { bg: 'bg-blue-950/50 text-blue-300 border border-blue-500/20', icon: FileText, text: 'Submitted' };
    }
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp) return;

    if (!feedbackComments.trim()) {
      alert('Please add governance comments summarizing the board decision.');
      return;
    }

    onUpdateStatus(activeApp.id, newStatus, feedbackComments, currentUser.name);
    setFeedbackComments('');
    setFormSuccessMessage(`Proposal ${activeApp.id} status updated to ${newStatus} successfully!`);
    
    // Clear success message after delay
    setTimeout(() => {
      setFormSuccessMessage('');
    }, 4000);
  };

  // CSV Export feature
  const handleExportCSV = () => {
    const dataToExport = filteredApps.length > 0 ? filteredApps : applications;
    if (!dataToExport || dataToExport.length === 0) {
      alert('No submission data available to export.');
      return;
    }

    const headers = [
      'ID',
      'Applicant Name',
      'Applicant Email',
      'Department',
      'Category',
      'Title',
      'Description',
      'Proposed Solution',
      'Budget ($)',
      'Timeline',
      'Team Size',
      'Expected Impact',
      'Status',
      'Submitted At'
    ];

    const escapeCSV = (val: string | number | undefined | null) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = dataToExport.map((app) => [
      escapeCSV(app.id),
      escapeCSV(app.applicantName),
      escapeCSV(app.applicantEmail),
      escapeCSV(app.department),
      escapeCSV(app.category),
      escapeCSV(app.title),
      escapeCSV(app.description),
      escapeCSV(app.proposedSolution),
      escapeCSV(app.budget),
      escapeCSV(app.timeline),
      escapeCSV(app.teamSize),
      escapeCSV(app.expectedImpact),
      escapeCSV(app.status),
      escapeCSV(app.submittedAt)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vk_corporate_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-console">
      {/* Welcome Board Header */}
      <div className="immersive-card rounded-3xl p-6 md:p-8 mb-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 h-40 w-40 bg-orange-500/10 rounded-full blur-3xl opacity-40 -mr-10 -mt-10"></div>
        <div>
          <span className="font-mono text-xs text-orange-400 font-bold uppercase tracking-widest block mb-1.5">
            Governance & Feasibility Console
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight">
            VK Corporate Board Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Reviewing submissions, managing project allocations, and updating feasibility tracking histories.
          </p>
        </div>
        <div className="z-10 flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition cursor-pointer shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98]"
            title="Export submissions list to CSV file"
            id="admin-export-csv-btn"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Admin Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="immersive-card rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Total Submitted Portfolio</p>
          <p className="text-2xl font-normal text-white mt-1 font-serif">{metrics.total} Projects</p>
        </div>
        <div className="immersive-card rounded-2xl p-4">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Total Approved Grants</p>
          <p className="text-2xl font-normal text-emerald-400 mt-1 font-serif">${metrics.totalGrantPaid.toLocaleString()}</p>
        </div>
        <div className="immersive-card rounded-2xl p-4">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Pending Decisions</p>
          <p className="text-2xl font-normal text-indigo-400 mt-1 font-serif">{metrics.pending} Pending</p>
        </div>
        <div className="immersive-card rounded-2xl p-4">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest font-mono">Feasibility Accept Rate</p>
          <p className="text-2xl font-normal text-orange-400 mt-1 font-serif">
            {metrics.total > 0 ? ((metrics.approved / metrics.total) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Administrative Search, Filters, and List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="immersive-card rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                Portfolio Applications ({filteredApps.length})
              </h3>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium border border-white/10 transition cursor-pointer"
                title="Export list to CSV file"
                id="admin-export-list-csv-btn"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects, names, depts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Filters Stack */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="block text-slate-500 font-bold uppercase mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-white/10 rounded-lg p-1.5 bg-white/5 text-slate-300"
                >
                  <option value="All" className="bg-slate-900 text-white">All Statuses</option>
                  <option value="Submitted" className="bg-slate-900 text-white">Submitted</option>
                  <option value="Under Review" className="bg-slate-900 text-white">Under Review</option>
                  <option value="Technical Review" className="bg-slate-900 text-white">Technical Review</option>
                  <option value="Approved" className="bg-slate-900 text-white">Approved</option>
                  <option value="Rejected" className="bg-slate-900 text-white">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase mb-1">AI Domain</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full border border-white/10 rounded-lg p-1.5 bg-white/5 text-slate-300 truncate"
                >
                  <option value="All" className="bg-slate-900 text-white">All Domains</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat.split(' & ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Applications List */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredApps.length > 0 ? (
                filteredApps.map((app, idx) => {
                  const statusStyle = getStatusStyle(app.status);
                  const StatusIcon = statusStyle.icon;
                  const isSelected = activeApp?.id === app.id;

                  return (
                    <button
                      key={`${app.id}-${idx}`}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col space-y-2 cursor-pointer ${
                        isSelected 
                          ? 'border-orange-500/50 bg-orange-500/10 shadow-sm shadow-orange-500/10' 
                          : 'border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10'
                      }`}
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
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${statusStyle.bg}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusStyle.text}
                        </span>
                      </div>

                      <h4 className={`text-xs font-medium leading-snug line-clamp-2 ${isSelected ? 'text-white font-bold' : 'text-slate-300'}`}>
                        {app.title}
                      </h4>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-white/5 pt-1.5 mt-1 font-sans">
                        <span className="truncate max-w-[120px] font-medium text-slate-300">{app.applicantName}</span>
                        <span className="font-mono font-semibold">${app.budget.toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                  <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-400">No applications match</p>
                  <p className="text-[10px] text-slate-500 mt-1">Adjust search metrics or status filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Detailed Board Evaluation Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {activeApp ? (
            <div className="immersive-card rounded-3xl p-6 md:p-8 space-y-8">
              {/* Proposal Header */}
              <div className="border-b border-white/10 pb-6 flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-bold text-orange-400 font-mono tracking-wider uppercase bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                      Active Board Evaluation
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 font-mono">
                      {activeApp.id}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl font-normal text-white leading-tight">
                    {activeApp.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center">
                    <Building2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    Sponsoring: <span className="font-semibold text-slate-300 ml-1 mr-3">{activeApp.department}</span>
                    Submitted: <span className="font-medium text-slate-300 ml-1">{new Date(activeApp.submittedAt).toLocaleDateString()}</span>
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs flex items-center space-x-3">
                  <UserCircle className="h-8 w-8 text-orange-400 shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Applicant</p>
                    <p className="font-bold text-white">{activeApp.applicantName}</p>
                    <p className="text-[10px] font-mono text-slate-400">{activeApp.applicantEmail}</p>
                  </div>
                </div>
              </div>

              {/* Status Manager Form */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-slate-300 flex items-center">
                  <ShieldCheck className="h-4.5 w-4.5 mr-1.5 text-orange-400" />
                  Evaluate & Update Progress Status
                </h4>

                {formSuccessMessage && (
                  <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center space-x-2 animate-fade-in">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span className="font-medium">{formSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleStatusSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Select */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                        Set Evaluation Stage
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                        className="block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                        id="admin-status-selector"
                      >
                        <option value="Submitted" className="bg-slate-900 text-white">01. Submitted</option>
                        <option value="Under Review" className="bg-slate-900 text-white">02. Board Feasibility</option>
                        <option value="Technical Review" className="bg-slate-900 text-white">03. Technical assessment</option>
                        <option value="Approved" className="bg-slate-900 text-white">04. Funding Approved</option>
                        <option value="Rejected" className="bg-slate-900 text-white">04. Rejected / Declined</option>
                      </select>
                    </div>

                    {/* Quick presets for comments */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                        Quick Governance Presets
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFeedbackComments('Technical specifications validated successfully. Funding authorized.')}
                          className="text-[9px] bg-white/5 border border-white/10 hover:border-orange-500 text-slate-300 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Approve Funding
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackComments('Routing to regional enterprise hardware directors for edge-processing feasibility reviews.')}
                          className="text-[9px] bg-white/5 border border-white/10 hover:border-orange-500 text-slate-300 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Send to Tech
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackComments('Please provide concrete metrics on expected annual support ticket savings and hand-off SLA procedures.')}
                          className="text-[9px] bg-white/5 border border-white/10 hover:border-orange-500 text-slate-300 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Request Revisions
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Notes */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                      Decision Notes & Administrative Feedback <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                      placeholder="Add formal commentary detailing this governance status adjustment... (Required)"
                      rows={3}
                      className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      required
                      id="admin-feedback-textbox"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-black font-bold rounded-xl text-xs flex items-center space-x-2 shadow-md glow-orange transition cursor-pointer"
                      id="admin-submit-outcome-btn"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Apply Decision & Log Progress</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Proposal Technical Description */}
              <div className="border-t border-white/10 pt-6 space-y-5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400">
                  Technical Proposal & Scopes
                </h4>

                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <span className="text-slate-500 text-[9px] uppercase block">Budget Requested</span>
                    <span className="text-sm font-normal text-white font-serif block mt-0.5">${activeApp.budget.toLocaleString()}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <span className="text-slate-500 text-[9px] uppercase block">Assigned Team Size</span>
                    <span className="text-sm font-normal text-white font-serif block mt-0.5">{activeApp.teamSize} Developers</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <span className="text-slate-500 text-[9px] uppercase block">Timeline Goal</span>
                    <span className="text-sm font-normal text-white font-serif block mt-0.5 truncate">{activeApp.timeline.split(' (')[0]}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col justify-between">
                    <span className="text-slate-500 text-[9px] uppercase block">Request Priority</span>
                    <span className={`text-[10px] font-bold text-center uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1 w-fit ${
                      activeApp.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      activeApp.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {activeApp.priority || 'Medium'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-semibold text-white">Problem Statement & Bottleneck</h5>
                    <p className="text-slate-300 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-white/5 mt-1">{activeApp.description}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-white">Proposed AI Architecture Solution</h5>
                    <p className="text-slate-300 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-white/5 mt-1">{activeApp.proposedSolution}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-white">Expected ROI Outcomes</h5>
                    <p className="text-slate-300 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-white/5 mt-1">{activeApp.expectedImpact}</p>
                  </div>
                </div>
              </div>

              {/* Attachments panel */}
              {activeApp.attachments && activeApp.attachments.length > 0 && (
                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-3">
                    Applicant Attachments ({activeApp.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeApp.attachments.map((file, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <FileText className="h-5 w-5 text-orange-400 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-xs font-medium text-white truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{file.size} • {file.type.split('/')[1] || 'document'}</p>
                          </div>
                        </div>
                        <a
                          href={`/api/download/${encodeURIComponent(file.name)}`}
                          download={file.name}
                          className="p-1.5 hover:bg-white/5 text-orange-400 rounded-lg transition cursor-pointer"
                          title="Download Document from Secure Server"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Decision Log */}
              <div className="border-t border-white/10 pt-6 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400 flex items-center">
                  <History className="h-4 w-4 mr-1.5" />
                  Chronological Decision & Audit History
                </h4>

                <div className="space-y-4">
                  {activeApp.reviewHistory && activeApp.reviewHistory.length > 0 ? (
                    activeApp.reviewHistory.map((history, idx) => {
                      const isInitial = history.statusFrom === 'None';
                      
                      return (
                        <div key={history.id} className="flex gap-3 text-xs">
                          {/* Dot connector */}
                          <div className="flex flex-col items-center">
                            <div className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <UserCircle className="h-4.5 w-4.5 text-slate-400" />
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
                    <p className="text-xs text-slate-500 italic">No audit records yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="immersive-card rounded-3xl p-12 text-center">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-normal text-white">Select an Application</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Choose a submission from the list on the left to initiate the formal AI feasibility, budget audit, and governance review flow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
