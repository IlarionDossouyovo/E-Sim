// E-Sim By ELECTRON - Enterprise Accounts System
// Multi-user management for businesses

const express = require('express');
const { users } = require('../models/database');

const router = express.Router();

// In-memory storage
const enterprises = new Map();
const enterpriseUsers = new Map();

// =====================
// CREATE ENTERPRISE
// =====================

router.post('/create', async (req, res) => {
    try {
        const { name, adminEmail, plan } = req.body;
        
        if (!name || !adminEmail) {
            return res.status(400).json({ error: 'name and adminEmail are required' });
        }
        
        const enterprise = {
            id: 'ent-' + Date.now(),
            name,
            plan: plan || 'business',
            adminEmail,
            users: [],
            settings: {
                autoTopup: false,
                budgetAlerts: true,
                dataRollover: false
            },
            createdAt: new Date().toISOString()
        };
        
        enterprises.set(enterprise.id, enterprise);
        
        res.json({
            success: true,
            enterprise: {
                id: enterprise.id,
                name: enterprise.name,
                plan: enterprise.plan
            }
        });
        
    } catch (error) {
        console.error('Create enterprise error:', error);
        res.status(500).json({ error: 'Failed to create enterprise' });
    }
});

// =====================
// ADD USER TO ENTERPRISE
// =====================

router.post('/add-user', async (req, res) => {
    try {
        const { enterpriseId, email, name, role } = req.body;
        
        if (!enterpriseId || !email || !name) {
            return res.status(400).json({ error: 'enterpriseId, email and name are required' });
        }
        
        const enterprise = enterprises.get(enterpriseId);
        
        if (!enterprise) {
            return res.status(404).json({ error: 'Enterprise not found' });
        }
        
        const enterpriseUser = {
            id: 'eu-' + Date.now(),
            enterpriseId,
            email,
            name,
            role: role || 'user',
            addedAt: new Date().toISOString()
        };
        
        enterprise.users.push(enterpriseUser.id);
        enterprises.set(enterpriseId, enterprise);
        
        enterpriseUsers.set(enterpriseUser.id, enterpriseUser);
        
        res.json({
            success: true,
            user: enterpriseUser
        });
        
    } catch (error) {
        console.error('Add enterprise user error:', error);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

// =====================
// GET ENTERPRISE USERS
// =====================

router.get('/users/:enterpriseId', (req, res) => {
    try {
        const { enterpriseId } = req.params;
        
        const enterprise = enterprises.get(enterpriseId);
        
        if (!enterprise) {
            return res.status(404).json({ error: 'Enterprise not found' });
        }
        
        const enterpriseUserList = Array.from(enterpriseUsers.values())
            .filter(u => u.enterpriseId === enterpriseId);
        
        res.json({
            enterprise: {
                id: enterprise.id,
                name: enterprise.name,
                plan: enterprise.plan
            },
            users: enterpriseUserList
        });
        
    } catch (error) {
        console.error('Get enterprise users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// =====================
// UPDATE SETTINGS
// =====================

router.put('/settings/:enterpriseId', async (req, res) => {
    try {
        const { enterpriseId } = req.params;
        const { settings } = req.body;
        
        const enterprise = enterprises.get(enterpriseId);
        
        if (!enterprise) {
            return res.status(404).json({ error: 'Enterprise not found' });
        }
        
        enterprise.settings = { ...enterprise.settings, ...settings };
        enterprises.set(enterpriseId, enterprise);
        
        res.json({
            success: true,
            settings: enterprise.settings
        });
        
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;