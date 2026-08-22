import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationService } from '../services/api';
import { FileText, Clock, MapPin, Briefcase, RefreshCw, AlertCircle } from 'lucide-react';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await applicationService.getMyApplications();
      setApplications(data);
    } catch (err) {
      setError('Failed to fetch your applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getBadgeClass = (status) => {
    switch (status) {
      case 'New': return 'badge-new';
      case 'Reviewed': return 'badge-reviewed';
      case 'Shortlisted': return 'badge-shortlisted';
      case 'Rejected': return 'badge-rejected';
      default: return 'badge-new';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" /> My Submitted Applications
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track real-time recruitment status for all job openings you applied to.
            </p>
          </div>
          <Link
            to="/jobs"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Browse More Jobs
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading your applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No applications yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              You haven't submitted any job applications yet. Browse open positions to get started.
            </p>
            <Link
              to="/jobs"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Explore Openings
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {app.application_code}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Req: {app.requisition_id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{app.job_title}</h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2 font-medium">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.department}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.location}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Applied: {app.submitted_at}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="text-[11px] text-slate-400 block mb-1">Application Status</span>
                  <span className={`${getBadgeClass(app.status)} px-3 py-1 rounded-full font-bold text-xs`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
