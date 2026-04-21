const express = require('express');
const { products } = require('../models/database');

const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  const { region } = req.query;
  
  let filteredProducts = products;
  
  if (region && region !== 'all') {
    filteredProducts = products.filter(p => p.region === region);
  }
  
  res.json({ products: filteredProducts });
});

// Get product by ID
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json({ product });
});

// Get products by country
router.get('/country/:country', (req, res) => {
  const countryProducts = products.filter(p => 
    p.country.toLowerCase().includes(req.params.country.toLowerCase())
  );
  
  res.json({ products: countryProducts });
});

// Get featured products
router.get('/featured/list', (req, res) => {
  const featured = products.slice(0, 6);
  res.json({ products: featured });
});

// Get regions
router.get('/meta/regions', (req, res) => {
  const regions = [...new Set(products.map(p => p.region))];
  res.json({ regions });
});

// Search products
router.get('/search/:query', (req, res) => {
  const searchResults = products.filter(p => 
    p.country.toLowerCase().includes(req.params.query.toLowerCase())
  );
  res.json({ products: searchResults });
});

module.exports = router;