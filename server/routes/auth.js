const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');
const { registerSchema, loginSchema, sanitizeString } = require('../utils/validation');

// Short-lived JWT expiry (60 minutes) as per RULE 4
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '60m' }
  );
}

// In-memory failed login tracking & account lockout (5 attempts / 15 minutes)
const failedAttempts = new Map(); // key: email, value: { count, lockedUntil }

function checkLockout(email) {
  const record = failedAttempts.get(email);
  if (!record) return null;
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remainingMinutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return `Account temporarily locked due to excessive failed attempts. Please try again in ${remainingMinutes} minute(s).`;
  }
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    failedAttempts.delete(email);
    return null;
  }
  return null;
}

function recordFailedLogin(email) {
  const record = failedAttempts.get(email) || { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
  }
  failedAttempts.set(email, record);
}

function clearFailedLogin(email) {
  failedAttempts.delete(email);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid registration input.';
      return res.status(400).json({ error: firstError });
    }

    const { email, password, name, guestCartKey } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name || cleanEmail.split('@')[0];

    const newUser = await db.createUser({
      email: cleanEmail,
      password,
      name: cleanName,
      role: 'customer'
    });
    const token = generateToken(newUser);

    if (guestCartKey) {
      await db.mergeGuestCartToUser(sanitizeString(guestCartKey, 100), newUser.id);
    }

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar,
        created_at: newUser.created_at
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Valid email and password are required.' });
    }

    const { email, password, guestCartKey } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check Account Lockout
    const lockoutError = checkLockout(cleanEmail);
    if (lockoutError) {
      return res.status(429).json({ error: lockoutError });
    }

    const user = await db.findUserByEmail(cleanEmail);
    if (!user) {
      recordFailedLogin(cleanEmail);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = db.verifyPassword(user, password);
    if (!isMatch) {
      recordFailedLogin(cleanEmail);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Clear failed attempts on successful authentication
    clearFailedLogin(cleanEmail);

    const token = generateToken(user);
    if (guestCartKey) {
      await db.mergeGuestCartToUser(sanitizeString(guestCartKey, 100), user.id);
    }

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        created_at: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error during authentication.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
