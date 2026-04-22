// E-Sim By ELECTRON - Newsletter System
// Email campaigns and subscriber management

const express = require('express');
const { users } = require('../models/database');

const router = express.Router();

// In-memory storage
const subscribers = new Map();
const campaigns = new Map();

// =====================
// SUBSCRIBE
// =====================

router.post('/subscribe', async (req, res) => {
    try {
        const { email, preferences } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Check if already subscribed
        if (subscribers.has(email)) {
            return res.json({ message: 'Already subscribed' });
        }
        
        const subscriber = {
            id: 'sub-' + Date.now(),
            email,
            preferences: preferences || {
                news: true,
                promotions: true,
                tips: true
            },
            status: 'active',
            subscribedAt: new Date().toISOString(),
            unsubscribedAt: null
        };
        
        subscribers.set(email, subscriber);
        
        res.json({
            success: true,
            message: 'Subscribed successfully'
        });
        
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// =====================
// UNSUBSCRIBE
// =====================

router.post('/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const subscriber = subscribers.get(email);
        
        if (!subscriber) {
            return res.status(404).json({ error: 'Not found' });
        }
        
        subscriber.status = 'unsubscribed';
        subscriber.unsubscribedAt = new Date().toISOString();
        subscribers.set(email, subscriber);
        
        res.json({
            success: true,
            message: 'Unsubscribed successfully'
        });
        
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});

// =====================
// CREATE CAMPAIGN
// =====================

router.post('/campaign', async (req, res) => {
    try {
        const { subject, body, type, targetSegment } = req.body;
        
        if (!subject || !body) {
            return res.status(400).json({ error: 'subject and body are required' });
        }
        
        const campaign = {
            id: 'camp-' + Date.now(),
            subject,
            body,
            type: type || 'news',
            targetSegment: targetSegment || 'all',
            status: 'draft',
            sentCount: 0,
            openCount: 0,
            clickCount: 0,
            createdAt: new Date().toISOString(),
            sentAt: null
        };
        
        campaigns.set(campaign.id, campaign);
        
        res.json({
            success: true,
            campaignId: campaign.id
        });
        
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

// =====================
// SEND CAMPAIGN
// =====================

router.post('/send', async (req, res) => {
    try {
        const { campaignId } = req.body;
        
        const campaign = campaigns.get(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        // Get target subscribers
        let targetSubscribers = Array.from(subscribers.values())
            .filter(s => s.status === 'active');
        
        // Filter by segment
        if (campaign.targetSegment === 'new') {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            targetSubscribers = targetSubscribers.filter(
                s => new Date(s.subscribedAt) >= weekAgo
            );
        }
        
        // In production, send via email service
        console.log(`📧 Sending campaign ${campaignId} to ${targetSubscribers.length} subscribers`);
        
        campaign.status = 'sent';
        campaign.sentCount = targetSubscribers.length;
        campaign.sentAt = new Date().toISOString();
        campaigns.set(campaignId, campaign);
        
        res.json({
            success: true,
            sent: targetSubscribers.length,
            message: 'Campaign sent successfully'
        });
        
    } catch (error) {
        console.error('Send campaign error:', error);
        res.status(500).json({ error: 'Failed to send campaign' });
    }
});

// =====================
// GET CAMPAIGNS
// =====================

router.get('/campaigns', (req, res) => {
    const allCampaigns = Array.from(campaigns.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(allCampaigns);
});

// =====================
// GET SUBSCRIBERS
// =====================

router.get('/subscribers', (req, res) => {
    const allSubscribers = Array.from(subscribers.values())
        .sort((a, b) => new Date(b.subscribedAt) - new Date(b.subscribedAt));
    
    const stats = {
        total: allSubscribers.length,
        active: allSubscribers.filter(s => s.status === 'active').length,
        unsubscribed: allSubscribers.filter(s => s.status === 'unsubscribed').length
    };
    
    res.json({ stats, subscribers: allSubscribers });
});

module.exports = router;