const { z } = require('zod');

/**
 * Server-Side Zod Schemas & Input Sanitization Utilities
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Strip null bytes & control chars
    .slice(0, maxLength);
}

// 1. User Registration Schema
const registerSchema = z.object({
  email: z.string().trim().min(5).max(254).regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  name: z.string().trim().max(100).optional().transform(v => sanitizeString(v || '', 100)),
  guestCartKey: z.string().trim().max(100).optional().nullable()
});

// 2. User Login Schema
const loginSchema = z.object({
  email: z.string().trim().min(5).max(254).regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string().min(1, 'Password is required').max(128),
  guestCartKey: z.string().trim().max(100).optional().nullable()
});

// 3. Cart Add Schema
const cartAddSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity exceeds maximum allowable limit of 100')
});

// 4. Cart Update Schema
const cartUpdateSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  quantity: z.number().int().min(0, 'Quantity must be 0 or greater').max(100, 'Quantity exceeds maximum limit')
});

// 5. Shipping Address Schema
const shippingAddressSchema = z.object({
  fullName: z.string().trim().max(100).optional().default('Customer').transform(v => sanitizeString(v || 'Customer', 100)),
  addressLine: z.string().trim().min(1).max(200).transform(v => sanitizeString(v, 200)),
  city: z.string().trim().max(100).optional().default('Neo-Tokyo').transform(v => sanitizeString(v || 'Neo-Tokyo', 100)),
  state: z.string().trim().max(100).optional().default('Kanto Orbit').transform(v => sanitizeString(v || 'Kanto Orbit', 100)),
  postalCode: z.string().trim().max(20).optional().default('90210').transform(v => sanitizeString(v || '90210', 20)),
  country: z.string().trim().max(100).optional().default('United States').transform(v => sanitizeString(v || 'United States', 100))
});

// 6. Checkout Order Schema
const checkoutOrderSchema = z.object({
  paymentIntentId: z.string().trim().max(100).optional().nullable(),
  card: z.object({
    number: z.string().max(30).optional(),
    brand: z.string().max(50).optional()
  }).optional().nullable(),
  orderData: z.object({
    customerEmail: z.string().trim().regex(EMAIL_REGEX, 'Invalid customer email'),
    customerName: z.string().trim().max(100).transform(v => sanitizeString(v, 100)),
    shippingAddress: shippingAddressSchema,
    shippingMethod: z.enum(['cyber_express', 'drone_orbital', 'ground_standard']).default('cyber_express'),
    items: z.array(z.object({
      productId: z.string().trim().min(1).max(64),
      quantity: z.number().int().min(1).max(100),
      price: z.number().optional(),
      name: z.string().optional()
    })).min(1, 'Order must contain at least one item'),
    discountCode: z.string().trim().max(30).optional().nullable().transform(v => v ? sanitizeString(v, 30) : null)
  }),
  sandboxOptions: z.object({
    latencyMs: z.number().int().min(0).max(5000).optional(),
    simulateOutcome: z.enum(['auto', 'success', '3ds', 'decline', 'insufficient_funds', 'fraud']).optional()
  }).optional()
});

// 7. Stock Adjustment Schema
const stockUpdateSchema = z.object({
  newStock: z.number().int().min(0, 'Stock cannot be negative').max(100000, 'Stock exceeds maximum allowable bound'),
  reason: z.string().trim().max(60).default('ADMIN_ADJUSTMENT').transform(v => sanitizeString(v, 60))
});

function escapeLikeQuery(query) {
  if (typeof query !== 'string') return '';
  return query.replace(/([\\%_])/g, '\\$1');
}

module.exports = {
  sanitizeString,
  escapeLikeQuery,
  registerSchema,
  loginSchema,
  cartAddSchema,
  cartUpdateSchema,
  shippingAddressSchema,
  checkoutOrderSchema,
  stockUpdateSchema
};
