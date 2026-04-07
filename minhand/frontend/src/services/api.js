import axios from 'axios';
console.log("🌍 API BASE URL:", process.env.REACT_APP_API_URL);
const api = axios.create({
  
  baseURL: process.env.REACT_APP_API_URL + "/api",
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('mh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, e => Promise.reject(e));

api.interceptors.response.use(r => r, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem('mh_token');
    localStorage.removeItem('mh_user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export const authAPI = {
  register: d => api.post('/users/register', d),
  login: d => api.post('/users/login', d),
  getProfile: () => api.get('/users/profile'),
};

export const productAPI = {
  getAll: params => api.get('/products', { params }),
  search: (q, category) => api.get('/products/search', { params: { q, category } }),
  getById: id => api.get(`/products/${id}`),
  compare: productIds => api.post('/products/compare', { productIds }),
  getWishlist: () => api.get('/products/wishlist'),
  toggleWishlist: productId => api.post(`/products/wishlist/${productId}`),
};

export const adAPI = {
  getRecommendations: (limit = 3) => api.get(`/ads/recommend?limit=${limit}`),
  recordClick: adId => api.post('/ads/click', { adId }),
};

export const interactionAPI = {
  log: data => api.post('/interactions', data),
};

export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  createAd: data => api.post('/admin/ads', data),
  createProduct: data => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: id => api.delete(`/admin/products/${id}`),
};

export default api;

// ML admin endpoints (admin only)
export const mlAdminAPI = {
  getStats:   () => api.get('/admin/ml/stats'),
  trainNow:   () => api.post('/admin/ml/train'),
  getHealth:  () => api.get('/admin/ml/health'),
  explain:    (adId, userId) => api.get(`/admin/ml/explain/${adId}?userId=${userId}`),
};
