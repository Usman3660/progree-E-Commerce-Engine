const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sanitizeString, cartAddSchema, cartUpdateSchema } = require('../utils/validation');

function getCartKey(req) {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  const guestHeader = req.headers['x-guest-cart-key'];
  if (guestHeader) {
    return sanitizeString(guestHeader, 100);
  }
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
    res.status(500).json({ error: 'Failed to retrieve shopping cart.' });
  }
});

// POST /api/cart/add (Protected: Requires Authenticated User)
router.post('/add', requireAuth, async (req, res) => {
  try {
    const parseResult = cartAddSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message || 'Invalid product or quantity.';
      return res.status(400).json({ error: errorMsg });
    }

    const { productId, quantity } = parseResult.data;
    const cartKey = req.user.id;

    const items = await db.addToCart(cartKey, productId, quantity);
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      message: 'Item added to persistent cart',
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalItems
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to add item to cart.' });
  }
});

// PUT /api/cart/update (Protected)
router.put('/update', requireAuth, async (req, res) => {
  try {
    const parseResult = cartUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message || 'Invalid update parameters.';
      return res.status(400).json({ error: errorMsg });
    }

    const { productId, quantity } = parseResult.data;
    const cartKey = req.user.id;

    const items = await db.updateCartQuantity(cartKey, productId, quantity);
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      message: 'Cart quantity updated',
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalItems
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update quantity.' });
  }
});

// DELETE /api/cart/item/:productId (Protected)
router.delete('/item/:productId', requireAuth, async (req, res) => {
  try {
    const cartKey = req.user.id;
    const cleanProductId = sanitizeString(req.params.productId, 64);
    const items = await db.removeFromCart(cartKey, cleanProductId);
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      message: 'Item removed from cart',
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      totalItems
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item from cart.' });
  }
});

// DELETE /api/cart/clear (Protected)
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    const cartKey = req.user.id;
    const items = await db.clearCart(cartKey);
    res.json({ message: 'Cart cleared', items: [], subtotal: 0, totalItems: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
});

module.exports = router;
