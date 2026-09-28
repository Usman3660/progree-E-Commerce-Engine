const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sanitizeString, checkoutOrderSchema } = require('../utils/validation');

// Official Stripe Sandbox Simulation Test Cards
const SANDBOX_TEST_CARDS = [
  {
    category: 'Standard Success',
    cardBrand: 'Visa',
    cardNumber: '4242 4242 4242 4242',
    expMonth: '12',
    expYear: '2028',
    cvc: '123',
    expectedOutcome: 'Immediate Success (200 OK)',
    description: 'Standard successful payment settlement without 3DS challenge.'
  },
  {
    category: '3D Secure Challenge',
    cardBrand: 'Visa 3DS',
    cardNumber: '4000 0002 0000 0002',
    expMonth: '10',
    expYear: '2027',
    cvc: '321',
    expectedOutcome: 'Requires 3D Secure OTP Authentication',
    description: 'Triggers customer bank biometric / SMS verification challenge modal.'
  },
  {
    category: 'Decline: Generic',
    cardBrand: 'Visa Declined',
    cardNumber: '4000 0000 0000 0069',
    expMonth: '05',
    expYear: '2029',
    cvc: '456',
    expectedOutcome: 'Card Declined (do_not_honor)',
    description: 'Simulates issuing bank card decline code.'
  },
  {
    category: 'Decline: Insufficient Funds',
    cardBrand: 'Mastercard Limit',
    cardNumber: '4000 0000 0000 0127',
    expMonth: '08',
    expYear: '2028',
    cvc: '789',
    expectedOutcome: 'Declined: Insufficient Funds',
    description: 'Simulates cardholder account balance limit reached.'
  },
  {
    category: 'Decline: Fraud Prevention',
    cardBrand: 'Risk Block',
    cardNumber: '4000 0000 0000 0005',
    expMonth: '03',
    expYear: '2027',
    cvc: '999',
    expectedOutcome: 'Fraud Risk Flagged (Radar Block)',
    description: 'Simulates high-risk Radar anti-fraud trigger.'
  }
];

// GET /api/checkout/sandbox-cards
router.get('/sandbox-cards', (req, res) => {
  res.json({ cards: SANDBOX_TEST_CARDS });
});

// POST /api/checkout/validate-coupon
router.post('/validate-coupon', async (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const cleanCode = sanitizeString(code, 30);
  if (!cleanCode) {
    return res.status(400).json({ error: 'Coupon code is required.' });
  }

  const coupons = await db.getCoupons();
  const coupon = coupons.find(c => c.code.toUpperCase() === cleanCode.toUpperCase());
  if (!coupon) {
    return res.status(404).json({ error: 'Invalid or expired promotional code.' });
  }

  const safeSubtotal = Math.max(0, parseFloat(subtotal) || 0);
  let discountAmount = 0;
  if (coupon.discountPercent) {
    discountAmount = (safeSubtotal * coupon.discountPercent) / 100;
  } else if (coupon.discountAmount) {
    discountAmount = Math.min(safeSubtotal, coupon.discountAmount);
  }

  res.json({
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountPercent: coupon.discountPercent || null
  });
});

// POST /api/checkout/create-intent
router.post('/create-intent', (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    const safeAmount = parseFloat(amount);
    if (!safeAmount || safeAmount <= 0 || isNaN(safeAmount)) {
      return res.status(400).json({ error: 'Valid positive amount is required to create payment intent.' });
    }

    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 12)}`;

    res.json({
      paymentIntentId,
      clientSecret,
      amount: Math.round(safeAmount * 100),
      currency: sanitizeString(currency, 10).toLowerCase() || 'usd',
      status: 'requires_payment_method',
      livemode: false,
      created: Math.floor(Date.now() / 1000)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initialize payment intent.' });
  }
});

// POST /api/checkout/process-sandbox-payment (Protected: Requires Authenticated User)
router.post('/process-sandbox-payment', requireAuth, async (req, res) => {
  try {
    const parseResult = checkoutOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message || 'Invalid checkout payload.';
      return res.status(400).json({ error: { type: 'validation_error', message: errorMsg } });
    }

    const {
      paymentIntentId,
      card,
      orderData,
      sandboxOptions = {}
    } = parseResult.data;

    // 1. Simulate Latency
    const latency = Math.min(Math.max(0, parseInt(sandboxOptions.latencyMs, 10) || 500), 4000);
    if (latency > 0) {
      await new Promise(resolve => setTimeout(resolve, latency));
    }

    const cleanNumber = (card?.number ? String(card.number) : '').replace(/\s+/g, '');
    const last4 = cleanNumber.slice(-4) || '4242';
    const cardBrand = sanitizeString(card?.brand || (cleanNumber.startsWith('4') ? 'Visa' : 'Mastercard'), 30);

    // 2. Determine Outcome
    let outcome = sandboxOptions.simulateOutcome || 'auto';
    if (outcome === 'auto') {
      if (cleanNumber.endsWith('0002')) outcome = '3ds';
      else if (cleanNumber.endsWith('0069')) outcome = 'decline';
      else if (cleanNumber.endsWith('0127')) outcome = 'insufficient_funds';
      else if (cleanNumber.endsWith('0005')) outcome = 'fraud';
      else outcome = 'success';
    }

    // 3. 3DS Action
    if (outcome === '3ds' && !req.body.otpVerified) {
      return res.json({
        requiresAction: true,
        actionType: '3ds_challenge',
        paymentIntentId: sanitizeString(paymentIntentId, 100) || `pi_${Date.now()}`,
        otpHint: '777999',
        message: '3D Secure authentication required by issuing bank.'
      });
    }

    // 4. Failure Cases
    if (outcome === 'decline') {
      return res.status(402).json({
        error: {
          type: 'card_error',
          code: 'card_declined',
          decline_code: 'do_not_honor',
          message: 'Your card was declined by the issuer. Please try an alternate payment method.'
        }
      });
    }

    if (outcome === 'insufficient_funds') {
      return res.status(402).json({
        error: {
          type: 'card_error',
          code: 'card_declined',
          decline_code: 'insufficient_funds',
          message: 'Your card has insufficient funds to cover the transaction amount.'
        }
      });
    }

    if (outcome === 'fraud') {
      return res.status(402).json({
        error: {
          type: 'card_error',
          code: 'radar_blocked',
          decline_code: 'fraudulent',
          message: 'Transaction flagged and blocked by Stripe Radar Anti-Fraud Engine.'
        }
      });
    }

    // 5. Success Path: Atomic Execution
    const userId = req.user.id;
    const checkoutResult = await db.executeAtomicCheckout({
      userId,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      shippingAddress: orderData.shippingAddress,
      shippingMethod: orderData.shippingMethod,
      items: orderData.items,
      discountCode: orderData.discountCode,
      paymentDetails: {
        paymentIntentId: sanitizeString(paymentIntentId, 100) || `pi_sbx_${Date.now()}`,
        cardBrand,
        cardLast4: last4,
        latencyMs: latency,
        simulated3DS: outcome === '3ds' || !!req.body.otpVerified
      }
    });

    res.status(200).json({
      success: true,
      message: 'Transaction authorized and settled via Payment Sandbox.',
      order: checkoutResult.order,
      stockDeductions: checkoutResult.stockDeductions
    });

  } catch (err) {
    console.error('Checkout execution error:', err.message);
    res.status(400).json({
      error: {
        type: 'inventory_or_validation_error',
        message: err.message || 'Transaction could not be settled.'
      }
    });
  }
});

module.exports = router;
