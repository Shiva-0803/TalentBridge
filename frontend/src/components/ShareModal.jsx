import React, { useState } from 'react';
import { X, Copy, Check, Share2, Send, Mail } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, job }) {
  if (!isOpen || !job) return null;

  const shareUrl = `${window.location.origin}/jobs/${job.requisition_id || job.id}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareTitle = encodeURIComponent(`Job Opportunity: ${job.job_title} at TalentBridge`);
  const encodedUrl = encodeURIComponent(shareUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Share Job Opening</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Job Details Brief */}
        <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <h4 className="font-bold text-slate-900 text-sm">{job.job_title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{job.department} • {job.location} • {job.experience_range}</p>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5 mb-5">
          <label className="text-xs font-semibold text-slate-600">Public Share Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 select-all font-mono focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Social Share Options */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-600 block">Share via social media</span>
          <div className="grid grid-cols-4 gap-2">
            <a
              href={`https://api.whatsapp.com/send?text=${shareTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex flex-col items-center justify-center text-[11px] font-medium transition-colors"
            >
              <Send className="w-4 h-4 mb-1" /> WhatsApp
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 flex flex-col items-center justify-center text-[11px] font-medium transition-colors"
            >
              <svg className="w-4 h-4 mb-1 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg> LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 flex flex-col items-center justify-center text-[11px] font-medium transition-colors"
            >
              <svg className="w-4 h-4 mb-1 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Twitter/X
            </a>
            <a
              href={`mailto:?subject=${shareTitle}&body=Check out this job opening at TalentBridge: ${encodedUrl}`}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex flex-col items-center justify-center text-[11px] font-medium transition-colors"
            >
              <Mail className="w-4 h-4 mb-1" /> Email
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
