const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured, SUPABASE_URL } = require('../supabase');
const fs = require('fs');
const path = require('path');

// GET /api/supabase/status
router.get('/status', async (req, res) => {
  try {
    let connectionTest = null;
    let tableCount = 0;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
        if (error) {
          connectionTest = {
            connected: false,
            message: `Connected to Supabase project, but 'products' table query failed: ${error.message}. Please run supabase_schema.sql in Supabase SQL Editor.`
          };
        } else {
          connectionTest = {
            connected: true,
            message: 'Successfully connected and verified Supabase PostgreSQL database tables.'
          };
        }
      } catch (e) {
        connectionTest = {
          connected: false,
          message: e.message
        };
      }
    }

    res.json({
      isConfigured: isSupabaseConfigured,
      projectUrl: SUPABASE_URL ? SUPABASE_URL.replace(/(https:\/\/)([^.]+)(\..+)/, '$1$2$3') : null,
      connectionTest,
      sqlSchemaPath: 'supabase_schema.sql',
      tables: ['users', 'products', 'cart_items', 'orders', 'order_items', 'inventory_logs', 'sandbox_transactions', 'coupons']
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/supabase/schema
router.get('/schema', (req, res) => {
  try {
    const schemaPath = path.join(__dirname, '../../supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      return res.send(sql);
    }
    res.status(404).send('-- Schema file not found');
  } catch (err) {
    res.status(500).send(`-- Error: ${err.message}`);
  }
});

module.exports = router;
