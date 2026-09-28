const express = require('express');
const router = express.Router();
const db = require('../db');

function getCartKey(req) {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  const guestHeader = req.headers['x-guest-cart-key'];
  if (guestHeader) return guestHeader;
  return 'anonymous_guest';
}

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const cartKey = getCartKey(req);
    const items = await db.getCart(cartKey);

    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const hasStockIssue = items.some(item => item.isOutOfStock || item.exceedsStock);

    res.json({
      cartKey,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalItems,
      hasStockIssue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/add
router.post('/add', async (req, res) => {
  try {
    const cartKey = getCartKey(req);
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const items = await db.addToCart(cartKey, productId, parseInt(quantity, 10) || 1);
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      message: 'Item added to persistent cart',
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalItems
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/cart/update
router.put('/update', async (req, res) => {
  try {
    const cartKey = getCartKey(req);
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
      return res.status(400).json({ error: 'productId and quantity are required' });
    }

    const items = await db.updateCartQuantity(cartKey, productId, parseInt(quantity, 10));
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      message: 'Cart quantity updated',
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalItems
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/cart/item/:productId
router.delete('/item/:productId', async (req, res) => {
  try {
    const cartKey = getCartKey(req);
    const items = await db.removeFromCart(cartKey, req.params.productId);
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      message: 'Item removed from cart',
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', async (req, res) => {
  try {
    const cartKey = getCartKey(req);
    const items = await db.clearCart(cartKey);
    res.json({ message: 'Cart cleared', items: [], subtotal: 0, totalItems: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
