const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/admin/metrics
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
      recentOrders: orders.slice(0, 15),
      inventoryLogs: inventoryLogs.slice(0, 40),
      sandboxTransactions: sandboxTx.slice(0, 30)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/reset-catalog
router.post('/reset-catalog', async (req, res) => {
  try {
    await db.init();
    res.json({ message: 'Catalog and database refreshed in Supabase PostgreSQL.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
