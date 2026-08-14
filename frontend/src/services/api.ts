const getApiBaseUrl = () =>
  import.meta.env.VITE_API_URL || '/api';

const getUploadsBaseUrl = () =>
  import.meta.env.VITE_UPLOADS_URL || '/uploads';

function getAuthToken(): string | null {
  return localStorage.getItem('smart_complaint_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message?: string; [key: string]: any }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type if sending FormData (let browser set boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// API methods
export const api = {
  // Auth
  login: (credentials: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => apiRequest('/auth/me'),
  forgotPassword: (email: string) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: any) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  getUsers: (role?: string) => apiRequest(`/auth/users${role ? `?role=${role}` : ''}`),
  updateUserRole: (userId: number, role: string) => apiRequest(`/auth/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  // Complaints
  getComplaints: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/complaints${query ? `?${query}` : ''}`);
  },
  getComplaintById: (id: string) => apiRequest(`/complaints/${id}`),
  createComplaint: (formData: FormData) => apiRequest('/complaints', { method: 'POST', body: formData }),
  aiAnalyzeComplaint: (payload: any) => apiRequest('/complaints/ai-analyze', { method: 'POST', body: JSON.stringify(payload) }),
  updateComplaintStatus: (id: string, formData: FormData) => apiRequest(`/complaints/${id}/status`, { method: 'PATCH', body: formData }),
  assignComplaint: (id: string, assignedTo: number) => apiRequest(`/complaints/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigned_to: assignedTo }) }),
  updatePriority: (id: string, payload: any) => apiRequest(`/complaints/${id}/priority`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addComment: (id: string, text: string, isInternal: boolean = false) => apiRequest(`/complaints/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment_text: text, is_internal: isInternal ? 1 : 0 }) }),
  handleDuplicate: (payload: any) => apiRequest('/complaints/duplicates/merge', { method: 'POST', body: JSON.stringify(payload) }),
  supportComplaint: (id: string) => apiRequest(`/complaints/${id}/support`, { method: 'POST' }),

  // Campus & Analytics
  getBuildings: () => apiRequest('/campus/buildings'),
  getCategories: () => apiRequest('/campus/categories'),
  saveCategory: (categoryData: any) => apiRequest('/campus/categories', { method: 'POST', body: JSON.stringify(categoryData) }),
  getCampusInsights: () => apiRequest('/campus/insights'),
  getAnalytics: () => apiRequest('/campus/analytics'),
  getReports: () => apiRequest('/campus/reports'),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: number) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' })
};
