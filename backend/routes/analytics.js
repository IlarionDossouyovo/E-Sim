// E-Sim By ELECTRON - Advanced Analytics
// Complete analytics dashboard with revenue, users, geolocation, and reporting

const express = require('express');
const { users, orders, esims, products } = require('../models/database');

const router = express.Router();

// =====================
// OVERVIEW ANALYTICS
// =====================

router.get('/overview', (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Calculate metrics
        const allOrders = Array.from(orders.values());
        const allUsers = Array.from(users.values());
        const allEsims = Array.from(esims.values());
        
        // Revenue (last 30 days)
        const revenueLast30d = allOrders
            .filter(o => new Date(o.createdAt) >= thirtyDaysAgo && o.paymentStatus === 'PAID')
            .reduce((sum, o) => sum + (o.total || 0), 0);
        
        // Revenue (last 7 days)
        const revenueLast7d = allOrders
            .filter(o => new Date(o.createdAt) >= sevenDaysAgo && o.paymentStatus === 'PAID')
            .reduce((sum, o) => sum + (o.total || 0), 0);
        
        // Order count
        const ordersLast30d = allOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo).length;
        const ordersLast7d = allOrders.filter(o => new Date(o.createdAt) >= sevenDaysAgo).length;
        
        // User count
        const newUsersLast30d = allUsers.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;
        const newUsersLast7d = allUsers.filter(u => new Date(u.createdAt) >= sevenDaysAgo).length;
        
        // Active eSIMs
        const activeEsims = allEsims.filter(e => e.status === 'ACTIVE').length;
        const expiringEsims = allEsims.filter(e => {
            if (!e.expiresAt) return false;
            const daysUntilExpiry = (new Date(e.expiresAt) - now) / (24 * 60 * 60 * 1000);
            return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
        }).length;
        
        res.json({
            revenue: {
                last30days: revenueLast30d,
                last7days: revenueLast7d,
                averagePerOrder: ordersLast30d > 0 ? revenueLast30d / ordersLast30d : 0
            },
            orders: {
                last30days: ordersLast30d,
                last7days: ordersLast7d,
                conversionRate: allUsers.length > 0 
                    ? (ordersLast30d / allUsers.length * 100).toFixed(1) 
                    : 0
            },
            users: {
                total: allUsers.length,
                newLast30days: newUsersLast30d,
                newLast7days: newUsersLast7d
            },
            esims: {
                active: activeEsims,
                expiringSoon: expiringEsims
            },
            period: {
                from: thirtyDaysAgo.toISOString(),
                to: now.toISOString()
            }
        });
        
    } catch (error) {
        console.error('Analytics overview error:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

// =====================
// REVENUE ANALYTICS
// =====================

router.get('/revenue', (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        const now = new Date();
        const periods = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365
        };
        
        const days = periods[period] || 30;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        const allOrders = Array.from(orders.values())
            .filter(o => new Date(o.createdAt) >= startDate && o.paymentStatus === 'PAID');
        
        // Group by day
        const dailyRevenue = {};
        
        for (const order of allOrders) {
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.total || 0);
        }
        
        // Calculate totals
        const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
        
        // Projections
        const dailyAvg = totalRevenue / days;
        const monthlyProjection = dailyAvg * 30;
        const yearlyProjection = dailyAvg * 365;
        
        res.json({
            total: totalRevenue,
            orders: allOrders.length,
            averageOrderValue: avgOrderValue.toFixed(2),
            projections: {
                monthly: monthlyProjection.toFixed(2),
                yearly: yearlyProjection.toFixed(2)
            },
            daily: Object.entries(dailyRevenue).map(([date, revenue]) => ({
                date,
                revenue: revenue.toFixed(2)
            })),
            period
        });
        
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({ error: 'Failed to get revenue analytics' });
    }
});

// =====================
// USER ANALYTICS
// =====================

router.get('/users', (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        const now = new Date();
        const periods = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365
        };
        
        const days = periods[period] || 30;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        const allUsers = Array.from(users.values())
            .filter(u => new Date(u.createdAt) >= startDate);
        
        // Group by day
        const dailyNewUsers = {};
        
        for (const user of allUsers) {
            const date = new Date(user.createdAt).toISOString().split('T')[0];
            dailyNewUsers[date] = (dailyNewUsers[date] || 0) + 1;
        }
        
        // User roles
        const roles = {};
        for (const user of allUsers) {
            roles[user.role || 'USER'] = (roles[user.role || 'USER'] || 0) + 1;
        }
        
        // Email verified
        const verified = allUsers.filter(u => u.emailVerified).length;
        
        res.json({
            total: allUsers.length,
            averagePerDay: (allUsers.length / days).toFixed(1),
            emailVerified: verified,
            verifiedRate: `${(verified / allUsers.length * 100).toFixed(1)}%`,
            roles,
            daily: Object.entries(dailyNewUsers).map(([date, count]) => ({
                date,
                users: count
            })),
            period
        });
        
    } catch (error) {
        console.error('User analytics error:', error);
        res.status(500).json({ error: 'Failed to get user analytics' });
    }
});

// =====================
// PRODUCT ANALYTICS
// =====================

router.get('/products', (req, res) => {
    try {
        const allOrders = Array.from(orders.values());
        
        // Count by product
        const productSales = {};
        
        for (const order of allOrders) {
            if (order.items) {
                for (const item of order.items) {
                    const productId = item.productId;
                    productSales[productId] = (productSales[productId] || 0) + 1;
                }
            }
        }
        
        // Get product details
        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([productId, sales]) => {
                const product = products.find(p => p.id === productId);
                return {
                    id: productId,
                    country: product?.country || 'Unknown',
                    flag: product?.flag || '',
                    sales,
                    revenue: product?.price * sales || 0
                };
            });
        
        // Best selling
        const bestSeller = topProducts[0] || null;
        
        res.json({
            topProducts,
            bestSeller,
            totalProducts: products.length,
            period: 'all-time'
        });
        
    } catch (error) {
        console.error('Product analytics error:', error);
        res.status(500).json({ error: 'Failed to get product analytics' });
    }
});

// =====================
// GEOGRAPHIC ANALYTICS
// =====================

router.get('/geography', (req, res) => {
    try {
        const allOrders = Array.from(orders.values());
        const allUsers = Array.from(users.values());
        
        // Country distribution from orders
        const countryOrders = {};
        
        for (const order of allOrders) {
            if (order.items) {
                for (const item of order.items) {
                    const country = item.country || 'Unknown';
                    countryOrders[country] = (countryOrders[country] || 0) + 1;
                }
            }
        }
        
        // Top countries
        const topCountries = Object.entries(countryOrders)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([country, orders]) => {
                const product = products.find(p => p.country === country);
                return {
                    country,
                    flag: product?.flag || '',
                    orders,
                    percentage: `${(orders / allOrders.length * 100).toFixed(1)}%`
                };
            });
        
        res.json({
            topCountries,
            totalCountries: Object.keys(countryOrders).length,
            period: 'all-time'
        });
        
    } catch (error) {
        console.error('Geography analytics error:', error);
        res.status(500).json({ error: 'Failed to get geography analytics' });
    }
});

// =====================
// REAL-TIME METRICS (WebSocket ready)
// =====================

router.get('/realtime', (req, res) => {
    try {
        const now = new Date();
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
        
        const ordersLastHour = Array.from(orders.values())
            .filter(o => new Date(o.createdAt) >= lastHour).length;
        
        const activeUsersLastHour = Array.from(users.values())
            .filter(u => new Date(u.lastLogin) >= lastHour).length;
        
        res.json({
            timestamp: now.toISOString(),
            ordersLastHour,
            activeUsersLastHour,
            serverStatus: 'healthy'
        });
        
    } catch (error) {
        console.error('Realtime analytics error:', error);
        res.status(500).json({ error: 'Failed to get realtime analytics' });
    }
});

// =====================
// TRENDS & PREDICTIONS
// =====================

router.get('/trends', (req, res) => {
    try {
        const now = new Date();
        
        // Compare last 7 days vs previous 7 days
        const currentWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        const allOrders = Array.from(orders.values());
        
        const currentWeekOrders = allOrders.filter(
            o => new Date(o.createdAt) >= currentWeekStart && o.paymentStatus === 'PAID'
        );
        const previousWeekOrders = allOrders.filter(
            o => new Date(o.createdAt) >= previousWeekStart && 
            new Date(o.createdAt) < currentWeekStart &&
            o.paymentStatus === 'PAID'
        );
        
        const currentRevenue = currentWeekOrders.reduce((s, o) => s + (o.total || 0), 0);
        const previousRevenue = previousWeekOrders.reduce((s, o) => s + (o.total || 0), 0);
        
        const revenueGrowth = previousRevenue > 0 
            ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
            : 0;
        
        const ordersGrowth = previousWeekOrders.length > 0
            ? ((currentWeekOrders.length - previousWeekOrders.length) / previousWeekOrders.length * 100).toFixed(1)
            : 0;
        
        res.json({
            revenue: {
                current: currentRevenue.toFixed(2),
                previous: previousRevenue.toFixed(2),
                growth: revenueGrowth,
                trend: parseFloat(revenueGrowth) > 0 ? 'up' : 'down'
            },
            orders: {
                current: currentWeekOrders.length,
                previous: previousWeekOrders.length,
                growth: ordersGrowth,
                trend: parseFloat(ordersGrowth) > 0 ? 'up' : 'down'
            }
        });
        
    } catch (error) {
        console.error('Trends analytics error:', error);
        res.status(500).json({ error: 'Failed to get trends' });
    }
});

module.exports = router;