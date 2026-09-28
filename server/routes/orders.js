const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { email } = req.query;

    let orders = await db.getOrders();
    if (userId && req.user.role !== 'admin') {
      orders = orders.filter(o => o.user_id === userId || (email && o.customer_email.toLowerCase() === email.toLowerCase()));
    } else if (email) {
      orders = orders.filter(o => o.customer_email.toLowerCase() === email.toLowerCase());
    }

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order record not found.' });
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/refund (Triggers inventory restock logic path)
router.post('/:id/refund', async (req, res) => {
  try {
    const { reason = 'CUSTOMER_REQUEST' } = req.body;
    const result = await db.refundOrder(req.params.id, reason);
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
