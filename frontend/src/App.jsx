import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './pages/AuthModal';

import PublicJobList from './pages/PublicJobList';
import JobDetail from './pages/JobDetail';
import CandidateApplication from './pages/CandidateApplication';
import ConfirmationPage from './pages/ConfirmationPage';
import MyApplications from './pages/MyApplications';
import ProfilePage from './pages/ProfilePage';
import AdminRequisitions from './pages/AdminRequisitions';
import AdminApplicationsGrid from './pages/AdminApplicationsGrid';
import { Bell } from 'lucide-react';

// Guarantees that opening/reloading the site on any admin URL always redirects to the Home page '/'
function InitialHomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      navigate('/', { replace: true });
    }
  }, []);

  return null;
}

function ProtectedCandidateRoute({ children }) {
  const { user, loading, triggerAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      triggerAuthModal();
      navigate('/jobs', { replace: true });
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold">Verifying authentication session...</p>
        </div>
      </div>
    );
  }
  return children;
}

function ProtectedAdminRoute({ children }) {
  const { user, loading, triggerAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      triggerAuthModal();
      navigate('/jobs', { replace: true });
    }
  }, [user, loading]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }
  return children;
}

function ToastNotification() {
  const { toastMessage, setToastMessage } = useAuth();
  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-md">
      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
        <Bell className="w-4 h-4" />
      </div>
      <p className="text-xs font-semibold leading-relaxed">{toastMessage}</p>
      <button
        onClick={() => setToastMessage(null)}
        className="text-slate-400 hover:text-white ml-auto"
      >
        ✕
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <InitialHomeRedirect />
        <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<PublicJobList />} />
              <Route path="/jobs" element={<PublicJobList />} />
              <Route path="/jobs/:id" element={<JobDetail />} />

              <Route
                path="/apply/:reqId"
                element={
                  <ProtectedCandidateRoute>
                    <CandidateApplication />
                  </ProtectedCandidateRoute>
                }
              />

              <Route path="/confirmation" element={<ConfirmationPage />} />

              <Route
                path="/my-applications"
                element={
                  <ProtectedCandidateRoute>
                    <MyApplications />
                  </ProtectedCandidateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedCandidateRoute>
                    <ProfilePage />
                  </ProtectedCandidateRoute>
                }
              />

              <Route
                path="/admin/requisitions"
                element={
                  <ProtectedAdminRoute>
                    <AdminRequisitions />
                  </ProtectedAdminRoute>
                }
              />

              <Route
                path="/admin/applications"
                element={
                  <ProtectedAdminRoute>
                    <AdminApplicationsGrid />
                  </ProtectedAdminRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <AuthModal />
          <ToastNotification />
        </div>
      </Router>
    </AuthProvider>
  );
}
