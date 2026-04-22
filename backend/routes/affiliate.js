// E-Sim By ELECTRON - Affiliate System
// Commission tracking and referral management

const express = require('express');
const crypto = require('crypto');
const { users, orders } = require('../models/database');

const router = express.Router();

// In-memory affiliate storage (use database in production)
const affiliates = new Map();
const referrals = new Map();
const commissions = new Map();

// Commission rates configuration
const COMMISSION_RATES = {
    standard: 0.10,    // 10% commission
    silver: 0.15,     // 15% commission
    gold: 0.20,       // 20% commission
    platinum: 0.25    // 25% commission
};

// =====================
// CREATE AFFILIATE ACCOUNT
// =====================

router.post('/register', async (req, res) => {
    try {
        const { userId, platform } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        
        // Generate unique affiliate code
        const affiliateCode = generateAffiliateCode();
        
        const affiliate = {
            id: 'aff-' + Date.now(),
            userId,
            code: affiliateCode,
            platform: platform || 'website',
            rate: COMMISSION_RATES.standard,
            status: 'active',
            totalClicks: 0,
            totalConversions: 0,
            totalEarnings: 0,
            pendingCommission: 0,
            paidCommission: 0,
            createdAt: new Date().toISOString()
        };
        
        affiliates.set(affiliate.id, affiliate);
        
        // Track referrals for this affiliate
        if (!referrals.has(userId)) {
            referrals.set(userId, []);
        }
        
        res.json({
            success: true,
            affiliate: {
                id: affiliate.id,
                code: affiliate.code,
                rate: affiliate.rate,
                dashboardUrl: `${process.env.FRONTEND_URL}/affiliate/${affiliate.code}`
            }
        });
        
    } catch (error) {
        console.error('Affiliate register error:', error);
        res.status(500).json({ error: 'Failed to create affiliate account' });
    }
});

// =====================
// GET AFFILIATE INFO
// =====================

router.get('/info/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const affiliate = Array.from(affiliates.values()).find(a => a.userId === userId);
        
        if (!affiliate) {
            return res.status(404).json({ error: 'No affiliate account found' });
        }
        
        res.json({
            id: affiliate.id,
            code: affiliate.code,
            rate: affiliate.rate,
            status: affiliate.status,
            stats: {
                clicks: affiliate.totalClicks,
                conversions: affiliate.totalConversions,
                earnings: affiliate.totalEarnings,
                pending: affiliate.pendingCommission,
                paid: affiliate.paidCommission
            },
            dashboardUrl: `${process.env.FRONTEND_URL}/affiliate/${affiliate.code}`
        });
        
    } catch (error) {
        console.error('Get affiliate error:', error);
        res.status(500).json({ error: 'Failed to get affiliate info' });
    }
});

// =====================
// TRACK CLICK
// =====================

router.post('/click', async (req, res) => {
    try {
        const { affiliateCode, landingPage } = req.body;
        
        if (!affiliateCode) {
            return res.status(400).json({ error: 'affiliateCode is required' });
        }
        
        const affiliate = Array.from(affiliates.values()).find(a => a.code === affiliateCode);
        
        if (!affiliate) {
            return res.status(404).json({ error: 'Invalid affiliate code' });
        }
        
        // Increment clicks
        affiliate.totalClicks += 1;
        affiliates.set(affiliate.id, affiliate);
        
        res.json({
            success: true,
            clickId: 'click-' + Date.now()
        });
        
    } catch (error) {
        console.error('Track click error:', error);
        res.status(500).json({ error: 'Failed to track click' });
    }
});

// =====================
// TRACK CONVERSION / SIGNUP
// =====================

router.post('/convert', async (req, res) => {
    try {
        const { affiliateCode, newUserId, orderTotal } = req.body;
        
        if (!affiliateCode || !newUserId) {
            return res.status(400).json({ error: 'affiliateCode and newUserId are required' });
        }
        
        const affiliate = Array.from(affiliates.values()).find(a => a.code === affiliateCode);
        
        if (!affiliate) {
            return res.status(404).json({ error: 'Invalid affiliate code' });
        }
        
        // Calculate commission
        const orderAmount = orderTotal || 0;
        const commission = orderAmount * affiliate.rate;
        
        // Update affiliate stats
        affiliate.totalConversions += 1;
        affiliate.pendingCommission += commission;
        affiliates.set(affiliate.id, affiliate);
        
        // Record conversion
        const conversionId = 'conv-' + Date.now();
        const conversion = {
            id: conversionId,
            affiliateId: affiliate.id,
            newUserId,
            orderTotal,
            commission,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        commissions.set(conversionId, conversion);
        
        res.json({
            success: true,
            conversionId,
            commission,
            message: 'Conversion tracked successfully'
        });
        
    } catch (error) {
        console.error('Track conversion error:', error);
        res.status(500).json({ error: 'Failed to track conversion' });
    }
});

// =====================
// GET COMMISSION HISTORY
// =====================

router.get('/commissions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const affiliate = Array.from(affiliates.values()).find(a => a.userId === userId);
        
        if (!affiliate) {
            return res.status(404).json({ error: 'No affiliate account found' });
        }
        
        // Get all commissions for this affiliate
        const affiliateCommissions = Array.from(commissions.values())
            .filter(c => c.affiliateId === affiliate.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({
            stats: {
                totalEarnings: affiliate.totalEarnings,
                pending: affiliate.pendingCommission,
                paid: affiliate.paidCommission,
                conversions: affiliate.totalConversions
            },
            history: affiliateCommissions
        });
        
    } catch (error) {
        console.error('Get commissions error:', error);
        res.status(500).json({ error: 'Failed to get commissions' });
    }
});

// =====================
// REQUEST PAYOUT
// =====================

router.post('/payout', async (req, res) => {
    try {
        const { userId, amount, paymentMethod } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({ error: 'userId and amount are required' });
        }
        
        const affiliate = Array.from(affiliates.values()).find(a => a.userId === userId);
        
        if (!affiliate) {
            return res.status(404).json({ error: 'No affiliate account found' });
        }
        
        if (affiliate.pendingCommission < amount) {
            return res.status(400).json({ error: 'Insufficient pending commission' });
        }
        
        // Process payout (in production, integrate with payment provider)
        affiliate.pendingCommission -= amount;
        affiliate.paidCommission += amount;
        affiliates.set(affiliate.id, affiliate);
        
        const payoutId = 'payout-' + Date.now();
        
        // In production, send payout request to payment provider
        console.log(`💰 Payout requested: ${amount}€ to user ${userId} via ${paymentMethod}`);
        
        res.json({
            success: true,
            payoutId,
            amount,
            status: 'processing',
            message: 'Payout request submitted'
        });
        
    } catch (error) {
        console.error('Payout error:', error);
        res.status(500).json({ error: 'Failed to process payout' });
    }
});

// =====================
// GET AFFILIATE DASHBOARD DATA
// =====================

router.get('/dashboard/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const affiliate = Array.from(affiliates.values()).find(a => a.userId === userId);
        
        if (!affiliate) {
            return res.status(404).json({ error: 'No affiliate account found' });
        }
        
        // Get recent conversions
        const recentConversions = Array.from(commissions.values())
            .filter(c => c.affiliateId === affiliate.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
        
        // Calculate conversion rate
        const conversionRate = affiliate.totalClicks > 0 
            ? (affiliate.totalConversions / affiliate.totalClicks * 100).toFixed(2)
            : 0;
        
        res.json({
            code: affiliate.code,
            link: `${process.env.FRONTEND_URL}?ref=${affiliate.code}`,
            stats: {
                clicks: affiliate.totalClicks,
                conversions: affiliate.totalConversions,
                conversionRate,
                earnings: affiliate.totalEarnings,
                pending: affiliate.pendingCommission,
                paid: affiliate.paidCommission
            },
            tier: getTier(affiliate.totalEarnings),
            rate: affiliate.rate,
            recentConversions
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

// =====================
// UPGRADE TIER
// =====================

router.post('/upgrade-tier', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const affiliate = Array.from(affiliates.values()).find(a => a.userId === userId);
        
        if (!affiliate) {
            return res.status(404).json({ error: 'No affiliate account found' });
        }
        
        const newTier = getTier(affiliate.totalEarnings);
        
        if (newTier !== getTier(affiliate.totalEarnings, true)) {
            affiliate.rate = COMMISSION_RATES[newTier];
            affiliates.set(affiliate.id, affiliate);
        }
        
        res.json({
            success: true,
            tier: newTier,
            rate: affiliate.rate,
            message: `Upgraded to ${newTier} tier!`
        });
        
    } catch (error) {
        console.error('Upgrade tier error:', error);
        res.status(500).json({ error: 'Failed to upgrade tier' });
    }
});

// =====================
// HELPER FUNCTIONS
// =====================

function generateAffiliateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function getTier(totalEarnings, current = false) {
    // If checking current tier vs potential new tier
    const earnings = current ? totalEarnings : totalEarnings;
    
    if (earnings >= 5000) return 'platinum';
    if (earnings >= 2000) return 'gold';
    if (earnings >= 500) return 'silver';
    return 'standard';
}

module.exports = router;