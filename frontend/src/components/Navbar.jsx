import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Bell, User, LogOut, CheckCircle, ShieldCheck, FileText, ChevronDown, Sparkles } from 'lucide-react';
import { notificationService } from '../services/api';

export default function Navbar() {
  const { user, logout, unreadCount, notifications, fetchNotifications, triggerAuthModal } = useAuth();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 glass-header shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand Logo with Glow */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                TalentBridge
              </span>
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                <Sparkles className="w-3 h-3" /> Candidate Sourcing
              </span>
            </div>
          </Link>

          {/* Navigation Links with Hover Animations */}
          <div className="hidden md:flex items-center space-x-2 text-sm font-semibold">
            {(!user || user.role !== 'admin') && (
              <Link
                to="/jobs"
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive('/jobs') || isActive('/')
                    ? 'bg-blue-50 text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                Browse Jobs
              </Link>
            )}

            {user && user.role === 'candidate' && (
              <>
                <Link
                  to="/my-applications"
                  className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/my-applications')
                      ? 'bg-blue-50 text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  My Applications
                </Link>
                <Link
                  to="/profile"
                  className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/profile')
                      ? 'bg-blue-50 text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  My Profile
                </Link>
              </>
            )}

            {user && user.role === 'admin' && (
              <>
                <Link
                  to="/admin/requisitions"
                  className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/admin/requisitions')
                      ? 'bg-blue-50 text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  Manage Requisitions
                </Link>
                <Link
                  to="/admin/applications"
                  className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/admin/applications')
                      ? 'bg-blue-50 text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  Applications Grid
                </Link>
              </>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            
            {/* Notification Bell (FR-NOTIF-04) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all relative hover:scale-105"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center unread-badge">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showNotifDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 font-medium">No notifications yet</div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 transition-colors hover:bg-slate-50 ${
                              !n.is_read ? 'bg-blue-50/60 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 text-blue-600">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-slate-900 font-bold">{n.title}</p>
                                <p className="text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                                  {new Date(n.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Button or User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.first_name[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                    {user.first_name} {user.last_name}
                  </span>
                  {user.role === 'admin' && (
                    <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                      ADMIN
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 text-xs">
                      <p className="font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                      <p className="text-slate-500 truncate text-[11px]">{user.email}</p>
                    </div>
                    {user.role === 'candidate' && (
                      <>
                        <Link
                          to="/profile"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" /> My Profile
                        </Link>
                        <Link
                          to="/my-applications"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-slate-400" /> My Applications
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                        navigate('/');
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => triggerAuthModal()}
                className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 hover:scale-105 transition-all"
              >
                Login / Sign Up
              </button>
            )}

          </div>

        </div>
      </div>
    </nav>
  );
}
