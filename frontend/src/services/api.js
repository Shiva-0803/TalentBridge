import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

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
  sendOtp: async (email) => {
    const res = await api.post('/auth/send-otp', { email });
    return res.data;
  },
  verifyOtp: async (email, otpCode, firstName = null, lastName = null, mobile = null) => {
    const res = await api.post('/auth/verify-otp', {
      email,
      otp_code: otpCode,
      first_name: firstName,
      last_name: lastName,
      mobile: mobile,
    });
    return res.data;
  },
  adminLogin: async (email, password) => {
    const res = await api.post('/auth/admin-login', { email, password });
    return res.data;
  },
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// Requisitions Service
export const requisitionService = {
  getPublicRequisitions: async (params = {}) => {
    const res = await api.get('/requisitions/public', { params });
    return res.data;
  },
  getFilterOptions: async () => {
    const res = await api.get('/requisitions/public/filters');
    return res.data;
  },
  getPublicRequisitionDetail: async (reqId) => {
    const res = await api.get(`/requisitions/public/${reqId}`);
    return res.data;
  },
  getAdminRequisitions: async () => {
    const res = await api.get('/requisitions/admin/all');
    return res.data;
  },
  createRequisition: async (reqData) => {
    const res = await api.post('/requisitions/admin', reqData);
    return res.data;
  },
  updateRequisition: async (id, reqData) => {
    const res = await api.put(`/requisitions/admin/${id}`, reqData);
    return res.data;
  },
  duplicateRequisition: async (id) => {
    const res = await api.post(`/requisitions/admin/${id}/duplicate`);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/requisitions/admin/${id}/status?status_val=${status}`);
    return res.data;
  },
  deleteRequisition: async (id) => {
    const res = await api.delete(`/requisitions/admin/${id}`);
    return res.data;
  },
};

// Applications Service
export const applicationService = {
  submitApplication: async (formData) => {
    const res = await api.post('/applications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getMyApplications: async () => {
    const res = await api.get('/applications/my');
    return res.data;
  },
  getAdminApplicationsGrid: async (params = {}) => {
    const res = await api.get('/applications/admin/grid', { params });
    return res.data;
  },
  getFullApplicationDetail: async (appId) => {
    const res = await api.get(`/applications/admin/detail/${appId}`);
    return res.data;
  },
  updateApplicationStatus: async (appId, status) => {
    const res = await api.patch(`/applications/admin/${appId}/status`, { status });
    return res.data;
  },
  getResumeDownloadUrl: (appId) => {
    return `${API_BASE_URL}/applications/resume/${appId}`;
  },
  getExportCsvUrl: (reqId = null) => {
    return `${API_BASE_URL}/applications/admin/export-csv${reqId ? `?requisition_id=${reqId}` : ''}`;
  },
  updateResume: async (appId, file) => {
    const formData = new FormData();
    formData.append('resume_file', file);
    const res = await api.put(`/applications/resume/${appId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// Notifications Service
export const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

export default api;
