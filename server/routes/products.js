const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, inStockOnly } = req.query;
    const products = await db.getProducts({
      category,
      search,
      inStockOnly: inStockOnly === 'true'
    });

    const categories = ['All', 'Neural Interfaces', 'Computing Cores', 'Holographic Displays', 'Energy Units', 'Cybernetic Implants', 'Storage Modules', 'Wearable Tech', 'Propulsion Units'];

    res.json({
      products,
      total: products.length,
      categories
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/:id/stock (Admin or Sandbox Stock Adjuster)
router.post('/:id/stock', async (req, res) => {
  try {
    const { newStock, reason = 'ADMIN_ADJUSTMENT' } = req.body;
    if (newStock === undefined || newStock === null) {
      return res.status(400).json({ error: 'newStock value is required.' });
    }
    const updated = await db.updateProductStock(req.params.id, newStock, reason, req.user ? req.user.email : 'SANDBOX_DEBUGGER');
    res.json({
      message: `Stock for ${updated.name} updated to ${updated.stock_quantity}`,
      product: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
