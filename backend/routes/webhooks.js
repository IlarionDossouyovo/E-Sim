const express = require('express');
const { orders, users, esims } = require('../models/database');

const router = express.Router();

// Webhook handlers for external integrations
class WebhookHandler {
    constructor() {
        this.webhooks = new Map();
    }

    // Register webhook
    register(event, url, secret) {
        if (!this.webhooks.has(event)) {
            this.webhooks.set(event, []);
        }
        
        this.webhooks.get(event).push({
            url,
            secret,
            createdAt: new Date().toISOString(),
            events: 0,
            lastEvent: null
        });
    }

    // Trigger webhook
    async trigger(event, data) {
        const handlers = this.webhooks.get(event) || [];
        
        for (const webhook of handlers) {
            try {
                // In production, send real HTTP request
                console.log(`Webhook triggered: ${event} -> ${webhook.url}`);
                
                webhook.events++;
                webhook.lastEvent = new Date().toISOString();
                
                // Simulate response
                return { success: true, webhook: webhook.url };
            } catch (error) {
                console.error(`Webhook error: ${error.message}`);
                return { success: false, error: error.message };
            }
        }
    }
}

const webhookHandler = new WebhookHandler();

// =====================
// WEBHOOK ROUTES
// =====================

// Register webhook
router.post('/register', (req, res) => {
    const { event, url, secret } = req.body;
    
    if (!event || !url) {
        return res.status(400).json({ error: 'event and url required' });
    }
    
    webhookHandler.register(event, url, secret);
    
    res.json({
        success: true,
        message: `Webhook registered for ${event}`,
        event,
        url
    });
});

// List webhooks
router.get('/', (req, res) => {
    const events = {};
    
    for (const [event, handlers] of webhookHandler.webhooks) {
        events[event] = handlers.map(h => ({
            url: h.url,
            events: h.events,
            lastEvent: h.lastEvent
        }));
    }
    
    res.json({ webhooks: events });
});

// Test webhook
router.post('/test', (req, res) => {
    const { event } = req.body;
    
    webhookHandler.trigger(event, { test: true, timestamp: new Date().toISOString() });
    
    res.json({ success: true, message: 'Test webhook triggered' });
});

// =====================
// EXTERNAL INTEGRATIONS
// =====================

// Stripe Webhook
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const event = JSON.parse(req.body);
    
    switch (event.type) {
        case 'checkout.session.completed':
            await handlePaymentSuccess(event.data.object);
            break;
            
        case 'payment_intent.payment_failed':
            await handlePaymentFailure(event.data.object);
            break;
            
        default:
            console.log(`Unhandled event: ${event.type}`);
    }
    
    res.json({ received: true });
});

// Handle successful payment
async function handlePaymentSuccess(session) {
    const orderId = session.metadata?.orderId;
    
    if (orderId) {
        const order = orders.get(orderId);
        if (order) {
            order.paymentStatus = 'paid';
            order.status = 'ready';
            order.paidAt = new Date().toISOString();
            orders.set(orderId, order);
            
            // Trigger order created webhook
            webhookHandler.trigger('order.paid', {
                orderId,
                total: order.total,
                items: order.items
            });
        }
    }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (orderId) {
        const order = orders.get(orderId);
        if (order) {
            order.paymentStatus = 'failed';
            order.status = 'cancelled';
            orders.set(orderId, order);
            
            // Trigger payment failed webhook
            webhookHandler.trigger('order.payment_failed', {
                orderId,
                error: paymentIntent.last_payment_error?.message
            });
        }
    }
}

// Payment webhook (simplified)
router.post('/payment', (req, res) => {
    const { orderId, status } = req.body;
    
    const order = orders.get(orderId);
    if (order) {
        order.paymentStatus = status;
        
        if (status === 'paid') {
            order.status = 'ready';
            order.paidAt = new Date().toISOString();
        }
        
        orders.set(orderId, order);
        
        res.json({ success: true, order });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

// =====================
// NOTIFICATION SYSTEM
// =====================

// Send notification
router.post('/notify', (req, res) => {
    const { type, userId, message, data } = req.body;
    
    // In production, send via email, SMS, push
    console.log(`Notification [${type}] to user ${userId}:`, message);
    
    // Trigger webhook
    webhookHandler.trigger('notification.sent', {
        userId,
        type,
        message
    });
    
    res.json({ success: true, message: 'Notification sent' });
});

// =====================
// ANALYTICS WEBHOOKS
// =====================

// Track event
router.post('/track', (req, res) => {
    const { event, userId, properties } = req.body;
    
    console.log(`Analytics: ${event}`, { userId, properties });
    
    res.json({ success: true });
});

// =====================
// SUPPORT INTEGRATION
// =====================

// Create support ticket webhook
router.post('/support/ticket', (req, res) => {
    const { userId, subject, description, priority } = req.body;
    
    const ticket = {
        id: 'TKT-' + Date.now(),
        userId,
        subject,
        description,
        priority: priority || 'normal',
        status: 'open',
        createdAt: new Date().toISOString()
    };
    
    // Trigger webhook
    webhookHandler.trigger('support.ticket.created', ticket);
    
    res.json({ success: true, ticket });
});

// Update support ticket
router.patch('/support/ticket/:id', (req, res) => {
    const { status, response } = req.body;
    
    const ticket = {
        id: req.params.id,
        status,
        response,
        updatedAt: new Date().toISOString()
    };
    
    // Trigger webhook
    webhookHandler.trigger('support.ticket.updated', ticket);
    
    res.json({ success: true, ticket });
});

// =====================
// MARKETING AUTOMATION
// =====================

// Trigger marketing campaign
router.post('/marketing/campaign', (req, res) => {
    const { campaignId, userSegment, content } = req.body;
    
    // Get users in segment
    const allUsers = Array.from(users.values());
    const targetUsers = allUsers.filter(user => {
        if (userSegment === 'all') return true;
        if (userSegment === 'active') return user.orders?.length > 0;
        if (userSegment === 'inactive') return !user.orders?.length;
        return true;
    });
    
    res.json({
        success: true,
        campaignId,
        recipients: targetUsers.length,
        status: 'queued'
    });
});

// =====================
// EXPORT
// =====================

module.exports = router;
module.exports.webhookHandler = webhookHandler;