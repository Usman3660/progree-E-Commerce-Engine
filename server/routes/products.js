const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { sanitizeString, stockUpdateSchema } = require('../utils/validation');

// GET /api/products (Public Catalog Query)
router.get('/', async (req, res) => {
  try {
    const { category, search, inStockOnly } = req.query;
    const cleanCategory = sanitizeString(category, 50);
    const cleanSearch = sanitizeString(search, 100);

    const products = await db.getProducts({
      category: cleanCategory,
      search: cleanSearch,
      inStockOnly: inStockOnly === 'true'
    });

    const categories = ['All', 'Neural Interfaces', 'Computing Cores', 'Holographic Displays', 'Energy Units', 'Cybernetic Implants', 'Storage Modules', 'Wearable Tech', 'Propulsion Units'];

    res.json({
      products,
      total: products.length,
      categories
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to query product catalog.' });
  }
});

// GET /api/products/:id (Public Product Details)
router.get('/:id', async (req, res) => {
  try {
    const productId = sanitizeString(req.params.id, 64);
    const product = await db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
});

// POST /api/products/:id/stock (Admin Protected Stock Adjustment)
router.post('/:id/stock', requireAdmin, async (req, res) => {
  try {
    const productId = sanitizeString(req.params.id, 64);
    const parseResult = stockUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message || 'Invalid stock update payload.';
      return res.status(400).json({ error: errorMsg });
    }

    const { newStock, reason } = parseResult.data;
    const reference = req.user ? sanitizeString(req.user.email, 100) : 'ADMIN_CONSOLE';

    const updated = await db.updateProductStock(productId, newStock, reason, reference);
    res.json({
      message: `Stock for ${updated.name} updated to ${updated.stock_quantity}`,
      product: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update warehouse stock.' });
  }
});

module.exports = router;
