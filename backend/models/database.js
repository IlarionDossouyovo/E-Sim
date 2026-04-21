// In-memory database with Prisma support
// Replace with real PostgreSQL in production using Prisma

const users = new Map();
const orders = new Map();
const products = [];
const esims = new Map();

// Prisma client (for production)
let prisma = null;
try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    });
} catch (e) {
    console.log('Prisma not available, using in-memory storage');
}

// Initialize sample products
const sampleProducts = [
  { id: 'fr-1', country: 'France', flag: '🇫🇷', countryCode: 'FR', price: 15, data: '5GB', days: 7, region: 'europe', network: 'Orange & SFR', coverage: '99%' },
  { id: 'fr-2', country: 'France', flag: '🇫🇷', countryCode: 'FR', price: 25, data: '10GB', days: 30, region: 'europe', network: 'Orange & SFR', coverage: '99%' },
  { id: 'es-1', country: 'Espagne', flag: '🇪🇸', countryCode: 'ES', price: 14, data: '5GB', days: 7, region: 'europe', network: 'Movistar & Vodafone', coverage: '98%' },
  { id: 'us-1', country: 'États-Unis', flag: '🇺🇸', countryCode: 'US', price: 25, data: '5GB', days: 7, region: 'americas', network: 'AT&T & T-Mobile', coverage: '99%' },
  { id: 'us-2', country: 'États-Unis', flag: '🇺🇸', countryCode: 'US', price: 45, data: '20GB', days: 30, region: 'americas', network: 'AT&T & T-Mobile', coverage: '99%' },
  { id: 'jp-1', country: 'Japon', flag: '🇯🇵', countryCode: 'JP', price: 22, data: '5GB', days: 7, region: 'asia', network: 'NTT & SoftBank', coverage: '99%' },
  { id: 'jp-2', country: 'Japon', flag: '🇯🇵', countryCode: 'JP', price: 35, data: '10GB', days: 30, region: 'asia', network: 'NTT & SoftBank', coverage: '99%' },
  { id: 'uk-1', country: 'Royaume-Uni', flag: '🇬🇧', countryCode: 'GB', price: 16, data: '5GB', days: 7, region: 'europe', network: 'EE & O2', coverage: '99%' },
  { id: 'de-1', country: 'Allemagne', flag: '🇩🇪', countryCode: 'DE', price: 15, data: '5GB', days: 7, region: 'europe', network: 'Deutsche Telekom', coverage: '99%' },
  { id: 'it-1', country: 'Italie', flag: '🇮🇹', countryCode: 'IT', price: 14, data: '5GB', days: 7, region: 'europe', network: 'TIM & Vodafone', coverage: '98%' },
  { id: 'th-1', country: 'Thaïlande', flag: '🇹🇭', countryCode: 'TH', price: 12, data: '5GB', days: 7, region: 'asia', network: 'AIS & True', coverage: '95%' },
  { id: 'au-1', country: 'Australie', flag: '🇦🇺', countryCode: 'AU', price: 24, data: '5GB', days: 7, region: 'oceania', network: 'Telstra & Optus', coverage: '98%' },
  { id: 'br-1', country: 'Brésil', flag: '🇧🇷', countryCode: 'BR', price: 17, data: '5GB', days: 7, region: 'americas', network: 'Vivo & Claro', coverage: '96%' },
  { id: 'cn-1', country: 'Chine', flag: '🇨🇳', countryCode: 'CN', price: 20, data: '5GB', days: 7, region: 'asia', network: 'China Mobile', coverage: '98%' },
  { id: 'za-1', country: 'Afrique du Sud', flag: '🇿🇦', countryCode: 'ZA', price: 19, data: '5GB', days: 7, region: 'africa', network: 'Vodacom & MTN', coverage: '95%' },
];

// Initialize products
sampleProducts.forEach(p => products.push(p));

// Export for both in-memory and Prisma
module.exports = { 
  users, 
  orders, 
  products, 
  esims,
  prisma  // Prisma client for production
};