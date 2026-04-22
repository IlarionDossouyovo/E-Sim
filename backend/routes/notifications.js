// E-Sim By ELECTRON - Push Notification Service
// Firebase Cloud Messaging (FCM) integration

const express = require('express');

const router = express.Router();

// Initialize Firebase Admin
let admin = null;
let fcmEnabled = false;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        const firebaseAdmin = require('firebase-admin');
        
        if (!firebaseAdmin.apps.length) {
            firebaseAdmin.initializeApp({
                credential: firebaseAdmin.credential.cert(serviceAccount)
            });
        }
        
        admin = firebaseAdmin;
        fcmEnabled = true;
        console.log('🔔 Push notifications: Firebase enabled');
    }
} catch (e) {
    console.log('🔔 Push notifications: Firebase not configured');
}

// In-memory store for device tokens (use database in production)
const deviceTokens = new Map();

// =====================
// REGISTER DEVICE
// =====================

router.post('/register', async (req, res) => {
    try {
        const { userId, token, platform, deviceName } = req.body;
        
        if (!token || !userId) {
            return res.status(400).json({ error: 'userId and token are required' });
        }
        
        // Store token
        if (!deviceTokens.has(userId)) {
            deviceTokens.set(userId, []);
        }
        
        const tokens = deviceTokens.get(userId);
        
        // Check if token already exists
        const existingIndex = tokens.findIndex(t => t.token === token);
        
        if (existingIndex >= 0) {
            tokens[existingIndex] = { token, platform, deviceName, updatedAt: new Date() };
        } else {
            tokens.push({ token, platform, deviceName, updatedAt: new Date() });
        }
        
        deviceTokens.set(userId, tokens);
        
        res.json({
            success: true,
            message: 'Device registered for push notifications'
        });
        
    } catch (error) {
        console.error('Register device error:', error);
        res.status(500).json({ error: 'Failed to register device' });
    }
});

// =====================
// UNREGISTER DEVICE
// =====================

router.post('/unregister', async (req, res) => {
    try {
        const { userId, token } = req.body;
        
        if (!userId || !token) {
            return res.status(400).json({ error: 'userId and token are required' });
        }
        
        const tokens = deviceTokens.get(userId);
        
        if (tokens) {
            const filtered = tokens.filter(t => t.token !== token);
            deviceTokens.set(userId, filtered);
        }
        
        res.json({
            success: true,
            message: 'Device unregistered'
        });
        
    } catch (error) {
        console.error('Unregister device error:', error);
        res.status(500).json({ error: 'Failed to unregister device' });
    }
});

// =====================
// SEND NOTIFICATION
// =====================

router.post('/send', async (req, res) => {
    try {
        const { userId, title, body, data, image } = req.body;
        
        if (!userId || !title) {
            return res.status(400).json({ error: 'userId and title are required' });
        }
        
        const tokens = deviceTokens.get(userId);
        
        if (!tokens || tokens.length === 0) {
            return res.status(404).json({ error: 'No devices registered for this user' });
        }
        
        const message = {
            notification: {
                title,
                body
            },
            data: data || {},
            android: {
                notification: {
                    icon: 'ic_notification',
                    color: '#667eea'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default'
                    }
                }
            }
        };
        
        if (image) {
            message.android.notification.imageUrl = image;
            message.aps.payload.aps['mutable-content'] = 1;
        }
        
        let results = [];
        
        if (fcmEnabled && admin) {
            // Send to all tokens
            for (const device of tokens) {
                try {
                    const result = await admin.messaging().sendToDevice(device.token, message);
                    results.push({
                        token: device.token,
                        success: result.successCount > 0,
                        error: result.failureCount > 0 ? result.results[0]?.error : null
                    });
                } catch (e) {
                    results.push({
                        token: device.token,
                        success: false,
                        error: e.message
                    });
                }
            }
        } else {
            // Development mode - log notification
            console.log('🔔 [DEV] Push notification:', {
                userId,
                title,
                body,
                tokens: tokens.length
            });
            
            results = tokens.map(t => ({
                token: t.token,
                success: true,
                mode: 'development'
            }));
        }
        
        const successCount = results.filter(r => r.success).length;
        
        res.json({
            success: true,
            sent: successCount,
            total: tokens.length,
            results
        });
        
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// =====================
// SEND TO TOPIC
// =====================

router.post('/send-topic', async (req, res) => {
    try {
        const { topic, title, body, data } = req.body;
        
        if (!topic || !title) {
            return res.status(400).json({ error: 'topic and title are required' });
        }
        
        const message = {
            topic,
            notification: {
                title,
                body
            },
            data: data || {}
        };
        
        let result;
        
        if (fcmEnabled && admin) {
            result = await admin.messaging().send(message);
        } else {
            console.log('🔔 [DEV] Topic notification:', { topic, title, body });
            result = { mode: 'development', messageId: 'dev-' + Date.now() };
        }
        
        res.json({
            success: true,
            messageId: result.messageId || result
        });
        
    } catch (error) {
        console.error('Send topic notification error:', error);
        res.status(500).json({ error: 'Failed to send topic notification' });
    }
});

// =====================
// SUBSCRIBE TO TOPIC
// =====================

router.post('/subscribe', async (req, res) => {
    try {
        const { userId, topic } = req.body;
        
        if (!userId || !topic) {
            return res.status(400).json({ error: 'userId and topic are required' });
        }
        
        const tokens = deviceTokens.get(userId);
        
        if (!tokens || tokens.length === 0) {
            return res.status(404).json({ error: 'No devices registered' });
        }
        
        const tokenList = tokens.map(t => t.token);
        
        if (fcmEnabled && admin) {
            await admin.messaging().subscribeToTopic(tokenList, topic);
        }
        
        console.log(`🔔 [DEV] User ${userId} subscribed to ${topic}`);
        
        res.json({
            success: true,
            message: `Subscribed to ${topic}`
        });
        
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// =====================
// UNSUBSCRIBE FROM TOPIC
// =====================

router.post('/unsubscribe', async (req, res) => {
    try {
        const { userId, topic } = req.body;
        
        if (!userId || !topic) {
            return res.status(400).json({ error: 'userId and topic are required' });
        }
        
        const tokens = deviceTokens.get(userId);
        
        if (tokens && fcmEnabled && admin) {
            const tokenList = tokens.map(t => t.token);
            await admin.messaging().unsubscribeFromTopic(tokenList, topic);
        }
        
        res.json({
            success: true,
            message: `Unsubscribed from ${topic}`
        });
        
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});

// =====================
// PRE-DEFINED NOTIFICATIONS
// =====================

// Low data warning
router.post('/low-data', async (req, res) => {
    try {
        const { userId, remainingGB } = req.body;
        
        const result = await sendNotification(userId, {
            title: '📊 Data presque épuisée',
            body: `Il vous reste ${remainingGB}GB. Rechargez maintenant!`,
            data: { type: 'low_data', action: 'recharge' }
        });
        
        res.json(result);
        
    } catch (error) {
        console.error('Low data notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Expiry warning
router.post('/expiry-warning', async (req, res) => {
    try {
        const { userId, daysRemaining, country } = req.body;
        
        const result = await sendNotification(userId, {
            title: '⏰ Forfait expire bientôt',
            body: `Votre eSIM ${country} expire dans ${daysRemaining} jours`,
            data: { type: 'expiry_warning', action: 'renew' }
        });
        
        res.json(result);
        
    } catch (error) {
        console.error('Expiry notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Order status update
router.post('/order-update', async (req, res) => {
    try {
        const { userId, orderId, status, message } = req.body;
        
        const result = await sendNotification(userId, {
            title: '📦 Mise à jour commande',
            body: message || `Commande ${orderId}: ${status}`,
            data: { type: 'order_update', orderId }
        });
        
        res.json(result);
        
    } catch (error) {
        console.error('Order notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Payment success
router.post('/payment-success', async (req, res) => {
    try {
        const { userId, orderId, esimsCount } = req.body;
        
        const result = await sendNotification(userId, {
            title: '✅ Paiement réussi!',
            body: `Votre commande est confirmée! ${esimsCount} eSIM(s) prête(s)`,
            data: { type: 'payment_success', orderId, action: 'view_esims' }
        });
        
        res.json(result);
        
    } catch (error) {
        console.error('Payment notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// =====================
// HELPER
// =====================

async function sendNotification(userId, { title, body, data }) {
    const tokens = deviceTokens.get(userId);
    
    if (!tokens || tokens.length === 0) {
        return { success: false, error: 'No devices registered' };
    }
    
    const message = {
        notification: { title, body },
        data: data || {}
    };
    
    if (fcmEnabled && admin) {
        const result = await admin.messaging().sendToDevice(
            tokens.map(t => t.token),
            message
        );
        
        return {
            success: true,
            sent: result.successCount,
            failed: result.failureCount
        };
    }
    
    // Development mode
    console.log('🔔 [DEV] Notification:', { userId, title, body });
    
    return {
        success: true,
        mode: 'development',
        sent: tokens.length
    };
}

module.exports = router;