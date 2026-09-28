const express = require('express');
const router = express.Router();
const db = require('../db');

// List of official Stripe Sandbox Simulation Test Cards
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
  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required.' });
  }

  const coupons = await db.getCoupons();
  const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!coupon) {
    return res.status(404).json({ error: 'Invalid or expired promotional code.' });
  }

  let discountAmount = 0;
  if (coupon.discountPercent) {
    discountAmount = (subtotal * coupon.discountPercent) / 100;
  } else if (coupon.discountAmount) {
    discountAmount = Math.min(subtotal, coupon.discountAmount);
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
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required to create payment intent.' });
    }

    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 12)}`;

    res.json({
      paymentIntentId,
      clientSecret,
      amount: Math.round(amount * 100),
      currency,
      status: 'requires_payment_method',
      livemode: false,
      created: Math.floor(Date.now() / 1000)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkout/process-sandbox-payment
router.post('/process-sandbox-payment', async (req, res) => {
  try {
    const {
      paymentIntentId,
      card,
      orderData,
      sandboxOptions = {}
    } = req.body;

    if (!orderData || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Order items are required for checkout settlement.' });
    }

    // 1. Simulate Latency
    const latency = parseInt(sandboxOptions.latencyMs, 10) || 500;
    if (latency > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(latency, 4000)));
    }

    const cleanNumber = (card?.number || '').replace(/\s+/g, '');
    const last4 = cleanNumber.slice(-4) || '4242';
    const cardBrand = card?.brand || (cleanNumber.startsWith('4') ? 'Visa' : 'Mastercard');

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
        paymentIntentId: paymentIntentId || `pi_${Date.now()}`,
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

    // 5. Success Path: Atomic Execution of Inventory Deduction and Order Creation
    const userId = req.user ? req.user.id : null;
    const checkoutResult = await db.executeAtomicCheckout({
      userId,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      shippingAddress: orderData.shippingAddress,
      shippingMethod: orderData.shippingMethod || 'cyber_express',
      items: orderData.items,
      discountCode: orderData.discountCode,
      paymentDetails: {
        paymentIntentId: paymentIntentId || `pi_sbx_${Date.now()}`,
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
    console.error('Checkout error:', err);
    res.status(400).json({
      error: {
        type: 'inventory_or_validation_error',
        message: err.message
      }
    });
  }
});

module.exports = router;
