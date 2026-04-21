const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { orders, esims } = require('../models/database');

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

// Generate eSIM for order
router.post('/generate', authenticate, async (req, res) => {
  const { orderId } = req.body;
  
  const order = orders.get(orderId);
  if (!order || order.userId !== req.userId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.status !== 'pending') {
    return res.status(400).json({ error: 'eSIM already generated or order not paid' });
  }
  
  // Generate eSIM data (in production, this would call provider API)
  const esimData = {
    iccid: '890' + Math.random().toString().slice(2, 22),
    activationCode: Math.random().toString(36).substring(2, 18).toUpperCase(),
    smdpAddress: 'esim.electron-global.com',
    confirmationCode: Math.random().toString(36).substring(2, 8).toUpperCase()
  };
  
  // Generate QR code
  const qrData = `1${
    esimData.iccid
  }${
    esimData.activationCode
  }${
    esimData.smdpAddress
  }${
    esimData.confirmationCode
  }`;
  
  const qrCode = await QRCode.toDataURL(qrData);
  
  // Create eSIM entry
  const esim = {
    id: uuidv4(),
    orderId,
    userId: req.userId,
    iccid: esimData.iccid,
    activationCode: esimData.activationCode,
    smdpAddress: esimData.smdpAddress,
    qrCode,
    status: 'pending',
    activatedAt: null,
    expiresAt: new Date(Date.now() + (order.days || 30) * 24 * 60 * 60 * 1000).toISOString(),
    dataRemaining: order.items?.[0]?.data || '5GB',
    createdAt: new Date().toISOString()
  };
  
  esims.set(esim.id, esim);
  
  // Update order status
  order.status = 'active';
  order.esimId = esim.id;
  orders.set(order.id, order);
  
  res.json({
    message: 'eSIM generated successfully',
    esim: {
      id: esim.id,
      qrCode: esim.qrCode,
      iccid: esim.iccid,
      activationCode: esim.activationCode,
      expiresAt: esim.expiresAt
    }
  });
});

// Get user's eSIMs
router.get('/', authenticate, (req, res) => {
  const userEsims = Array.from(esims.values())
    .filter(e => e.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({ esims: userEsims });
});

// Get eSIM by ID
router.get('/:id', authenticate, (req, res) => {
  const esim = esims.get(req.params.id);
  
  if (!esim || esim.userId !== req.userId) {
    return res.status(404).json({ error: 'eSIM not found' });
  }
  
  res.json({ esim });
});

// Get eSIM QR code
router.get('/:id/qrcode', authenticate, async (req, res) => {
  const esim = esims.get(req.params.id);
  
  if (!esim || esim.userId !== req.userId) {
    return res.status(404).json({ error: 'eSIM not found' });
  }
  
  // Return QR code as base64
  res.json({ qrCode: esim.qrCode });
});

// Activate eSIM
router.post('/:id/activate', authenticate, (req, res) => {
  const esim = esims.get(req.params.id);
  
  if (!esim || esim.userId !== req.userId) {
    return res.status(404).json({ error: 'eSIM not found' });
  }
  
  if (esim.status === 'active') {
    return res.status(400).json({ error: 'eSIM already activated' });
  }
  
  esim.status = 'active';
  esim.activatedAt = new Date().toISOString();
  esims.set(esim.id, esim);
  
  res.json({
    message: 'eSIM activated successfully',
    esim
  });
});

// Top-up eSIM data
router.post('/:id/topup', authenticate, (req, res) => {
  const { dataPackage } = req.body;
  const esim = esims.get(req.params.id);
  
  if (!esim || esim.userId !== req.userId) {
    return res.status(404).json({ error: 'eSIM not found' });
  }
  
  // Add data package (in production, this would call provider API)
  const dataOptions = {
    '1GB': 1,
    '3GB': 3,
    '5GB': 5,
    '10GB': 10
  };
  
  const additionalGB = dataOptions[dataPackage] || 0;
  const currentGB = parseInt(esim.dataRemaining) || 0;
  esim.dataRemaining = (currentGB + additionalGB) + 'GB';
  
  esims.set(esim.id, esim);
  
  res.json({
    message: 'Top-up successful',
    esim
  });
});

module.exports = router;