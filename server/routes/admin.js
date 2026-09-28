const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***@***.com';
  const parts = email.split('@');
  if (parts.length < 2) return '***@***.com';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

// GET /api/admin/metrics (Secured Telemetry: Masked for standard users, Full for verified Admins)
router.get('/metrics', async (req, res) => {
  try {
    const products = await db.getProducts();
    const orders = await db.getOrders();
    const inventoryLogs = await db.getInventoryLogs();
    const sandboxTx = await db.getSandboxTransactions();

    const totalRevenue = orders
      .filter(o => o.payment_status === 'PAID')
      .reduce((sum, o) => sum + o.total, 0);

    const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
    const lowStockProducts = products.filter(p => p.stock_quantity <= 5);
    const outOfStockProducts = products.filter(p => p.stock_quantity === 0);

    const isAdmin = req.user && req.user.role === 'admin';

    // Mask sensitive PII in order summaries if not verified admin
    const sanitizedOrders = orders.slice(0, 15).map(ord => ({
      ...ord,
      customer_email: isAdmin ? ord.customer_email : maskEmail(ord.customer_email),
      customer_name: isAdmin ? ord.customer_name : `${ord.customer_name?.split(' ')[0]} ***`
    }));

    res.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: orders.length,
        paidOrders: orders.filter(o => o.payment_status === 'PAID').length,
        refundedOrders: orders.filter(o => o.payment_status === 'REFUNDED').length,
        totalProducts: products.length,
        totalStockUnits: totalStock,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length
      },
      products,
      recentOrders: sanitizedOrders,
      inventoryLogs: inventoryLogs.slice(0, 40),
      sandboxTransactions: sandboxTx.slice(0, 30)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve telemetry metrics.' });
  }
});

// POST /api/admin/reset-catalog (Admin Only)
router.post('/reset-catalog', requireAdmin, async (req, res) => {
  try {
    await db.init();
    res.json({ message: 'Catalog and database refreshed in Supabase PostgreSQL.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset catalog.' });
  }
});

module.exports = router;
