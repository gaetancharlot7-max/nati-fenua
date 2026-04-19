import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add admin token for admin routes
api.interceptors.request.use((config) => {
  // Check if it's an admin route
  if (config.url && config.url.includes('/admin')) {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  requestPasswordReset: (email) => api.post('/auth/request-password-reset', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// Posts API
export const postsApi = {
  getAll: (params) => api.get('/posts', { params }),
  getPaginated: (params) => api.get('/posts/paginated', { params }),
  getNearby: (lat, lng, radiusKm = 50) => api.get(`/posts/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`),
  getOne: (postId) => api.get(`/posts/${postId}`),
  create: (data) => api.post('/posts', data),
  like: (postId) => api.post(`/posts/${postId}/like`),
  react: (postId, reaction) => api.post(`/posts/${postId}/react`, { reaction }),
  save: (postId) => api.post(`/posts/${postId}/save`),
  getSaved: () => api.get('/saved'),
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  addComment: (postId, content) => api.post(`/posts/${postId}/comments`, { content })
};

// Stories API
export const storiesApi = {
  getAll: () => api.get('/stories'),
  create: (data) => api.post('/stories', data),
  view: (storyId) => api.post(`/stories/${storyId}/view`),
  delete: (storyId) => api.delete(`/stories/${storyId}`)
};

// Reels API
export const reelsApi = {
  getAll: (params) => api.get('/reels', { params })
};

// Live API
export const liveApi = {
  getAll: () => api.get('/lives'),
  get: (liveId) => api.get(`/lives/${liveId}`),
  getOne: (liveId) => api.get(`/lives/${liveId}`),
  start: (data) => api.post('/lives', data),
  end: (liveId) => api.post(`/lives/${liveId}/end`),
  like: (liveId) => api.post(`/lives/${liveId}/like`)
};

// Chat API
export const chatApi = {
  getConversations: () => api.get('/conversations'),
  getMessages: (conversationId, params) => api.get(`/conversations/${conversationId}/messages`, { params }),
  sendMessage: (data) => api.post('/messages', data),
  createConversation: (userId) => api.post('/conversations', { user_id: userId }),
  markAsRead: (conversationId) => api.post(`/conversations/${conversationId}/read`),
  searchUsers: (query) => api.get('/users/search', { params: { q: query, limit: 10 } }),
  deleteConversation: (conversationId) => api.delete(`/conversations/${conversationId}`)
};

// Marketplace API
export const marketplaceApi = {
  getProducts: (params) => api.get('/marketplace/products', { params }),
  getProduct: (productId) => api.get(`/marketplace/products/${productId}`),
  createProduct: (data) => api.post('/marketplace/products', data),
  getServices: (params) => api.get('/marketplace/services', { params }),
  createService: (data) => api.post('/marketplace/services', data),
  getCategories: () => api.get('/marketplace/categories'),
  likeProduct: (productId) => api.post(`/marketplace/products/${productId}/like`),
  likeService: (serviceId) => api.post(`/marketplace/services/${serviceId}/like`),
  getFavorites: () => api.get('/marketplace/favorites')
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
  getFollowers: (userId) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId) => api.get(`/users/${userId}/following`),
  getFriends: () => api.get('/users/me/friends'),
  follow: (userId) => api.post(`/users/${userId}/follow`),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePrivacy: (settings) => api.put('/users/profile', { profile_visibility: settings }),
  searchUsers: (query) => api.get('/users/search', { params: { q: query } }),
  search: (query) => api.get('/search/users', { params: { q: query, limit: 10 } })
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
  markRead: () => api.post('/notifications/read'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  subscribe: (subscription) => api.post('/notifications/subscribe', subscription),
  unsubscribe: () => api.delete('/notifications/unsubscribe'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (data) => api.put('/notifications/settings', data)
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

// Moderation API (enhanced)
export const moderationApi = {
  getCategories: () => api.get('/moderation/categories'),
  createReport: (data) => api.post('/moderation/report', data),
};

// GDPR API
export const gdprApi = {
  getConsentTypes: () => api.get('/gdpr/consent-types'),
  recordConsent: (consentType, granted) => api.post('/gdpr/consent', { consent_type: consentType, granted }),
  getMyConsents: () => api.get('/gdpr/my-consents'),
  exportData: () => api.post('/gdpr/export-data'),
  downloadData: () => api.get('/gdpr/download-data', { responseType: 'blob' }),
  requestDeletion: () => api.post('/gdpr/request-deletion'),
  cancelDeletion: () => api.post('/gdpr/cancel-deletion'),
  validateAge: (birthDate) => api.post('/gdpr/validate-age', { birth_date: birthDate }),
};

// Admin API
export const adminApi = {
  login: (email, password) => api.post('/admin/login', { email, password }),
  getDashboard: () => api.get('/admin/dashboard'),
  // Moderation
  getReports: (params) => api.get('/admin/moderation/reports', { params }),
  getReportStats: (days = 30) => api.get(`/admin/moderation/stats?days=${days}`),
  resolveReport: (reportId, action, notes) => api.post(`/admin/moderation/reports/${reportId}/resolve`, { action, notes }),
  getUserWarnings: (userId) => api.get(`/admin/moderation/user/${userId}/warnings`),
  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),
  getUserAnalytics: (days = 30) => api.get(`/admin/analytics/users?days=${days}`),
  getContentAnalytics: () => api.get('/admin/analytics/content'),
  getGeoAnalytics: () => api.get('/admin/analytics/geography'),
  // Monitoring
  getMonitoring: () => api.get('/admin/monitoring'),
  getErrors: (limit = 50) => api.get(`/admin/monitoring/errors?limit=${limit}`),
  // Users
  banUser: (userId) => api.post(`/admin/users/${userId}/ban`),
  // Posts
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),
  // Lives
  endLive: (liveId) => api.post(`/admin/lives/${liveId}/end`),
  // Storage
  getStorage: () => api.get('/admin/storage'),
  triggerCleanup: () => api.post('/admin/storage/cleanup'),
  deleteMedia: (mediaId) => api.delete(`/admin/media/${mediaId}`),
  // Settings
  updateModerationSettings: (data) => api.put('/admin/moderation/settings', data),
  updateAdsSettings: (data) => api.put('/admin/ads/settings', data),
  // Auto Publisher
  getAutoPublishStats: () => api.get('/admin/auto-publish/stats'),
  triggerAutoPublish: (data) => api.post('/admin/auto-publish/trigger', data),
};

// Upload API
export const uploadApi = {
  uploadFile: async (file, mediaType = 'video', onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(`/upload?media_type=${mediaType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  },
  uploadBase64: (data, type) => api.post('/upload/base64', { data, type }),
  getStorageUsage: () => api.get('/users/me/storage')
};

// Storage API
export const storageApi = {
  getUsage: (userId) => api.get(`/users/${userId}/storage`),
  getMyUsage: () => api.get('/users/me/storage')
};

// Cloudinary Upload API
export const cloudinaryApi = {
  // Get signature for direct upload
  getSignature: async (folder = 'posts', resourceType = 'image') => {
    const response = await api.get(`/cloudinary/signature?folder=${folder}&resource_type=${resourceType}`);
    return response.data;
  },
  
  // Check if Cloudinary is enabled
  isEnabled: async () => {
    try {
      const response = await api.get('/cloudinary/status');
      return response.data.enabled;
    } catch {
      return false;
    }
  },
  
  // Upload image directly to Cloudinary (signed upload)
  uploadImage: async (file, folder = 'posts') => {
    try {
      // Get signature from backend
      const sig = await cloudinaryApi.getSignature(folder, 'image');
      
      // Create form data for Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.api_key);
      formData.append('timestamp', sig.timestamp);
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);
      
      // Upload directly to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Upload video directly to Cloudinary
  uploadVideo: async (file, folder = 'posts') => {
    try {
      const sig = await cloudinaryApi.getSignature(folder, 'video');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.api_key);
      formData.append('timestamp', sig.timestamp);
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`,
        { method: 'POST', body: formData }
      );
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        duration: result.duration
      };
    } catch (error) {
      console.error('Cloudinary video upload error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Upload any file (auto-detect type)
  upload: async (file, folder = 'posts') => {
    const isVideo = file.type?.startsWith('video/');
    return isVideo 
      ? cloudinaryApi.uploadVideo(file, folder)
      : cloudinaryApi.uploadImage(file, folder);
  }
};

export default api;
