import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, ShieldCheck, CheckCircle, AlertCircle, ArrowRight, Sparkles, Phone, User as UserIcon, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, pendingApplyReqId, login, register, adminLogin } = useAuth();

  // Tab state: 'candidate' or 'admin'
  const [activeTab, setActiveTab] = useState('candidate');

  // Candidate Sub-mode: 'login', 'register', 'forgot', 'reset'
  const [candidateMode, setCandidateMode] = useState('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');

  // Forgot / Reset Password state
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setMobile('');
    setResetOtpCode('');
    setNewPassword('');
    setAdminEmail('');
    setAdminPassword('');
  };

  // Handle Candidate Login (Email + Password)
  const handleCandidateLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await login(email, password);
      setAuthModalOpen(false);
      resetState();

      if (pendingApplyReqId) {
        navigate(`/apply/${pendingApplyReqId}`);
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email address or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Candidate Registration (Create Account with Email + Password)
  const handleCandidateRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email: email,
        mobile: mobile,
        password: password,
        role: 'candidate'
      });
      setAuthModalOpen(false);
      resetState();

      if (pendingApplyReqId) {
        navigate(`/apply/${pendingApplyReqId}`);
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Registration failed.';
      if (errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('already registered')) {
        setCandidateMode('login');
        setSuccessMsg(`Welcome back! Account found for ${email}. Please enter your password to sign in.`);
        setError(null);
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await authService.forgotPassword(email);
      setCandidateMode('reset');
      setSuccessMsg(res.message || `Reset code sent to ${email}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'No account found with this email address.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset Submission
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      setLoading(false);
      return;
    }

    try {
      const res = await authService.resetPassword(email, resetOtpCode, newPassword);
      setCandidateMode('login');
      setPassword('');
      setConfirmPassword('');
      setSuccessMsg(res.message || 'Password reset successfully! Please sign in with your new password.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminLogin(adminEmail, adminPassword);
      setAuthModalOpen(false);
      resetState();
      navigate('/admin/requisitions');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid admin email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto">

        {/* Close Button */}
        <button
          onClick={() => { setAuthModalOpen(false); resetState(); }}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
            {activeTab === 'candidate' ? (
              candidateMode === 'login' ? <LogIn className="w-6 h-6" /> :
              candidateMode === 'register' ? <UserPlus className="w-6 h-6" /> :
              <KeyRound className="w-6 h-6" />
            ) : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {activeTab === 'candidate'
              ? (candidateMode === 'login' ? 'Candidate Sign In' :
                 candidateMode === 'register' ? 'Create Candidate Account' :
                 candidateMode === 'forgot' ? 'Reset Password' : 'Create New Password')
              : 'Admin Console Login'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'candidate'
              ? (candidateMode === 'login' ? 'Sign in with your email and password' :
                 candidateMode === 'register' ? 'Enter your details to register as a new candidate' :
                 candidateMode === 'forgot' ? 'Enter registered email to receive reset code' :
                 'Enter verification code and choose a new password')
              : 'Authorized HR Recruiter Credentials'}
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => { setActiveTab('candidate'); setCandidateMode('login'); resetState(); }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'candidate' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" /> Candidate Portal
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

        {/* CANDIDATE AUTHENTICATION (EMAIL + PASSWORD) */}
        {activeTab === 'candidate' && (
          <div>
            {/* CANDIDATE LOGIN FORM */}
            {candidateMode === 'login' && (
              <form onSubmit={handleCandidateLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address (Username) *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      autoComplete="username"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Password *</label>
                    <button
                      type="button"
                      onClick={() => { setCandidateMode('forgot'); setError(null); setSuccessMsg(null); }}
                      className="text-[11px] font-extrabold text-blue-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setCandidateMode('register'); setError(null); }}
                    className="font-extrabold text-blue-600 hover:underline"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {/* CANDIDATE FORGOT PASSWORD FORM (STEP 1) */}
            {candidateMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Registered Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Sending Code...' : 'Send Reset Code'} <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => { setCandidateMode('login'); setError(null); }}
                    className="font-extrabold text-blue-600 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* CANDIDATE RESET PASSWORD FORM (STEP 2) */}
            {candidateMode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Reset Verification Code (6-digit) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtpCode}
                    onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-center tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">New Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !resetOtpCode || !newPassword || !confirmPassword}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Resetting Password...' : 'Reset & Create New Password'} <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => { setCandidateMode('forgot'); setError(null); }}
                    className="font-bold text-slate-500 hover:underline"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}

            {/* CANDIDATE REGISTRATION FORM */}
            {candidateMode === 'register' && (
              <form onSubmit={handleCandidateRegister} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address (Username) *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="username"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
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
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Password *</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        autoComplete="new-password"
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password || !confirmPassword || !firstName || !lastName || !mobile}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                >
                  {loading ? 'Creating Account...' : 'Create Account & Sign In'} <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setCandidateMode('login'); setError(null); }}
                    className="font-extrabold text-blue-600 hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* SYSTEM ADMIN LOGIN FORM */}
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
                  placeholder="admin@talentbridge.com"
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
                  placeholder="Admin password"
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
