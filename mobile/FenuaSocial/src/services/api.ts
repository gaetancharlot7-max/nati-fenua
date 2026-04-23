import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Remplacez par votre URL de production
const API_URL = 'https://fenua-chat-debug.preview.emergentagent.com/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Posts API
export const postsApi = {
  getAll: (params?: object) => api.get('/posts', { params }),
  getOne: (postId: string) => api.get(`/posts/${postId}`),
  create: (data: object) => api.post('/posts', data),
  like: (postId: string) => api.post(`/posts/${postId}/like`),
  react: (postId: string, reaction: string) => api.post(`/posts/${postId}/react`, { reaction }),
  getComments: (postId: string) => api.get(`/posts/${postId}/comments`),
  addComment: (postId: string, content: string) => api.post(`/posts/${postId}/comments`, { content })
};

// Stories API
export const storiesApi = {
  getAll: () => api.get('/stories'),
  create: (data: object) => api.post('/stories', data),
  view: (storyId: string) => api.post(`/stories/${storyId}/view`)
};

// Reels API
export const reelsApi = {
  getAll: (params?: object) => api.get('/reels', { params })
};

// Live API
export const liveApi = {
  getAll: () => api.get('/lives'),
  getOne: (liveId: string) => api.get(`/lives/${liveId}`),
  start: (data: object) => api.post('/lives', data),
  end: (liveId: string) => api.post(`/lives/${liveId}/end`),
  like: (liveId: string) => api.post(`/lives/${liveId}/like`)
};

// Chat API
export const chatApi = {
  getConversations: () => api.get('/conversations'),
  getMessages: (conversationId: string, params?: object) => api.get(`/conversations/${conversationId}/messages`, { params }),
  sendMessage: (data: object) => api.post('/messages', data)
};

// Marketplace API
export const marketplaceApi = {
  getProducts: (params?: object) => api.get('/marketplace/products', { params }),
  getProduct: (productId: string) => api.get(`/marketplace/products/${productId}`),
  createProduct: (data: object) => api.post('/marketplace/products', data),
  getServices: (params?: object) => api.get('/marketplace/services', { params }),
  createService: (data: object) => api.post('/marketplace/services', data),
  getCategories: () => api.get('/marketplace/categories')
};

// Users API
export const usersApi = {
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  getPosts: (userId: string, params?: object) => api.get(`/users/${userId}/posts`, { params }),
  follow: (userId: string) => api.post(`/users/${userId}/follow`),
  updateProfile: (data: object) => api.put('/users/profile', data)
};

// Search API
export const searchApi = {
  search: (params: object) => api.get('/search', { params })
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: object) => api.get('/notifications', { params }),
  markRead: () => api.post('/notifications/read')
};
