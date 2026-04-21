// E-Sim Mobile - API Service
import axios from 'axios';

const API_BASE_URL = 'https://api.esim-electron.com/api';

class APIService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add auth interceptor
        this.api.interceptors.request.use(
            async (config) => {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }

    // Auth
    async register(name, email, password) {
        const response = await this.api.post('/auth/register', { name, email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('authToken', response.data.token);
        }
        return response.data;
    }

    async login(email, password) {
        const response = await this.api.post('/auth/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('authToken', response.data.token);
        }
        return response.data;
    }

    async logout() {
        await AsyncStorage.removeItem('authToken');
    }

    // Products
    async getProducts(region = null) {
        const params = region ? { region } : {};
        const response = await this.api.get('/products', { params });
        return response.data;
    }

    async getProduct(id) {
        const response = await this.api.get(`/products/${id}`);
        return response.data;
    }

    async searchProducts(query) {
        const response = await this.api.get(`/products/search/${query}`);
        return response.data;
    }

    // Orders
    async createOrder(items) {
        const response = await this.api.post('/orders', { items });
        return response.data;
    }

    async getOrders() {
        const response = await this.api.get('/users/orders');
        return response.data;
    }

    async getOrder(id) {
        const response = await this.api.get(`/orders/${id}`);
        return response.data;
    }

    async cancelOrder(id) {
        const response = await this.api.post(`/orders/${id}/cancel`);
        return response.data;
    }

    // eSIM
    async generateESIM(orderId) {
        const response = await this.api.post('/esim/generate', { orderId });
        return response.data;
    }

    async getESIMs() {
        const response = await this.api.get('/esim');
        return response.data;
    }

    async getESIM(id) {
        const response = await this.api.get(`/esim/${id}`);
        return response.data;
    }

    async activateESIM(id) {
        const response = await this.api.post(`/esim/${id}/activate`);
        return response.data;
    }

    async topUpESIM(id, dataPackage) {
        const response = await this.api.post(`/esim/${id}/topup`, { dataPackage });
        return response.data;
    }

    // Dashboard
    async getDashboard() {
        const response = await this.api.get('/users/dashboard');
        return response.data;
    }

    async getProfile() {
        const response = await this.api.get('/users/profile');
        return response.data;
    }

    async updateProfile(name) {
        const response = await this.api.put('/users/profile', { name });
        return response.data;
    }

    // Payment
    async createPaymentSession(orderId) {
        const response = await this.api.post('/payment/create-session', { orderId });
        return response.data;
    }

    // Speed Test
    async runSpeedTest() {
        const response = await this.api.get('/speed-test');
        return response.data;
    }
}

export default new APIService();