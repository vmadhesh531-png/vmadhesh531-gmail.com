/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CATEGORIES, TIMELINES } from '../data/mockData';
import { Application, ApplicationAttachment, User, ApplicationPriority } from '../types';
import { ArrowLeft, Send, Sparkles, UploadCloud, X, FileText, Check, DollarSign, Users, Calendar } from 'lucide-react';
import { supabase } from '../supabase';

interface SubmissionFormProps {
  currentUser: User;
  onSubmit: (applicationData: Omit<Application, 'id' | 'applicantId' | 'applicantName' | 'applicantEmail' | 'submittedAt' | 'status' | 'reviewHistory'> & { attachments: ApplicationAttachment[] }) => void;
  onCancel: () => void;
}

export default function SubmissionForm({ currentUser, onSubmit, onCancel }: SubmissionFormProps) {
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState(CATEGORIES[0]);
  const [dept, setDept] = React.useState(currentUser.department || 'Operations');
  const [description, setDescription] = React.useState('');
  const [proposedSolution, setProposedSolution] = React.useState('');
  const [teamSize, setTeamSize] = React.useState(2);
  const [budget, setBudget] = React.useState(25000);
  const [timeline, setTimeline] = React.useState(TIMELINES[0]);
  const [expectedImpact, setExpectedImpact] = React.useState('');
  const [priority, setPriority] = React.useState<ApplicationPriority>('Medium');
  
  // Simulated Attachments State
  const [attachments, setAttachments] = React.useState<ApplicationAttachment[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleRealUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleRealUpload(e.target.files);
    }
  };

  const handleRealUpload = async (files: FileList) => {
    setIsUploading(true);
    const newAttachments: ApplicationAttachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const uploaded = await res.json();
            newAttachments.push({
              name: uploaded.name,
              size: uploaded.size,
              type: uploaded.type,
            });
            continue;
          }
        }
        
        // Handle non-OK or non-JSON response with local attachment entry
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        newAttachments.push({
          name: file.name,
          size: `${sizeMB} MB`,
          type: file.type || 'application/octet-stream',
        });
      } catch (err) {
        console.warn('File upload server notice, using attachment fallback:', err);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        newAttachments.push({
          name: file.name,
          size: `${sizeMB} MB`,
          type: file.type || 'application/octet-stream',
        });
      }
    }
    
    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsUploading(false);
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !proposedSolution || !expectedImpact) {
      alert('Please fill out all required fields before submitting.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert([{
          employee_name: currentUser.name,
          employee_id: currentUser.id || 'EMP-1001',
          employee_email: currentUser.email,
          department: dept,
          submission_title: title
        }]);

      if (error) {
        console.warn('[Supabase] Direct sync notice (continuing with primary database):', error.message);
      } else {
        console.log('[Supabase] Saved submission successfully:', data);
      }
    } catch (err) {
      console.warn('[Supabase] Sync exception notice:', err);
    }

    onSubmit({
      title,
      category,
      department: dept,
      description,
      proposedSolution,
      teamSize,
      budget,
      timeline,
      expectedImpact,
      attachments,
      priority,
    });
  };

  // Preset file configurations for simple one-click upload testing
  const addQuickDocument = (docName: string, size: string, type: string) => {
    setAttachments((prev) => [
      ...prev,
      { name: docName, size, type }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="submission-form">
      {/* Back link */}
      <button
        onClick={onCancel}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition duration-150 mb-6 cursor-pointer"
        id="submission-form-back"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Dashboard</span>
      </button>

      <div className="immersive-card rounded-3xl overflow-hidden">
        {/* Banner */}
        <div className="bg-black/30 border-b border-white/10 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-orange-500/10 rounded-full blur-3xl opacity-30 -mr-10 -mt-10"></div>
          <div className="flex items-center space-x-3 relative z-10">
            <div className="bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20 text-orange-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-normal tracking-tight">AI Initiative Proposal</h2>
              <p className="text-slate-400 text-xs mt-1 font-sans">
                Fill in details of your proposed intelligence system to request corporate development backing.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Section 1: Basic Classification */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-orange-400 tracking-widest font-mono border-b border-white/5 pb-2">
              01. Basic Classification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Project / Initiative Title <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Dynamic Retail Stock Predictor Using Transformer Networks"
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  id="form-input-title"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  AI Modeling Category <span className="text-orange-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-300"
                  id="form-select-category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Sponsoring Department <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  required
                  id="form-input-dept"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                  Request Priority / Urgency <span className="text-orange-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3" id="form-priority-selector">
                  {(['Low', 'Medium', 'High'] as ApplicationPriority[]).map((p) => {
                    const activeColors = {
                      Low: 'border-blue-500/50 bg-blue-500/10 text-blue-300 shadow-sm shadow-blue-500/5',
                      Medium: 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-500/5',
                      High: 'border-rose-500/50 bg-rose-500/10 text-rose-300 shadow-sm shadow-rose-500/5',
                    }[p];
                    
                    const isSelected = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold font-mono transition text-center cursor-pointer ${
                          isSelected 
                            ? activeColors
                            : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-sans">
                  High priority flags urgent grant requests requiring expedited board review.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Operational Description */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-orange-400 tracking-widest font-mono border-b border-white/5 pb-2">
              02. Operational Proposal
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Problem Statement / Opportunity <span className="text-orange-400">*</span>
                </label>
                <p className="text-[10px] text-slate-500 mb-1.5 font-sans">
                  What operations bottleneck are you solving? Describe the status quo and friction.
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your current bottleneck in detail..."
                  rows={4}
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  id="form-input-description"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Proposed AI Architecture / Solution <span className="text-orange-400">*</span>
                </label>
                <p className="text-[10px] text-slate-500 mb-1.5 font-sans">
                  Detail the models, datasets, guardrails, or cloud infrastructures required.
                </p>
                <textarea
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  placeholder="Detail your proposed technology stack and data models..."
                  rows={4}
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  id="form-input-solution"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Scope & Budgets */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-orange-400 tracking-widest font-mono border-b border-white/5 pb-2">
              03. Resource Allocation & Timeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Budget Field with numeric visual cue */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center space-x-2 text-slate-300 mb-2">
                  <DollarSign className="h-4.5 w-4.5 text-orange-400" />
                  <span className="text-[11px] font-bold uppercase tracking-widest font-mono">Estimated Budget</span>
                </div>
                <input
                  type="number"
                  min="10000"
                  max="500000"
                  step="5000"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  id="form-input-budget"
                />
                <span className="text-[10px] text-slate-500 block mt-1.5">Grant Limit: $150k without CFO board approval</span>
              </div>

              {/* Team Size */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center space-x-2 text-slate-300 mb-2">
                  <Users className="h-4.5 w-4.5 text-orange-400" />
                  <span className="text-[11px] font-bold uppercase tracking-widest font-mono">Required Team Size</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full accent-orange-500"
                    id="form-input-teamsize-range"
                  />
                  <span className="text-xs font-mono font-bold bg-white/5 px-2.5 py-1 border border-white/10 rounded-lg text-white w-10 text-center">
                    {teamSize}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1.5">Includes developers, data engineers, & PMs</span>
              </div>

              {/* Timeline select */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center space-x-2 text-slate-300 mb-2">
                  <Calendar className="h-4.5 w-4.5 text-orange-400" />
                  <span className="text-[11px] font-bold uppercase tracking-widest font-mono">Implementation Window</span>
                </div>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300"
                  id="form-select-timeline"
                >
                  {TIMELINES.map((time) => (
                    <option key={time} value={time} className="bg-slate-900 text-white">
                      {time}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1.5">Target deadline for first production release</span>
              </div>
            </div>
          </div>

          {/* Section 4: Expected Business Outcomes */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-orange-400 tracking-widest font-mono border-b border-white/5 pb-2">
              04. Expected Business Outcomes
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                Outcome & Return on Investment (ROI) <span className="text-orange-400">*</span>
              </label>
              <p className="text-[10px] text-slate-500 mb-1.5 font-sans">
                Quantify the expected metrics: time saved, manual tasks automated, or revenues unlocked.
              </p>
              <textarea
                value={expectedImpact}
                onChange={(e) => setExpectedImpact(e.target.value)}
                placeholder="Detail business value parameters (e.g., Save $40,000 in support agent time...)"
                rows={3}
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                id="form-input-impact"
              />
            </div>
          </div>

          {/* Section 5: Documents & Files Drop */}
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center border-b border-white/5 pb-2 gap-2">
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-widest font-mono">
                05. Supporting Documents / Mock Attachments
              </h3>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => addQuickDocument('technical_specification_v1.pdf', '1.8 MB', 'application/pdf')}
                  className="text-[9px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 transition cursor-pointer"
                >
                  + Quick Spec PDF
                </button>
                <button
                  type="button"
                  onClick={() => addQuickDocument('costing_projections.xlsx', '310 KB', 'xlsx')}
                  className="text-[9px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 transition cursor-pointer"
                >
                  + Quick Costing Sheet
                </button>
              </div>
            </div>

            {/* File Drag Box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
                isDragging 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
              } ${isUploading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
              id="form-file-dropzone"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="text-xs font-semibold text-orange-400">Uploading documents to secure server...</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300">Drag & drop files here, or <span className="text-orange-400">browse folders</span></p>
                  <p className="text-[10px] text-slate-500 mt-1">Accepts PDF, Excel, Docx, or PNG diagrams up to 10MB each</p>
                </>
              )}
            </div>

            {/* Uploaded Files Table */}
            {attachments.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-500 mb-2">Attached files ({attachments.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between text-white">
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <FileText className="h-5 w-5 text-orange-400 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-medium text-white truncate" title={file.name}>{file.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{file.size} • {file.type.split('/')[1] || 'document'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}
                        className="p-1 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-slate-300 transition cursor-pointer"
              id="form-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-black rounded-xl text-xs font-bold shadow-md glow-orange flex items-center space-x-2 transition cursor-pointer"
              id="form-btn-submit"
            >
              <span>Submit AI Proposal</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
