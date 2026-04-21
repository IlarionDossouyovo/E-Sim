// E-Sim By ELECTRON - eSIM Provider Integration
// Supports multiple eSIM providers

class ESIMProvider {
    constructor() {
        this.provider = null;
        this.config = {};
    }

    // Initialize with provider
    async init(providerName, config) {
        this.provider = providerName;
        this.config = config;

        switch (providerName) {
            case 'gig_sky':
                return new GigSkyProvider(config);
            case 'tata':
                return new TataProvider(config);
            case 'truphone':
                return new TruphoneProvider(config);
            case 'sim_local':
                return new SimLocalProvider(config);
            default:
                throw new Error(`Unknown provider: ${providerName}`);
        }
    }
}

// =========================================
// GigSky Provider Integration
// =========================================
class GigSkyProvider {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
        this.baseUrl = 'https://api.gigsky.com/v1';
    }

    // Get available plans
    async getPlans(countryCode) {
        const response = await fetch(`${this.baseUrl}/plans?country=${countryCode}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.json();
    }

    // Create eSIM order
    async createOrder(planId, email) {
        const response = await fetch(`${this.baseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plan_id: planId,
                customer_email: email,
                callback_url: `${process.env.APP_URL}/api/esim/webhook`
            })
        });

        return response.json();
    }

    // Get order status
    async getOrderStatus(orderId) {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        return response.json();
    }

    // Get eSIM details
    async getESIMDetails(iccid) {
        const response = await fetch(`${this.baseUrl}/esim/${iccid}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        return response.json();
    }

    // Top up eSIM
    async topUp(iccid, planId) {
        const response = await fetch(`${this.baseUrl}/esim/${iccid}/topup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ plan_id: planId })
        });

        return response.json();
    }

    // Get usage
    async getUsage(iccid) {
        const response = await fetch(`${this.baseUrl}/esim/${iccid}/usage`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        return response.json();
    }
}

// =========================================
// Tata Communications Provider
// =========================================
class TataProvider {
    constructor(config) {
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.baseUrl = 'https://api.tatacommunications.com/tata/esim/v1';
    }

    // Authenticate
    async authenticate() {
        const response = await fetch(`${this.baseUrl}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials'
            })
        });

        const data = await response.json();
        this.accessToken = data.access_token;
        return data;
    }

    // Get plans
    async getPlans(countryCode) {
        await this.authenticate();

        const response = await fetch(`${this.baseUrl}/plans?country=${countryCode}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        return response.json();
    }

    // Create eSIM
    async createESIM(planId, customerId) {
        await this.authenticate();

        const response = await fetch(`${this.baseUrl}/esims`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plan_id: planId,
                customer_id: customerId
            })
        });

        return response.json();
    }

    // Get QR code
    async getQRCode(eid) {
        await this.authenticate();

        const response = await fetch(`${this.baseUrl}/esims/${eid}/qrcode`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        return response.json();
    }
}

// =========================================
// Truphone Provider
// =========================================
class TruphoneProvider {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.truphone.com/connect/v1';
    }

    async getPlans(country) {
        const response = await fetch(`${this.baseUrl}/products?country=${country}`, {
            headers: {
                'X-API-Key': this.apiKey
            }
        });

        return response.json();
    }

    async createESIM(productId, msisdn) {
        const response = await fetch(`${this.baseUrl}/devices/esim`, {
            method: 'POST',
            headers: {
                'X-API-Key': this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                msisdn: msisdn
            })
        });

        return response.json();
    }

    async getProfile(eid) {
        const response = await fetch(`${this.baseUrl}/devices/esim/${eid}`, {
            headers: {
                'X-API-Key': this.apiKey
            }
        });

        return response.json();
    }
}

// =========================================
// SimLocal Provider (Generic/Reseller)
// =========================================
class SimLocalProvider {
    constructor(config) {
        this.apiUrl = config.apiUrl;
        this.apiKey = config.apiKey;
    }

    // Generic API calls
    async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.apiUrl}${endpoint}`, options);
        return response.json();
    }

    // Wrapper methods
    async getPlans(countryCode) {
        return this.request(`/plans?country=${countryCode}`);
    }

    async createOrder(planId, email) {
        return this.request('/orders', 'POST', { plan_id: planId, email });
    }

    async getOrder(orderId) {
        return this.request(`/orders/${orderId}`);
    }

    async getESIM(iccid) {
        return this.request(`/esim/${iccid}`);
    }

    async topUp(iccid, planId) {
        return this.request(`/esim/${iccid}/topup`, 'POST', { plan_id: planId });
    }

    async getUsage(iccid) {
        return this.request(`/esim/${iccid}/usage`);
    }
}

// =========================================
// Provider Manager
// =========================================
class ProviderManager {
    constructor() {
        this.providers = new Map();
        this.activeProvider = null;
    }

    // Register provider
    register(name, provider) {
        this.providers.set(name, provider);
    }

    // Set active provider
    setActiveProvider(name) {
        if (!this.providers.has(name)) {
            throw new Error(`Provider ${name} not registered`);
        }
        this.activeProvider = name;
    }

    // Get active provider
    getProvider() {
        return this.providers.get(this.activeProvider);
    }

    // Get all plans
    async getAllPlans(countryCode) {
        const provider = this.getProvider();
        if (!provider) throw new Error('No active provider');

        return provider.getPlans(countryCode);
    }

    // Create order
    async createOrder(planId, email) {
        const provider = this.getProvider();
        if (!provider) throw new Error('No active provider');

        return provider.createOrder(planId, email);
    }

    // Get usage
    async getUsage(iccid) {
        const provider = this.getProvider();
        if (!provider) throw new Error('No active provider');

        return provider.getUsage(iccid);
    }
}

// Export
window.ESIMProvider = ESIMProvider;
window.ProviderManager = ProviderManager;