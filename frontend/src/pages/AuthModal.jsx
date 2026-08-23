import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, ShieldCheck, CheckCircle, AlertCircle, Key, ArrowRight, Sparkles, Phone, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, pendingApplyReqId, sendOtp, verifyOtp, adminLogin } = useAuth();

  // Tab state: 'candidate' or 'admin'
  const [activeTab, setActiveTab] = useState('candidate');

  // Candidate OTP Flow state
  const [otpStep, setOtpStep] = useState(1);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isExisting, setIsExisting] = useState(null); // true if existing candidate, false if new

  // New Candidate Fields (Mandatory for first-time login)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');

  // Admin Login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const navigate = useNavigate();

  if (!authModalOpen) return null;

  const resetState = () => {
    setError(null);
    setSuccessMsg(null);
    setOtpStep(1);
    setCandidateEmail('');
    setOtpCode('');
    setIsExisting(null);
    setFirstName('');
    setLastName('');
    setMobile('');
    setAdminEmail('');
    setAdminPassword('');
  };

  // Handle Candidate Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await sendOtp(candidateEmail);
      setIsExisting(res.is_existing);
      if (res.dev_otp) {
        setOtpCode(res.dev_otp);
      }
      setSuccessMsg(
        res.dev_otp
          ? `Verification code for ${candidateEmail} is: ${res.dev_otp} (Auto-filled below)`
          : (res.is_existing
              ? `Welcome back! Verification code sent to ${candidateEmail}.`
              : `Verification code sent to ${candidateEmail}. Please enter your basic details to create your profile.`)
      );
      setOtpStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Candidate Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isExisting) {
      if (!firstName.trim()) {
        setError('First Name is required for new registration.');
        setLoading(false);
        return;
      }
      if (!mobile.trim()) {
        setError('Mobile Number is required for new registration.');
        setLoading(false);
        return;
      }
    }

    try {
      await verifyOtp(candidateEmail, otpCode, firstName, lastName, mobile);
      setAuthModalOpen(false);
      resetState();

      if (pendingApplyReqId) {
        navigate(`/apply/${pendingApplyReqId}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Static Credential Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminLogin(adminEmail, adminPassword);
      setAuthModalOpen(false);
      resetState();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">

        {/* Close Button */}
        <button
          onClick={() => { setAuthModalOpen(false); resetState(); }}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
            {activeTab === 'candidate' ? <Mail className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {activeTab === 'candidate' ? 'Candidate Portal Sign In' : 'Admin Console Login'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'candidate'
              ? 'Passwordless Real-Time Email OTP Verification'
              : 'Static HR Recruiter Credentials'}
          </p>
        </div>

        {/* Auth Role Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('candidate'); resetState(); }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'candidate' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Candidate (Email OTP)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); resetState(); }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: CANDIDATE REAL-TIME EMAIL OTP AUTHENTICATION */}
        {activeTab === 'candidate' && (
          <div>
            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="Enter your email address"
                      autoComplete="off"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    A 6-digit verification code will be sent to your inbox.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !candidateEmail}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                
                {/* OTP Code Field */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    6-Digit OTP Code *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Check your inbox at <strong className="text-slate-700">{candidateEmail}</strong>
                  </p>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit code"
                      autoComplete="one-time-code"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* MANDATORY BASIC DETAILS FOR NEW USER ONLY */}
                {!isExisting && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                      <Sparkles className="w-4 h-4 text-blue-600" /> First-Time Registration Details
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Since this is your first time logging in, please fill in your basic details below.
                    </p>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Mobile Number *</label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/[^\d+]/g, ''))}
                          placeholder="+91 98765 43210"
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setOtpStep(1); setOtpCode(''); setError(null); setSuccessMsg(null); }}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    otpCode.length < 6 ||
                    (!isExisting && (!firstName.trim() || !mobile.trim()))
                  }
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : isExisting ? 'Verify & Continue' : 'Create Account & Continue'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: SYSTEM ADMIN STATIC CREDENTIAL LOGIN */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Admin Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter admin email"
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Admin Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !adminEmail || !adminPassword}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Log In to Admin Console'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
