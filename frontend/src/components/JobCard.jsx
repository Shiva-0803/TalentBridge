import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, Clock, Share2, ArrowRight, Eye, Sparkles, Building2, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function JobCard({ job, onShare }) {
  const { user, triggerAuthModal } = useAuth();
  const navigate = useNavigate();

  const handleApplyClick = () => {
    if (!user) {
      triggerAuthModal(job.id);
    } else {
      navigate(`/apply/${job.id}`);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Recently posted';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Posted just now';
    if (diffHours < 24) return `Posted ${diffHours}h ago`;
    if (diffDays === 1) return 'Posted 1 day ago';
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
    return `Posted ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  };

  return (
    <div className="job-list-card rounded-2xl p-5 shadow-premium group relative transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* Left Side: Job Info & Badges */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          
          {/* Company / Dept Icon Avatar */}
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Header: Title & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/jobs/${job.id}`}
                className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 block"
              >
                {job.job_title}
              </Link>
              
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" /> {job.department}
              </span>
              
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {job.requisition_id}
              </span>
            </div>

            {/* Metadata Pills Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {job.location}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                {job.employment_type}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {job.experience_range}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                <Calendar className="w-3 h-3 text-slate-400" />
                {timeAgo(job.posted_at || job.created_at)}
              </span>
            </div>

            {/* Short Description */}
            <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
              {job.job_description ? job.job_description.replace(/<[^>]*>?/gm, '') : 'No detailed description available.'}
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons (View, Apply Now, Share) */}
        <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
          
          {/* View Details Button */}
          <Link
            to={`/jobs/${job.id}`}
            className="px-3.5 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 hover:border-blue-200 flex items-center gap-1.5"
            title="View job details"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" /> View
          </Link>

          {/* Apply Now Button */}
          <button
            onClick={handleApplyClick}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-1.5"
          >
            Apply Now <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Share Button */}
          <button
            onClick={() => onShare(job)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all border border-slate-200"
            title="Share this opening"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    </div>
  );
}
