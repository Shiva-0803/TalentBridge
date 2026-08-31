import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Service
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  adminLogin: async (email, password) => {
    const response = await api.post('/auth/admin-login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (email, otp_code, new_password) => {
    const response = await api.post('/auth/reset-password', { email, otp_code, new_password });
    return response.data;
  },
};

// Requisitions Service
export const requisitionsService = {
  getPublicList: async (params = {}) => {
    const response = await api.get('/requisitions/public', { params });
    return response.data;
  },
  getPublicFilters: async () => {
    const response = await api.get('/requisitions/public/filters');
    return response.data;
  },
  getPublicDetail: async (id) => {
    const response = await api.get(`/requisitions/public/${id}`);
    return response.data;
  },
  getAdminList: async (params = {}) => {
    const response = await api.get('/requisitions/admin', { params });
    return response.data;
  },
  getAdminDetail: async (id) => {
    const response = await api.get(`/requisitions/admin/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/requisitions/admin', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/requisitions/admin/${id}`, data);
    return response.data;
  },
  clone: async (id) => {
    const response = await api.post(`/requisitions/admin/${id}/clone`);
    return response.data;
  },
  deleteRequisition: async (id) => {
    const response = await api.delete(`/requisitions/admin/${id}`);
    return response.data;
  },
};

// Applications Service
export const applicationsService = {
  submitApplication: async (formData) => {
    const response = await api.post('/applications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getMyApplications: async () => {
    const response = await api.get('/applications/my');
    return response.data;
  },
  updateResume: async (appId, formData) => {
    const response = await api.put(`/applications/resume/${appId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getAdminGrid: async (params = {}) => {
    const response = await api.get('/applications/admin/grid', { params });
    return response.data;
  },
  getAdminDetail: async (id) => {
    const response = await api.get(`/applications/admin/detail/${id}`);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/applications/admin/${id}/status`, { status });
    return response.data;
  },
  getResumeUrl: (appId) => {
    return `${API_BASE_URL}/applications/admin/resume/${appId}`;
  },
  exportCsv: async (params = {}) => {
    const response = await api.get('/applications/admin/export-csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// Notifications Service
export const notificationsService = {
  getList: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  markRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};

// Aliases for singular vs plural imports
export const requisitionService = requisitionsService;
export const applicationService = applicationsService;
export const notificationService = notificationsService;

export default api;
