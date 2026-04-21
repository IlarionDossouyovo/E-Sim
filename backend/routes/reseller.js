const express = require('express');
const jwt = require('jsonwebtoken');
const { users, orders, products } = require('../models/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'esim-secret-key-2026';

// Verify API key
const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Verify API key (in production, check database)
  const validKeys = ['esim-reseller-key-123', 'esim-api-key-456'];
  if (!validKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Get products (reseller price)
router.get('/products', authenticateAPI, (req, res) => {
  const { resellerTier } = req.query;
  const discount = { bronze: 0.1, silver: 0.15, gold: 0.2 }[resellerTier] || 0.1;
  
  const productsWithResellerPrice = products.map(p => ({
    id: p.id,
    country: p.country,
    flag: p.flag,
    price: p.price,
    resellerPrice: (p.price * (1 - discount)).toFixed(2),
    data: p.data,
    days: p.days,
    region: p.region
  }));
  
  res.json({ products: productsWithResellerPrice });
});

// Create order (reseller)
router.post('/orders', authenticateAPI, (req, res) => {
  const { items, customerEmail, resellerOrderId } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }
  
  const orderItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;
    
    return {
      productId: product.id,
      country: product.country,
      flag: product.flag,
      data: product.data,
      price: product.price,
      resellerPrice: (product.price * 0.9).toFixed(2)
    };
  }).filter(Boolean);
  
  const total = orderItems.reduce((sum, item) => sum + parseFloat(item.resellerPrice), 0);
  
  const order = {
    id: 'RES-' + Date.now(),
    resellerOrderId,
    items: orderItems,
    total: total.toFixed(2),
    status: 'pending',
    customerEmail,
    createdAt: new Date().toISOString()
  };
  
  orders.set(order.id, order);
  
  res.json({
    message: 'Reseller order created',
    order,
    resellerCommission: (order.total * 0.1).toFixed(2)
  });
});

// Get order status
router.get('/orders/:id', authenticateAPI, (req, res) => {
  const order = orders.get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json({ order });
});

// Generate eSIM
router.post('/esim/generate', authenticateAPI, async (req, res) => {
  const { orderId } = req.body;
  
  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // Generate QR code (in production, call real eSIM provider)
  const qrCode = 'data:image/png;base64,' + Buffer.from(JSON.stringify({
    iccid: '890' + Math.random().toString().slice(2, 22),
    orderId: order.id
  })).toString('base64');
  
  order.status = 'active';
  order.esimGeneratedAt = new Date().toISOString();
  order.qrCode = qrCode;
  orders.set(order.id, order);
  
  res.json({
    message: 'eSIM generated',
    order,
    qrCode
  });
});

// Get commission summary
router.get('/commissions', authenticateAPI, (req, res) => {
  const { resellerId } = req.query;
  
  const resellerOrders = Array.from(orders.values())
    .filter(o => o.createdAt);
  
  const totalSales = resellerOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const totalCommission = totalSales * 0.1;
  
  res.json({
    totalSales: totalSales.toFixed(2),
    totalCommission: totalCommission.toFixed(2),
    pendingOrders: resellerOrders.filter(o => o.status === 'pending').length,
    completedOrders: resellerOrders.filter(o => o.status === 'active').length
  });
});

module.exports = router;