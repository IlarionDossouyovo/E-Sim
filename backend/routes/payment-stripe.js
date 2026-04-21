// E-Sim By ELECTRON - Stripe Payment Integration
// Complete Stripe integration for real payments

const express = require('express');
const { orders, products, users, esims } = require('../models/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Initialize Stripe (use test key in development)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_example');

// =====================
// CREATE PAYMENT SESSION
// =====================

router.post('/create-session', async (req, res) => {
    try {
        const { orderId, userId } = req.body;
        
        // Get order
        const order = orders.get(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Verify user owns order
        if (order.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: order.items.map(item => ({
                price_data: {
                    currency: order.currency || 'eur',
                    product_data: {
                        name: `${item.country} - ${item.data}`,
                        description: `eSIM for ${item.country}, ${item.days} days`,
                        metadata: {
                            productId: item.productId
                        }
                    },
                    unit_amount: Math.round(item.price * 100) // Stripe uses cents
                },
                quantity: item.quantity || 1
            })),
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancelled`,
            metadata: {
                orderId: order.id,
                userId: order.userId
            },
            customer_email: order.userEmail,
            metadata: {
                orderId: order.id,
                userId: order.userId
            }
        });
        
        // Store session ID
        order.stripeSessionId = session.id;
        orders.set(order.id, order);
        
        res.json({
            sessionId: session.id,
            url: session.url
        });
        
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create payment session' });
    }
});

// =====================
// VERIFY PAYMENT
// =====================

router.post('/verify', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status === 'paid') {
            const orderId = session.metadata.orderId;
            const order = orders.get(orderId);
            
            if (order) {
                order.paymentStatus = 'PAID';
                order.status = 'CONFIRMED';
                order.paidAt = new Date().toISOString();
                order.stripePaymentIntent = session.payment_intent;
                orders.set(orderId, order);
                
                // Generate eSIMs
                for (const item of order.items) {
                    await generateESIM(orderId, order.userId, item);
                }
                
                return res.json({
                    success: true,
                    order,
                    message: 'Payment verified successfully'
                });
            }
        }
        
        res.json({
            success: false,
            status: session.payment_status
        });
        
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// =====================
// STRIPE WEBHOOK
// =====================

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || 'whsec_example'
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleSuccessfulPayment(session);
            break;
            
        case 'payment_intent.payment_failed':
            const paymentIntent = event.data.object;
            await handleFailedPayment(paymentIntent);
            break;
            
        case 'charge.refunded':
            const charge = event.data.object;
            await handleRefund(charge);
            break;
            
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
});

// =====================
// PAYMENT HANDLERS
// =====================

async function handleSuccessfulPayment(session) {
    try {
        const orderId = session.metadata.orderId;
        const order = orders.get(orderId);
        
        if (order) {
            order.paymentStatus = 'PAID';
            order.status = 'CONFIRMED';
            order.paidAt = new Date().toISOString();
            order.stripePaymentIntent = session.payment_intent;
            orders.set(orderId, order);
            
            // Generate eSIMs for each item
            for (const item of order.items) {
                await generateESIM(orderId, order.userId, item);
            }
            
            console.log(`✅ Payment successful for order ${orderId}`);
        }
    } catch (error) {
        console.error('Error handling successful payment:', error);
    }
}

async function handleFailedPayment(paymentIntent) {
    try {
        // Find order by payment intent
        const order = Array.from(orders.values()).find(
            o => o.stripePaymentIntent === paymentIntent.id
        );
        
        if (order) {
            order.paymentStatus = 'FAILED';
            order.status = 'CANCELLED';
            order.failureReason = paymentIntent.last_payment_error?.message;
            orders.set(order.id, order);
            
            console.log(`❌ Payment failed for order ${order.id}`);
        }
    } catch (error) {
        console.error('Error handling failed payment:', error);
    }
}

async function handleRefund(charge) {
    try {
        const order = Array.from(orders.values()).find(
            o => o.stripePaymentIntent === charge.payment_intent
        );
        
        if (order) {
            order.paymentStatus = 'REFUNDED';
            order.status = 'CANCELLED';
            order.refundedAt = new Date().toISOString();
            orders.set(order.id, order);
            
            console.log(`💰 Refund processed for order ${order.id}`);
        }
    } catch (error) {
        console.error('Error handling refund:', error);
    }
}

// =====================
// GENERATE eSIM
// =====================

async function generateESIM(orderId, userId, item) {
    try {
        // In production, call actual eSIM provider API
        // For now, generate simulated eSIM
        
        const iccid = '890' + Math.random().toString().slice(2, 22);
        const eid = '8900' + Math.random().toString().slice(2, 34);
        
        // Generate QR code data
        const qrData = JSON.stringify({
            iccid,
            eid,
            activationCode: uuidv4().slice(0, 16).toUpperCase()
        });
        
        // Generate QR code image
        const qrCode = await QRCode.toDataURL(qrData);
        
        // Get product info
        const product = products.find(p => p.id === item.productId);
        const dataGB = parseFloat(product?.data || '5GB');
        
        // Calculate expiry date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (product?.days || 30));
        
        // Create eSIM record
        const esimId = 'esim-' + Date.now();
        const esim = {
            id: esimId,
            userId,
            orderId,
            productId: item.productId,
            country: item.country,
            iccid,
            eid,
            activationCode: qrData.activationCode,
            qrCode,
            status: 'PENDING',
            dataTotal: dataGB * 1024, // Convert to MB
            dataUsed: 0,
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString(),
            activatedAt: null
        };
        
        esims.set(esimId, esim);
        
        // Update order with eSIM
        const order = orders.get(orderId);
        if (order) {
            if (!order.esims) order.esims = [];
            order.esims.push(esimId);
            orders.set(orderId, order);
        }
        
        return esim;
        
    } catch (error) {
        console.error('Error generating eSIM:', error);
        throw error;
    }
}

// =====================
// REFUND
// =====================

router.post('/refund', async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        
        const order = orders.get(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.paymentStatus !== 'PAID') {
            return res.status(400).json({ error: 'Order cannot be refunded' });
        }
        
        // Create refund via Stripe
        const refund = await stripe.refunds.create({
            payment_intent: order.stripePaymentIntent,
            reason: reason || 'requested_by_customer'
        });
        
        order.paymentStatus = 'REFUNDED';
        order.status = 'CANCELLED';
        order.refundedAt = new Date().toISOString();
        order.refundId = refund.id;
        orders.set(orderId, order);
        
        res.json({
            success: true,
            refund,
            message: 'Refund processed successfully'
        });
        
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ error: 'Refund failed' });
    }
});

// =====================
// GET PAYMENT STATUS
// =====================

router.get('/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = orders.get(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // If paid via Stripe, verify current status
        if (order.stripeSessionId && order.paymentStatus === 'PENDING') {
            try {
                const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
                order.paymentStatus = session.payment_status === 'paid' ? 'PAID' : 'PENDING';
                orders.set(orderId, order);
            } catch (e) {
                // Ignore errors
            }
        }
        
        res.json({
            orderId: order.id,
            status: order.paymentStatus,
            amount: order.total,
            currency: order.currency
        });
        
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ error: 'Failed to get payment status' });
    }
});

// =====================
// CREATE SUBSCRIPTION (for auto-renewal)
// =====================

router.post('/create-subscription', async (req, res) => {
    try {
        const { userId, priceId, email } = req.body;
        
        // Create or get customer
        const customers = await stripe.customers.list({ email, limit: 1 });
        
        let customer;
        if (customers.data.length > 0) {
            customer = customers.data[0];
        } else {
            customer = await stripe.customers.create({ email });
        }
        
        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent']
        });
        
        res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret
        });
        
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

module.exports = router;