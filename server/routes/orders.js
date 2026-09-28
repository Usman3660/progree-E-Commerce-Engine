const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sanitizeString } = require('../utils/validation');

// GET /api/orders (Authenticated: Customer gets their own orders, Admin gets all)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let orders;
    if (isAdmin) {
      orders = await db.getOrders();
    } else {
      orders = await db.getOrders(userId);
    }

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id (Authenticated: Owner or Admin only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const orderId = sanitizeString(req.params.id, 64);
    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order record not found.' });
    }

    // Ownership check (IDOR protection)
    const isOwner = order.user_id === req.user.id || (order.customer_email && order.customer_email.toLowerCase() === req.user.email.toLowerCase());
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to view this order.' });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/refund (Authenticated: Owner or Admin only)
router.post('/:id/refund', requireAuth, async (req, res) => {
  try {
    const orderId = sanitizeString(req.params.id, 64);
    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order record not found.' });
    }

    // Ownership check (IDOR protection)
    const isOwner = order.user_id === req.user.id || (order.customer_email && order.customer_email.toLowerCase() === req.user.email.toLowerCase());
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. You can only request refunds for your own orders.' });
    }

    const reason = sanitizeString(req.body.reason || 'CUSTOMER_REQUEST', 100);
    const result = await db.refundOrder(orderId, reason);

    res.json({
      message: 'Order successfully refunded and items restored to warehouse inventory.',
      order: result.order,
      restockLogs: result.restockLogs
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
