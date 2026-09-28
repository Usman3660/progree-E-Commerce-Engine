const express = require('express');
const router = express.Router();
const { isSupabaseConfigured } = require('../supabase');

// GET /api/supabase/status (Sanitized status check)
router.get('/status', (req, res) => {
  res.json({
    isConfigured: Boolean(isSupabaseConfigured),
    databaseEngine: 'Supabase PostgreSQL'
  });
});

module.exports = router;
