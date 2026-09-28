const jwt = require('jsonwebtoken');
const db = require('../db');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⚠️ [SECURITY WARNING] JWT_SECRET is not set in .env! Generating secure temporary session key.');
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || require('crypto').randomBytes(64).toString('hex');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, EFFECTIVE_JWT_SECRET, async (err, decoded) => {
    if (err || !decoded || !decoded.userId) {
      req.user = null;
      return next();
    }
    try {
      const user = await db.findUserById(decoded.userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        };
      } else {
        req.user = null;
      }
    } catch (e) {
      req.user = null;
    }
    next();
  });
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

module.exports = {
  JWT_SECRET: EFFECTIVE_JWT_SECRET,
  authenticateToken,
  requireAuth,
  requireAdmin
};
