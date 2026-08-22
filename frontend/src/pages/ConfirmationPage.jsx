import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, FileText, Search, ArrowRight } from 'lucide-react';

export default function ConfirmationPage() {
  const location = useLocation();
  const state = location.state;

  if (!state) {
    return <Navigate to="/jobs" replace />;
  }

  const { application_code, submitted_at, status, job_title, requisition_id } = state;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-2xl max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Big Green Success Checkmark matching Wireframe 8.6 */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Application Submitted Successfully!
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Your application for <span className="font-semibold text-slate-800">{job_title}</span> ({requisition_id}) has been received. A confirmation email has been logged.
          </p>
        </div>

        {/* Confirmation Details Card matching Wireframe 8.6 */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left space-y-3 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
            <span className="text-slate-500 font-medium">Application ID</span>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-sm">
              {application_code}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
            <span className="text-slate-500 font-medium">Submitted On</span>
            <span className="font-semibold text-slate-800">{submitted_at}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Status</span>
            <span className="badge-new px-2.5 py-0.5 rounded-full font-bold text-[11px]">
              {status || 'Received — Under Review'}
            </span>
          </div>
        </div>

        {/* Navigation Action Buttons matching Wireframe 8.6 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            to="/my-applications"
            className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" /> View My Applications
          </Link>

          <Link
            to="/jobs"
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Browse More Jobs
          </Link>
        </div>

      </div>
    </div>
  );
}
