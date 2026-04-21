// E-Sim By ELECTRON - Frontend API Client

const API_BASE_URL = window.location.origin + '/api';

// Store auth token
let authToken = localStorage.getItem('esim_token') || null;

// API Helper
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
const AuthAPI = {
  register: async (name, email, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    
    if (data.token) {
      authToken = data.token;
      localStorage.setItem('esim_token', data.token);
    }
    
    return data;
  },
  
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      authToken = data.token;
      localStorage.setItem('esim_token', data.token);
    }
    
    return data;
  },
  
  logout: () => {
    authToken = null;
    localStorage.removeItem('esim_token');
  },
  
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },
  
  isAuthenticated: () => {
    return !!authToken;
  }
};

// Products API
const ProductsAPI = {
  getAll: async (region = null) => {
    const query = region ? `?region=${region}` : '';
    return await apiRequest(`/products${query}`);
  },
  
  getById: async (id) => {
    return await apiRequest(`/products/${id}`);
  },
  
  search: async (query) => {
    return await apiRequest(`/products/search/${query}`);
  },
  
  getFeatured: async () => {
    return await apiRequest('/products/featured/list');
  }
};

// Orders API
const OrdersAPI = {
  create: async (items) => {
    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },
  
  getAll: async () => {
    return await apiRequest('/users/orders');
  },
  
  getById: async (id) => {
    return await apiRequest(`/orders/${id}`);
  },
  
  cancel: async (id) => {
    return await apiRequest(`/orders/${id}/cancel`, {
      method: 'POST'
    });
  }
};

// eSIM API
const ESIMAPI = {
  generate: async (orderId) => {
    return await apiRequest('/esim/generate', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });
  },
  
  getAll: async () => {
    return await apiRequest('/esim');
  },
  
  getById: async (id) => {
    return await apiRequest(`/esim/${id}`);
  },
  
  getQRCode: async (id) => {
    return await apiRequest(`/esim/${id}/qrcode`);
  },
  
  activate: async (id) => {
    return await apiRequest(`/esim/${id}/activate`, {
      method: 'POST'
    });
  },
  
  topup: async (id, dataPackage) => {
    return await apiRequest(`/esim/${id}/topup`, {
      method: 'POST',
      body: JSON.stringify({ dataPackage })
    });
  }
};

// Payment API
const PaymentAPI = {
  createSession: async (orderId) => {
    return await apiRequest('/payment/create-session', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });
  },
  
  verify: async (orderId, sessionId, status) => {
    return await apiRequest('/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, sessionId, status })
    });
  },
  
  getStatus: async (orderId) => {
    return await apiRequest(`/payment/status/${orderId}`);
  }
};

// User Dashboard API
const UserAPI = {
  getProfile: async () => {
    return await apiRequest('/users/profile');
  },
  
  updateProfile: async (name) => {
    return await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  },
  
  getDashboard: async () => {
    return await apiRequest('/users/dashboard');
  }
};

// Export for use in frontend
window.esimAPI = {
  auth: AuthAPI,
  products: ProductsAPI,
  orders: OrdersAPI,
  esim: ESIMAPI,
  payment: PaymentAPI,
  user: UserAPI,
  isAuthenticated: AuthAPI.isAuthenticated
};