import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Posts API
export const postsApi = {
  getAll: (params) => api.get('/posts', { params }),
  getOne: (postId) => api.get(`/posts/${postId}`),
  create: (data) => api.post('/posts', data),
  like: (postId) => api.post(`/posts/${postId}/like`),
  react: (postId, reaction) => api.post(`/posts/${postId}/react`, { reaction }),
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  addComment: (postId, content) => api.post(`/posts/${postId}/comments`, { content })
};

// Stories API
export const storiesApi = {
  getAll: () => api.get('/stories'),
  create: (data) => api.post('/stories', data),
  view: (storyId) => api.post(`/stories/${storyId}/view`)
};

// Reels API
export const reelsApi = {
  getAll: (params) => api.get('/reels', { params })
};

// Live API
export const liveApi = {
  getAll: () => api.get('/lives'),
  getOne: (liveId) => api.get(`/lives/${liveId}`),
  start: (data) => api.post('/lives', data),
  end: (liveId) => api.post(`/lives/${liveId}/end`),
  like: (liveId) => api.post(`/lives/${liveId}/like`)
};

// Chat API
export const chatApi = {
  getConversations: () => api.get('/conversations'),
  getMessages: (conversationId, params) => api.get(`/conversations/${conversationId}/messages`, { params }),
  sendMessage: (data) => api.post('/messages', data)
};

// Marketplace API
export const marketplaceApi = {
  getProducts: (params) => api.get('/marketplace/products', { params }),
  getProduct: (productId) => api.get(`/marketplace/products/${productId}`),
  createProduct: (data) => api.post('/marketplace/products', data),
  getServices: (params) => api.get('/marketplace/services', { params }),
  createService: (data) => api.post('/marketplace/services', data),
  getCategories: () => api.get('/marketplace/categories')
};

// Ads API
export const adsApi = {
  getAll: (params) => api.get('/ads', { params }),
  create: (data) => api.post('/ads', data),
  trackClick: (adId) => api.post(`/ads/${adId}/click`),
  getMyAds: () => api.get('/ads/my-ads'),
  getCampaigns: () => api.get('/ads/campaigns'),
  createCampaign: (data) => api.post('/ads/campaigns', data),
  updateCampaignStatus: (campaignId, status) => api.put(`/ads/campaigns/${campaignId}/status`, { status }),
  getPricing: () => api.get('/ads/pricing')
};

// Users API
export const usersApi = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  getPosts: (userId, params) => api.get(`/users/${userId}/posts`, { params }),
  follow: (userId) => api.post(`/users/${userId}/follow`),
  updateProfile: (data) => api.put('/users/profile', data)
};

// Search API
export const searchApi = {
  search: (params) => api.get('/search', { params })
};

// Analytics API
export const analyticsApi = {
  trackEvent: (eventType, eventData) => api.post('/analytics/event', { event_type: eventType, event_data: eventData }),
  getDashboard: () => api.get('/analytics/dashboard')
};

// Notifications API
export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: () => api.post('/notifications/read')
};

// Security API
export const securityApi = {
  getSecurityCheck: () => api.get('/security/check'),
  getPrivacySettings: () => api.get('/privacy/settings'),
  updatePrivacySettings: (data) => api.put('/privacy/settings', data),
  reportContent: (data) => api.post('/report', data),
  getReportTypes: () => api.get('/report/types'),
  blockUser: (userId) => api.post(`/block/${userId}`),
  getBlockedUsers: () => api.get('/blocked'),
  requestDataDownload: () => api.post('/privacy/data-request'),
  deleteAccount: (password) => api.delete('/account', { data: { password } })
};

// Upload API
export const uploadApi = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  uploadBase64: (data, type) => api.post('/upload/base64', { data, type })
};

export default api;
