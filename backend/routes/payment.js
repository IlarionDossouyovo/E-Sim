const express = require('express');
const jwt = require('jsonwebtoken');
const { orders } = require('../models/database');

const router = express.Router();
const JWT_SECRET = process.env.JIT_SECRET || 'esim-secret-key-2026';

// Stripe integration (mock for demo)
const stripe = {
  checkout: {
    sessions: {
      create: async (params) => {
        // Mock Stripe checkout session
        return {
          id: 'cs_' + Math.random().toString(36).substring(2, 15),
          url: 'https://checkout.stripe.com/pay/cs_demo',
          payment_status: 'unpaid',
          status: 'open'
        };
      }
    }
  }
};

// Middleware to verify token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create checkout session
router.post('/create-session', authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = orders.get(orderId);
    if (!order || order.userId !== req.userId) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // In production, use real Stripe:
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: order.items.map(item => ({
    //     price_data: {
    //       currency: 'eur',
    //       product_data: {
    //         name: `eSIM ${item.country} - ${item.data}`,
    //       },
    //       unit_amount: item.price * 100,
    //     },
    //     quantity: 1,
    //   })),
    //   mode: 'payment',
    //   success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    // });
    
    // Mock response for demo
    const session = {
      id: 'cs_demo_' + Date.now(),
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?payment=success&order=${orderId}`,
      orderId,
      amount: order.total * 100,
      currency: 'eur'
    };
    
    res.json({ session });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
});

// Verify payment (webhook)
router.post('/verify', async (req, res) => {
  const { orderId, sessionId, status } = req.body;
  
  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // In production, verify with Stripe:
  // const session = await stripe.checkout.sessions.retrieve(sessionId);
  // if (session.payment_status === 'paid') { ... }
  
  if (status === 'paid' || status === 'success') {
    order.paymentStatus = 'paid';
    order.status = 'ready';
    order.paidAt = new Date().toISOString();
    orders.set(order.id, order);
    
    res.json({ 
      success: true, 
      message: 'Payment verified',
      order 
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Payment not verified' 
    });
  }
});

// Get payment status
router.get('/status/:orderId', authenticate, async (req, res) => {
  const order = orders.get(req.params.orderId);
  
  if (!order || order.userId !== req.userId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json({
    orderId: order.id,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status
  });
});

module.exports = router;