const express = require('express');
const cron = require('node-cron');
const { orders, users, esims } = require('../models/database');

const router = express.Router();

// Automation Scheduler
class AutomationScheduler {
    constructor() {
        this.tasks = new Map();
        this.results = [];
    }

    // Schedule a task
    schedule(id, cronExpression, task) {
        if (this.tasks.has(id)) {
            this.tasks.get(id).stop();
        }
        
        const job = cron.schedule(cronExpression, async () => {
            const result = await task();
            this.results.push({
                taskId: id,
                timestamp: new Date().toISOString(),
                result
            });
            
            // Keep only last 100 results
            if (this.results.length > 100) {
                this.results.shift();
            }
        });
        
        this.tasks.set(id, job);
        return { scheduled: true, taskId: id };
    }

    // Stop a task
    stop(id) {
        if (this.tasks.has(id)) {
            this.tasks.get(id).stop();
            this.tasks.delete(id);
            return { stopped: true, taskId: id };
        }
        return { error: 'Task not found' };
    }

    // Get task results
    getResults(taskId) {
        return this.results.filter(r => r.taskId === taskId);
    }
}

const scheduler = new AutomationScheduler();

// =====================
// AUTOMATION ROUTES
// =====================

// List all automations
router.get('/', (req, res) => {
    res.json({
        automations: [
            {
                id: 'daily-sales-report',
                name: 'Rapport quotidien des ventes',
                schedule: '0 9 * * *',
                status: 'active',
                lastRun: new Date().toISOString(),
                description: 'Génère un rapport quotidien des ventes'
            },
            {
                id: 'hourly-usage-check',
                name: 'Vérification usage horaire',
                schedule: '0 * * * *',
                status: 'active',
                lastRun: new Date().toISOString(),
                description: 'Vérifie l\'utilisation des données chaque heure'
            },
            {
                id: 'weekly-pricing-optimize',
                name: 'Optimisation hebdomadaire des prix',
                schedule: '0 2 * * 1',
                status: 'active',
                lastRun: new Date().toISOString(),
                description: 'Optimise les prix chaque semaine'
            },
            {
                id: 'daily-customer-support',
                name: 'Synthèse support client',
                schedule: '0 18 * * *',
                status: 'active',
                lastRun: new Date().toISOString(),
                description: 'Génère un résumé des interactions support'
            },
            {
                id: 'monthly-inventory-check',
                name: 'Vérification inventaire mensuel',
                schedule: '0 3 1 * *',
                status: 'active',
                lastRun: new Date().toISOString(),
                description: 'Vérifie les niveaux de stock'
            }
        ]
    });
});

// Trigger automation manually
router.post('/:id/trigger', async (req, res) => {
    const { id } = req.params;
    
    const tasks = {
        'daily-sales-report': generateDailySalesReport,
        'hourly-usage-check': generateUsageCheck,
        'weekly-pricing-optimize': runPricingOptimization,
        'daily-customer-support': generateSupportSummary,
        'monthly-inventory-check': runInventoryCheck
    };
    
    if (!tasks[id]) {
        return res.status(404).json({ error: 'Automation not found' });
    }
    
    try {
        const result = await tasks[id]();
        res.json({
            success: true,
            automationId: id,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get automation logs
router.get('/:id/logs', (req, res) => {
    const { id } = req.params;
    const logs = scheduler.getResults(id);
    res.json({ automationId: id, logs });
});

// =====================
// AUTOMATION TASKS
// =====================

// 1. Daily Sales Report
async function generateDailySalesReport() {
    const allOrders = Array.from(orders.values());
    const today = new Date().toISOString().split('T')[0];
    
    const todayOrders = allOrders.filter(o => 
        o.createdAt && o.createdAt.startsWith(today)
    );
    
    const totalRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = todayOrders.length;
    
    const topProducts = {};
    todayOrders.forEach(order => {
        order.items.forEach(item => {
            topProducts[item.country] = (topProducts[item.country] || 0) + 1;
        });
    });
    
    return {
        date: today,
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
        topProducts,
        status: 'generated'
    };
}

// 2. Hourly Usage Check
async function generateUsageCheck() {
    const allEsims = Array.from(esims.values());
    const activeEsims = allEsims.filter(e => e.status === 'active');
    
    // Simulate usage check
    const usageAlerts = activeEsims.filter(() => Math.random() > 0.8);
    
    return {
        timestamp: new Date().toISOString(),
        activeESIMs: activeEsims.length,
        usageAlerts: usageAlerts.length,
        dataRemaining: {
            low: Math.floor(Math.random() * 10),
            medium: Math.floor(Math.random() * 20),
            high: Math.floor(Math.random() * 30)
        },
        status: 'checked'
    };
}

// 3. Weekly Pricing Optimization
async function runPricingOptimization() {
    // Simulate pricing optimization
    const competitors = {
        airalo: 18,
        holafly: 20,
        nomad: 16
    };
    
    const recommendations = [
        { country: 'France', current: 15, recommended: 14, reason: 'High competition' },
        { country: 'USA', current: 25, recommended: 22, reason: 'Price leader opportunity' },
        { country: 'Japon', current: 22, recommended: 20, reason: 'Market demand' }
    ];
    
    return {
        timestamp: new Date().toISOString(),
        competitors,
        recommendations,
        expectedRevenueChange: '+5%',
        status: 'optimized'
    };
}

// 4. Daily Customer Support Summary
async function generateSupportSummary() {
    const stats = {
        totalTickets: Math.floor(Math.random() * 50),
        resolved: Math.floor(Math.random() * 40),
        pending: Math.floor(Math.random() * 10),
        averageResponseTime: Math.floor(Math.random() * 10) + 2,
        topIssues: [
            'Activation eSIM',
            'Recharge data',
            'Problème de réseau',
            'Demande de remboursement'
        ]
    };
    
    return {
        timestamp: new Date().toISOString(),
        stats,
        status: 'generated'
    };
}

// 5. Monthly Inventory Check
async function runInventoryCheck() {
    const products = [
        { id: 'fr-1', name: 'France 5GB', stock: Math.floor(Math.random() * 500), threshold: 100 },
        { id: 'fr-2', name: 'France 10GB', stock: Math.floor(Math.random() * 500), threshold: 100 },
        { id: 'us-1', name: 'USA 5GB', stock: Math.floor(Math.random() * 500), threshold: 100 },
        { id: 'jp-1', name: 'Japon 5GB', stock: Math.floor(Math.random() * 500), threshold: 100 },
        { id: 'uk-1', name: 'UK 5GB', stock: Math.floor(Math.random() * 500), threshold: 100 }
    ];
    
    const lowStock = products.filter(p => p.stock < p.threshold);
    const needsReorder = lowStock.length > 0;
    
    return {
        timestamp: new Date().toISOString(),
        totalProducts: products.length,
        inStock: products.length - lowStock.length,
        lowStock: lowStock.length,
        lowStockProducts: lowStock,
        needsReorder,
        status: 'checked'
    };
}

// Initialize scheduled automations
function initAutomations() {
    // Schedule daily sales report at 9 AM
    scheduler.schedule('daily-sales-report', '0 9 * * *', generateDailySalesReport);
    
    // Schedule hourly usage check
    scheduler.schedule('hourly-usage-check', '0 * * * *', generateUsageCheck);
    
    // Schedule weekly pricing optimization on Monday at 2 AM
    scheduler.schedule('weekly-pricing-optimize', '0 2 * * 1', runPricingOptimization);
    
    // Schedule daily support summary at 6 PM
    scheduler.schedule('daily-customer-support', '0 18 * * *', generateSupportSummary);
    
    // Schedule monthly inventory check on 1st of month at 3 AM
    scheduler.schedule('monthly-inventory-check', '0 3 1 * *', runInventoryCheck);
    
    console.log('🤖 Automations initialized');
}

// Start automations
initAutomations();

module.exports = router;
module.exports.scheduler = scheduler;