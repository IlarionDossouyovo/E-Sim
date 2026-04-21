const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { orders, products } = require('../models/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'esim-secret-key-2026';

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

// Create order
router.post('/', authenticate, (req, res) => {
  const { items } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }
  
  // Validate products exist
  const orderItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;
    
    return {
      productId: product.id,
      country: product.country,
      flag: product.flag,
      data: product.data,
      days: product.days,
      price: product.price
    };
  }).filter(Boolean);
  
  if (orderItems.length === 0) {
    return res.status(400).json({ error: 'Invalid products' });
  }
  
  const total = orderItems.reduce((sum, item) => sum + item.price, 0);
  
  const order = {
    id: uuidv4(),
    userId: req.userId,
    items: orderItems,
    total,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  orders.set(order.id, order);
  
  res.json({
    message: 'Order created',
    order
  });
});

// Get order by ID
router.get('/:id', authenticate, (req, res) => {
  const order = orders.get(req.params.id);
  
  if (!order || order.userId !== req.userId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json({ order });
});

// Update order status (webhook from payment)
router.post('/:id/webhook', (req, res) => {
  const { status, paymentStatus } = req.body;
  const order = orders.get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (status) order.status = status;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  order.updatedAt = new Date().toISOString();
  
  orders.set(order.id, order);
  
  res.json({ message: 'Order updated', order });
});

// Cancel order
router.post('/:id/cancel', authenticate, (req, res) => {
  const order = orders.get(req.params.id);
  
  if (!order || order.userId !== req.userId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.status === 'active' || order.status === 'completed') {
    return res.status(400).json({ error: 'Cannot cancel active or completed order' });
  }
  
  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  
  orders.set(order.id, order);
  
  res.json({ message: 'Order cancelled', order });
});

module.exports = router;