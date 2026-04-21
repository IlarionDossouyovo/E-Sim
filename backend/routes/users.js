const express = require('express');
const jwt = require('jsonwebtoken');
const { users, orders } = require('../models/database');

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
    req.isAdmin = decoded.isAdmin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', authenticate, (req, res) => {
  const user = users.get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  });
});

// Update user profile
router.put('/profile', authenticate, (req, res) => {
  const user = users.get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { name } = req.body;
  if (name) user.name = name;
  
  users.set(user.id, user);
  
  res.json({
    message: 'Profile updated',
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// Get user orders
router.get('/orders', authenticate, (req, res) => {
  const userOrders = Array.from(orders.values())
    .filter(order => order.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({ orders: userOrders });
});

// Get order by ID
router.get('/orders/:id', authenticate, (req, res) => {
  const order = orders.get(req.params.id);
  
  if (!order || order.userId !== req.userId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json({ order });
});

// Get dashboard stats
router.get('/dashboard', authenticate, (req, res) => {
  const userOrders = Array.from(orders.values()).filter(order => order.userId === req.userId);
  
  const activeOrders = userOrders.filter(o => o.status === 'active');
  const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
  
  // Calculate data used
  let totalDataUsed = 0;
  activeOrders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        const dataNum = parseInt(item.data);
        const usedPercent = (Math.random() * 0.7 + 0.1); // Simulated
        totalDataUsed += dataNum * usedPercent;
      });
    }
  });
  
  res.json({
    totalOrders: userOrders.length,
    activePlans: activeOrders.length,
    totalSpent,
    dataUsed: totalDataUsed.toFixed(1),
    daysRemaining: Math.max(...activeOrders.map(o => o.daysRemaining || 0), 0)
  });
});

module.exports = router;