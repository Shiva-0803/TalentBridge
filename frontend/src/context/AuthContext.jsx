import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, notificationService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Auth modal trigger state for seamless login redirect when clicking "Apply"
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingApplyReqId, setPendingApplyReqId] = useState(null);

  const fetchUserData = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authService.getMe();
      setUser(data);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to load user session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const [list, countRes] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount()
      ]);
      setNotifications(list);
      setUnreadCount(countRes.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  // Real-time WebSocket connection for Admin and Candidate notifications
  useEffect(() => {
    if (!user) return;

    const wsUrl = `ws://localhost:8000/api/ws/notifications/${user.id}`;
    let socket;

    try {
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 30000);
        socket.pingInterval = pingInterval;
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'NEW_APPLICATION') {
          setUnreadCount((prev) => prev + 1);
          setToastMessage(`🔔 New Application received from ${data.candidate_name} for ${data.job_title}!`);
          fetchNotifications();

          setTimeout(() => setToastMessage(null), 6000);
        }
      };

      socket.onclose = () => {
        if (socket.pingInterval) clearInterval(socket.pingInterval);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
    }

    return () => {
      if (socket) {
        if (socket.pingInterval) clearInterval(socket.pingInterval);
        socket.close();
      }
    };
  }, [user]);

  const sendOtp = async (email) => {
    return await authService.sendOtp(email);
  };

  const verifyOtp = async (email, otpCode, firstName = null, lastName = null, mobile = null) => {
    const data = await authService.verifyOtp(email, otpCode, firstName, lastName, mobile);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data;
  };

  const adminLogin = async (email, password) => {
    const data = await authService.adminLogin(email, password);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data;
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setUnreadCount(0);
    setNotifications([]);
  };

  const triggerAuthModal = (reqId = null) => {
    setPendingApplyReqId(reqId);
    setAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        unreadCount,
        notifications,
        toastMessage,
        setToastMessage,
        sendOtp,
        verifyOtp,
        adminLogin,
        login,
        register,
        logout,
        fetchNotifications,
        authModalOpen,
        setAuthModalOpen,
        pendingApplyReqId,
        setPendingApplyReqId,
        triggerAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
