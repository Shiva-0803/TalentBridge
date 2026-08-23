import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Briefcase, Clock, Calendar, Users, DollarSign, Share2, CheckCircle2, AlertCircle } from 'lucide-react';
import { requisitionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ShareModal from '../components/ShareModal';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const data = await requisitionService.getPublicDetail(id);
        setJob(data);
      } catch (err) {
        setError('Job opening not found or no longer active.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetail();
  }, [id]);

  const handleApplyClick = () => {
    if (!user) {
      triggerAuthModal(job.id);
    } else {
      navigate(`/apply/${job.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-xs">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Job Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">{error}</p>
          <Link
            to="/jobs"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Careers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      
      {/* Top Banner & Header matching Wireframe 8.2 */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to job listings
          </Link>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-md">
                  {job.department}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {job.requisition_id}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {job.job_title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600 mt-3 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{job.location}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>{job.employment_type}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{job.experience_range} experience</span>
                </div>
              </div>
            </div>

            {/* Header Action CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleApplyClick}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                Apply Now
              </button>
              <button
                onClick={() => setIsShareOpen(true)}
                className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-xs transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content & Right Overview Rail */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Description Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Description Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Job Description & Requirements
              </h2>

              <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {job.job_description}
              </div>
            </div>

          </div>

          {/* Right Rail Overview Card matching Wireframe 8.2 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 sticky top-24">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Job Overview
              </h3>

              <div className="space-y-4 text-xs">
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Department</span>
                    <span className="font-bold text-slate-800 text-sm">{job.department}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Location</span>
                    <span className="font-bold text-slate-800 text-sm">{job.location}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Employment Type</span>
                    <span className="font-bold text-slate-800 text-sm">{job.employment_type}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Openings</span>
                    <span className="font-bold text-slate-800 text-sm">{job.openings} Open Position(s)</span>
                  </div>
                </div>

                {job.max_salary_budget && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Salary Budget</span>
                      <span className="font-bold text-emerald-700 text-sm">{job.max_salary_budget}</span>
                    </div>
                  </div>
                )}

                {job.hiring_target_date && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Target Hiring Date</span>
                      <span className="font-bold text-slate-800 text-sm">{job.hiring_target_date}</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Call to action box */}
              <div className="pt-4 border-t border-slate-100 bg-blue-50/70 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <h4 className="font-bold text-slate-900 text-xs mb-1">Ready to apply?</h4>
                <p className="text-[11px] text-slate-600 mb-4">
                  Sign in or create a candidate account to complete the guided application form.
                </p>
                <button
                  onClick={handleApplyClick}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Apply Now
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        job={job}
      />

    </div>
  );
}
