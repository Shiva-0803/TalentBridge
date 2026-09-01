import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, FileText, Eye, CheckCircle, RefreshCw, X, User, GraduationCap, Briefcase } from 'lucide-react';
import { applicationService, requisitionService } from '../services/api';

export default function AdminApplicationsGrid() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reqIdParam = searchParams.get('req_id');

  const [applications, setApplications] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  const [selectedReqId, setSelectedReqId] = useState(reqIdParam ? parseInt(reqIdParam) : '');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Candidate Full Detail Modal state
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchGridData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [gridData, reqData] = await Promise.all([
        applicationService.getAdminGrid({
          requisition_id: selectedReqId || null,
          search,
          status_filter: statusFilter
        }),
        requisitionService.getAdminList()
      ]);
      setApplications(gridData || []);
      setRequisitions(reqData || []);
    } catch (err) {
      console.error("Failed to load admin applications grid:", err);
      setFetchError(err.response?.data?.detail || "Failed to load candidate applications grid. Please check your admin session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGridData();
  }, [selectedReqId, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGridData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await applicationService.updateStatus(appId, newStatus);
      fetchGridData();
    } catch (err) {
      alert('Failed to update application status.');
    }
  };

  const handleViewFullDetail = async (appId) => {
    setLoadingDetail(true);
    try {
      const data = await applicationService.getAdminDetail(appId);
      setSelectedAppDetail(data);
    } catch (err) {
      alert('Failed to load candidate application detail.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const data = await applicationService.exportCsv({ requisition_id: selectedReqId || null });
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications_${selectedReqId ? `req_${selectedReqId}` : 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export CSV error:', err);
      alert('Failed to export applications to CSV.');
    }
  };

  const activeReq = requisitions.find(r => r.id === selectedReqId);

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar matching Wireframe 8.8 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
              Applications Review Grid
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              {activeReq ? `Applications — ${activeReq.job_title}` : 'All Candidate Applications'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeReq ? `Requisition Code: ${activeReq.requisition_id} • ${applications.length} candidate(s) received` : 'Consolidated view of all candidate applications across job openings.'}
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
            title="Download CSV spreadsheet of applications"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Filter Controls matching Wireframe 8.8 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          
          {/* Filter by Job Requisition */}
          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Select Requisition</label>
            <select
              value={selectedReqId}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : '';
                setSelectedReqId(val);
                if (val) {
                  setSearchParams({ req_id: val });
                } else {
                  setSearchParams({});
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Requisitions (Consolidated View)</option>
              {requisitions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.job_title} ({r.requisition_id})
                </option>
              ))}
            </select>
          </div>

          {/* Search Candidate Name / Email */}
          <div className="sm:col-span-5 relative">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Search Candidate</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by candidate name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="New">New</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

        </div>

        {/* Applications Grid Table matching Wireframe 8.8 */}
        {fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-3">
            <p className="text-sm font-bold text-red-700">{fetchError}</p>
            <button
              onClick={fetchGridData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Retry Loading Applications
            </button>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading candidate applications grid...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No candidate applications found</h3>
            <p className="text-xs text-slate-500 mt-1">No applications match the current search or filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Candidate Name</th>
                    <th className="py-3.5 px-4">Applied Job</th>
                    <th className="py-3.5 px-4">Applied On</th>
                    <th className="py-3.5 px-4">Experience</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Resume</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 block">{app.candidate_name}</span>
                        <span className="text-slate-400 text-[11px]">{app.candidate_email}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800 block">{app.job_title}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{app.requisition_id}</span>
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-medium">{app.submitted_at}</td>

                      <td className="py-4 px-4 font-semibold text-slate-800">{app.experience}</td>

                      <td className="py-4 px-4 text-slate-600">{app.location}</td>

                      {/* Direct Resume View / Download link matching Wireframe 8.8 */}
                      <td className="py-4 px-4">
                        <a
                          href={applicationService.getResumeUrl(app.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View
                        </a>
                      </td>

                      {/* Inline Status Update Dropdown matching Wireframe 8.8 */}
                      <td className="py-4 px-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                            app.status === 'New'
                              ? 'badge-new'
                              : app.status === 'Reviewed'
                              ? 'badge-reviewed'
                              : app.status === 'Shortlisted'
                              ? 'badge-shortlisted'
                              : 'badge-rejected'
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleViewFullDetail(app.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Full Application
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Full Candidate Application Drawer / Modal matching FR-ADM-06 */}
        {selectedAppDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                    {selectedAppDetail.application_code}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedAppDetail.candidate.first_name} {selectedAppDetail.candidate.last_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Applied for {selectedAppDetail.requisition.job_title} ({selectedAppDetail.requisition.requisition_id}) on {selectedAppDetail.submitted_at}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAppDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Bio-Data Section */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" /> Bio-Data & Contact Info
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Email</span>
                    <span className="font-semibold text-slate-800">{selectedAppDetail.candidate.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mobile</span>
                    <span className="font-semibold text-slate-800">{selectedAppDetail.candidate.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Location</span>
                    <span className="font-semibold text-slate-800">{selectedAppDetail.candidate.current_location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gender</span>
                    <span className="font-semibold text-slate-800">{selectedAppDetail.candidate.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Notice Period</span>
                    <span className="font-semibold text-slate-800">{selectedAppDetail.candidate.notice_period}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Current Company</span>
                    <span className="font-semibold text-slate-800">{selectedAppDetail.candidate.current_company}</span>
                  </div>
                </div>
              </div>

              {/* Education Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" /> Educational Qualifications
                </h4>
                <div className="space-y-2">
                  {selectedAppDetail.education.map((edu, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">{edu.degree}</span> ({edu.education_level})
                        <span className="text-slate-500 block">{edu.institution} • {edu.specialization}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-700 block">{edu.year_of_passing}</span>
                        <span className="text-slate-500">{edu.grade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Experience Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Professional Experience
                </h4>
                <div className="space-y-2">
                  {selectedAppDetail.work_experience.map((exp, i) => (
                    <div key={i} className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                      {exp.is_fresher ? (
                        <p className="font-bold text-amber-700">Candidate marked as Fresher (No prior experience)</p>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-900">{exp.job_title} at {exp.employer}</span>
                            <span className="text-slate-500 text-[11px] font-medium">
                              {exp.start_date} to {exp.currently_working ? 'Present' : exp.end_date} (~{exp.years_calculated} yrs)
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] pt-1">{exp.key_responsibilities}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cover Note & Resume Link */}
              {selectedAppDetail.cover_note && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs">
                  <span className="font-bold text-blue-900 block mb-1">Cover Note from Candidate:</span>
                  <p className="text-slate-700 italic">"{selectedAppDetail.cover_note}"</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <a
                  href={applicationService.getResumeUrl(selectedAppDetail.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-4 h-4" /> View / Download Resume ({selectedAppDetail.resume_file_name})
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedAppDetail(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
