import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Phone, MapPin, Briefcase, Calendar, Clock,
  FileText, ChevronRight, Award, CheckCircle,
  RefreshCw, Download, Sparkles, ArrowRight, Shield,
  Upload, X, AlertCircle, CheckCircle2, Pencil
} from 'lucide-react';
import { applicationService, authService } from '../services/api';

const statusBadge = (status) => {
  const map = {
    New: 'badge-new',
    Reviewed: 'badge-reviewed',
    Shortlisted: 'badge-shortlisted',
    Rejected: 'badge-rejected',
  };
  return map[status] || 'badge-new';
};

// ─── Inline CV Update Component ───────────────────────────────
function UpdateCVButton({ app, onSuccess }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setError('Only PDF, DOC, or DOCX files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be smaller than 5 MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const res = await applicationService.updateResume(app.id, file);
      setSuccess(`CV updated: ${res.resume_file_name}`);
      setTimeout(() => { setSuccess(null); onSuccess(); }, 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update CV. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-3">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center
          ${dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/40'
          }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {uploading ? (
          <>
            <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-blue-600">Uploading new CV...</p>
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">
                Drop new CV here or <span className="text-blue-600 underline underline-offset-2">browse</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">PDF, DOC, DOCX · Max 5 MB</p>
            </div>
          </>
        )}
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {success}
        </div>
      )}
    </div>
  );
}

// ─── Main Profile Page ─────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout, fetchUserData } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');
  const [expandedCV, setExpandedCV] = useState(null); // app.id that has update panel open

  // Edit Basic Details State
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [savingBasic, setSavingBasic] = useState(false);
  const [basicError, setBasicError] = useState(null);
  const [basicSuccess, setBasicSuccess] = useState(null);

  const profile = user?.profile || {};
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`;
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  const [basicForm, setBasicForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    mobile: profile.mobile || '',
    gender: profile.gender || '',
    dob: profile.dob || '',
    current_location: profile.current_location || '',
    current_company: profile.current_company || '',
    notice_period: profile.notice_period || '',
  });

  const handleOpenEditBasic = () => {
    setBasicForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      mobile: profile.mobile || '',
      gender: profile.gender || '',
      dob: profile.dob || '',
      current_location: profile.current_location || '',
      current_company: profile.current_company || '',
      notice_period: profile.notice_period || '',
    });
    setBasicError(null);
    setBasicSuccess(null);
    setIsEditingBasic(true);
  };

  const handleSaveBasicDetails = async (e) => {
    e.preventDefault();
    setSavingBasic(true);
    setBasicError(null);
    setBasicSuccess(null);

    try {
      await authService.updateProfile(basicForm);
      setBasicSuccess('Basic details updated successfully!');
      if (fetchUserData) await fetchUserData();
      setTimeout(() => {
        setIsEditingBasic(false);
        setBasicSuccess(null);
      }, 1200);
    } catch (err) {
      setBasicError(err.response?.data?.detail || 'Failed to update basic details.');
    } finally {
      setSavingBasic(false);
    }
  };

  const stats = [
    { label: 'Total Applied', value: applications.length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Under Review', value: applications.filter(a => a.status === 'Reviewed').length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Not Selected', value: applications.filter(a => a.status === 'Rejected').length, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">

      {/* Profile Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white pt-12 pb-24 px-4 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6 relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-blue-900/40 shrink-0 border-4 border-white/10">
            {initials}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">{fullName}</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Candidate
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium">{user.email}</p>
            {profile.current_location && (
              <p className="text-xs text-slate-400 flex items-center gap-1 justify-center sm:justify-start mt-1">
                <MapPin className="w-3 h-3" /> {profile.current_location}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to="/jobs" className="text-xs font-bold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all">
              Browse Jobs
            </Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-premium p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1 mb-6 shadow-xs w-fit">
          {[
            { key: 'applications', icon: <FileText className="w-3.5 h-3.5" />, label: 'My Applications' },
            { key: 'profile', icon: <User className="w-3.5 h-3.5" />, label: 'My Profile' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: MY APPLICATIONS ─── */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-slate-900">Submitted Applications</h2>
              <button
                onClick={fetchApplications}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-all"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-semibold">Loading your applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-premium space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="font-bold text-slate-900">No applications yet</h3>
                <p className="text-xs text-slate-500">Start exploring open positions and apply to your dream role.</p>
                <Link to="/jobs" className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all shadow-md">
                  Browse Open Jobs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.application_code} className="bg-white rounded-2xl border border-slate-200 shadow-premium hover-lift p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge(app.status)}`}>
                          {app.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{app.application_code}</span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">{app.job_title}</h3>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" /> {app.location}</span>
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-indigo-500" /> {app.department}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {new Date(app.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-2">
                      <a
                        href={applicationService.getResumeUrl(app.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-xl transition-all"
                        title="Download submitted CV"
                      >
                        <Download className="w-3.5 h-3.5" /> CV
                      </a>
                      <Link
                        to={`/jobs/${app.requisition_id}`}
                        className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-xl transition-all"
                      >
                        View Job <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB 2: MY PROFILE ─── */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Personal Information
                </h3>
                <button
                  type="button"
                  onClick={handleOpenEditBasic}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-extrabold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Basic Details
                </button>
              </div>

              {/* EDIT BASIC DETAILS FORM */}
              {isEditingBasic ? (
                <form onSubmit={handleSaveBasicDetails} className="p-6 space-y-4">
                  {basicError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{basicError}</span>
                    </div>
                  )}

                  {basicSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{basicSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={basicForm.first_name}
                        onChange={(e) => setBasicForm({ ...basicForm, first_name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={basicForm.last_name}
                        onChange={(e) => setBasicForm({ ...basicForm, last_name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
                      <input
                        type="text"
                        required
                        value={basicForm.mobile}
                        onChange={(e) => setBasicForm({ ...basicForm, mobile: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Gender *</label>
                      <select
                        required
                        value={basicForm.gender}
                        onChange={(e) => setBasicForm({ ...basicForm, gender: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={basicForm.dob}
                        onChange={(e) => setBasicForm({ ...basicForm, dob: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Current Location *</label>
                      <input
                        type="text"
                        required
                        value={basicForm.current_location}
                        onChange={(e) => setBasicForm({ ...basicForm, current_location: e.target.value })}
                        placeholder="City, State"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Current Company</label>
                      <input
                        type="text"
                        value={basicForm.current_company}
                        onChange={(e) => setBasicForm({ ...basicForm, current_company: e.target.value })}
                        placeholder="N/A if Fresher"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Notice Period *</label>
                      <select
                        required
                        value={basicForm.notice_period}
                        onChange={(e) => setBasicForm({ ...basicForm, notice_period: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Notice Period</option>
                        <option value="Immediate">Immediate</option>
                        <option value="15 days">15 days</option>
                        <option value="30 days">30 days</option>
                        <option value="60 days">60 days</option>
                        <option value="90+ days">90+ days</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingBasic(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingBasic}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {savingBasic ? 'Saving...' : 'Save Basic Details'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { icon: <User className="w-4 h-4 text-blue-500" />, label: 'Full Name', value: fullName },
                    { icon: <Mail className="w-4 h-4 text-indigo-500" />, label: 'Email Address', value: user.email },
                    { icon: <Phone className="w-4 h-4 text-emerald-500" />, label: 'Mobile Number', value: profile.mobile || '—' },
                    { icon: <Award className="w-4 h-4 text-amber-500" />, label: 'Gender', value: profile.gender || '—' },
                    { icon: <Calendar className="w-4 h-4 text-purple-500" />, label: 'Date of Birth', value: profile.dob || '—' },
                    { icon: <MapPin className="w-4 h-4 text-red-500" />, label: 'Current Location', value: profile.current_location || '—' },
                    { icon: <Briefcase className="w-4 h-4 text-slate-500" />, label: 'Current Company', value: profile.current_company || '—' },
                    { icon: <Clock className="w-4 h-4 text-orange-500" />, label: 'Notice Period', value: profile.notice_period || '—' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">{item.icon}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resume / CV Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Resume / CV Settings
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">PDF, DOC, DOCX · Max 5 MB</span>
              </div>
              <div className="p-6 space-y-4">
                {loading ? (
                  <div className="py-6 text-center">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    No applications yet — submit a job application to upload your CV.
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.application_code} className="space-y-2">
                      {/* CV Row */}
                      <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{app.resume_file_name || 'resume.pdf'}</p>
                            <p className="text-[11px] text-slate-500 truncate">{app.job_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={applicationService.getResumeUrl(app.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </a>
                          <button
                            onClick={() => setExpandedCV(expandedCV === app.id ? null : app.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-xl transition-all ${
                              expandedCV === app.id
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700'
                            }`}
                          >
                            {expandedCV === app.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                            {expandedCV === app.id ? 'Cancel' : 'Change CV'}
                          </button>
                        </div>
                      </div>

                      {/* Drop zone — only shown when this card's Change CV is clicked */}
                      {expandedCV === app.id && (
                        <UpdateCVButton
                          app={app}
                          onSuccess={() => { setExpandedCV(null); fetchApplications(); }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" /> Account Security
                </h3>
              </div>
              <div className="p-6 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Password Protected Account</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Your account is secured with email username and encrypted password credentials.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
