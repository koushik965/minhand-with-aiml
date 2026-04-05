import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
};

// Products — user-facing, analytics stripped server-side
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  search: (q, category) => api.get('/products/search', { params: { q, category } }),
  getById: (id) => api.get(`/products/${id}`),
  compare: (productIds) => api.post('/products/compare', { productIds }),
  getWishlist: () => api.get('/products/wishlist'),
  toggleWishlist: (productId) => api.post(`/products/wishlist/${productId}`),
};

// Ads — analytics stripped server-side before response
export const adAPI = {
  getRecommendations: (limit = 3) => api.get(`/ads/recommend?limit=${limit}`),
  getAllAds: (category) => api.get(`/ads${category ? `?category=${category}` : ''}`),
  recordClick: (adId) => api.post('/ads/click', { adId }),
};

// Interactions
export const interactionAPI = {
  logInteraction: (data) => api.post('/interactions', data),
};

// Admin — returns 403 if user is not admin (enforced server-side)
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getProductStats: () => api.get('/admin/product-stats'),
  getUserStats: () => api.get('/admin/user-stats'),
  getSearchStats: () => api.get('/admin/search-stats'),
  createAd: (data) => api.post('/admin/add-ad', data),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
};

export default api;
