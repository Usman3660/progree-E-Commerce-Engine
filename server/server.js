const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-cart-key']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Auth token resolver middleware
const { authenticateToken } = require('./middleware/auth');
app.use(authenticateToken);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/supabase', require('./routes/supabase'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'VORTEX_APEX_ECOMMERCE_ENGINE_V4',
    timestamp: new Date().toISOString(),
    sandbox_mode: true
  });
});

// Fallback for SPA routing in production
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(200).send(`
        <html>
          <head><title>Vortex Apex Server Running</title></head>
          <body style="background:#090d16;color:#00f0ff;font-family:sans-serif;padding:40px;text-align:center;">
            <h1>⚡ VORTEX APEX E-COMMERCE BACKEND ACTIVE</h1>
            <p style="color:#94a3b8;">Vite dev server is running on port 5173.</p>
          </body>
        </html>
      `);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 VORTEX APEX E-COMMERCE ENGINE ONLINE`);
  console.log(`🛰️  Backend API Port: http://localhost:${PORT}`);
  console.log(`🛡️  Stripe Sandbox Module: ACTIVE`);
  console.log(`⚡  Inventory Atomic Adjustment: ENABLED`);
  console.log(`======================================================\n`);
});
