const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.SUPABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[SUPABASE POSTGRES] Unexpected pool client error:', err.message);
});

// Seed data
const INITIAL_PRODUCTS = [
  {
    id: 'prod_cyber_deck_9000',
    sku: 'ND-9000-PRO',
    name: 'Neural Deck Apex X-9000',
    tag: 'ULTRA HIGH END',
    category: 'Neural Interfaces',
    price: 1899.99,
    original_price: 2299.99,
    stock_quantity: 12,
    rating: 4.95,
    reviews_count: 84,
    image_url: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80',
    description: 'Direct cortical synaptic interface with quantum bus bridge and sub-millisecond neural telemetry.',
    features: JSON.stringify(['Direct 128-channel neural link', 'Liquid nitrogen cryo-cooling', 'Zero-latency quantum encryption', 'Hardware kill switch']),
    specs: JSON.stringify({
      'Interface Protocol': 'SynapseLink v4.2',
      'Clock Speed': '18.4 PHz Quantum',
      'Power Drain': '45W Micro-Fusion',
      'Weight': '420g Aerogel Alloy'
    }),
    is_featured: true
  },
  {
    id: 'prod_quantum_core_x7',
    sku: 'QC-700-ULTRA',
    name: 'Quantum Cryo-Cortex Core X7',
    tag: 'BEST SELLER',
    category: 'Computing Cores',
    price: 3499.00,
    original_price: 3899.00,
    stock_quantity: 6,
    rating: 5.0,
    reviews_count: 119,
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    description: 'Sub-atomic lattice calculation module capable of 128 Qubit coherent matrix calculations.',
    features: JSON.stringify(['128 Superconducting Qubits', 'Integrated vacuum thermal jacket', 'PCIe Gen-7 Sub-Space Bus']),
    specs: JSON.stringify({
      'Qubit Coherence': '99.9997%',
      'Operating Temp': '0.015 Kelvin',
      'Throughput': '840 TB/s'
    }),
    is_featured: true
  },
  {
    id: 'prod_chrono_visor_hud',
    sku: 'CV-HUD-400',
    name: 'Chrono-Visor AR Retinal HUD IV',
    tag: 'NEW RELEASE',
    category: 'Holographic Displays',
    price: 1249.50,
    original_price: 1499.00,
    stock_quantity: 18,
    rating: 4.88,
    reviews_count: 62,
    image_url: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&w=800&q=80',
    description: 'Zero-weight micro-LED retinal projection glasses with tactical heat-mapping and neural eye tracking.',
    features: JSON.stringify(['True 16K Retinal Projection', '360° LiDAR depth scanner', 'Auto-tinting photon shield']),
    specs: JSON.stringify({
      'Field of View': '145 Degrees',
      'Refresh Rate': '480 Hz Dynamic',
      'Battery Life': '36 Hours Continuous'
    }),
    is_featured: true
  },
  {
    id: 'prod_fusion_cell_omega',
    sku: 'FC-OMEGA-80',
    name: 'Sub-Zero Fusion Cell 8000mAh',
    tag: 'LIMITED STOCK',
    category: 'Energy Units',
    price: 799.99,
    original_price: 950.00,
    stock_quantity: 4,
    rating: 4.92,
    reviews_count: 43,
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    description: 'Miniaturized tritium-deuterium catalyst cell providing continuous uninterrupted power.',
    features: JSON.stringify(['Indestructible casing', 'Thermal emission masking', 'Magnetic dock rapid charge']),
    specs: JSON.stringify({
      'Capacity': '8,000 mAh High-Density',
      'Continuous Output': '400 Watts Peak',
      'Recharge Cycle': '50,000 Cycles'
    }),
    is_featured: false
  },
  {
    id: 'prod_bionic_hand_mk5',
    sku: 'BH-MK5-TACT',
    name: 'Cybernetic Bionic Manipulator MK-V',
    tag: 'TOP RATED',
    category: 'Cybernetic Implants',
    price: 4890.00,
    original_price: 5200.00,
    stock_quantity: 8,
    rating: 4.97,
    reviews_count: 51,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description: 'Carbon-titanium prosthetic manipulator equipped with myoelectric sensors and 250kg grip strength.',
    features: JSON.stringify(['Micro-haptic fingertip feedback', '250kg crush force rating', 'Sub-millimeter dexterity']),
    specs: JSON.stringify({
      'Actuator Type': 'Piezoelectric Harmonic',
      'Sensing Latency': '< 2ms Myoelectric',
      'Structural Material': 'Grade 5 Aerospace Titanium'
    }),
    is_featured: true
  },
  {
    id: 'prod_obsidian_vault_16tb',
    sku: 'OV-16TB-MIL',
    name: 'Obsidian Sub-Atomic Vault 16TB',
    tag: 'ESSENTIAL',
    category: 'Storage Modules',
    price: 649.00,
    original_price: 799.00,
    stock_quantity: 25,
    rating: 4.86,
    reviews_count: 98,
    image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    description: 'Atomic spin memory block with hardware AES-512 self-destruct fuse and EMP shielding.',
    features: JSON.stringify(['120 GB/s sequential read/write', 'Self-purging thermite circuit failsafe']),
    specs: JSON.stringify({
      'Capacity': '16 Terabytes',
      'Transfer Speed': '120 GB/s',
      'Encryption': 'AES-512 Quantum Hash'
    }),
    is_featured: false
  },
  {
    id: 'prod_stealth_exosuit',
    sku: 'SE-EXO-V2',
    name: 'Nano-Fiber Kinetic Exosuit V2',
    tag: 'LUXURY',
    category: 'Wearable Tech',
    price: 5999.00,
    original_price: 6500.00,
    stock_quantity: 3,
    rating: 4.99,
    reviews_count: 27,
    image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    description: 'Non-Newtonian fluid armor interwoven with artificial carbon nanotube muscles.',
    features: JSON.stringify(['400% muscle output augmentation', 'Thermal infrared signature masking']),
    specs: JSON.stringify({
      'Augmentation Ratio': '4.2x Human Base',
      'Power Duration': '18 Hours',
      'Armor Class': 'NIJ Level IV Ballistic'
    }),
    is_featured: true
  },
  {
    id: 'prod_gravity_drive_micro',
    sku: 'GD-MICRO-100',
    name: 'Micro-Gravity Anti-Inertia Coil',
    tag: 'EXPERIMENTAL',
    category: 'Propulsion Units',
    price: 8900.00,
    original_price: 9999.00,
    stock_quantity: 2,
    rating: 5.0,
    reviews_count: 14,
    image_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    description: 'Localized gravitational manipulation field generator for frictionless levitation rigs.',
    features: JSON.stringify(['Zero-G localized levitation field', 'Active warp wave stabilization']),
    specs: JSON.stringify({
      'Max Lift Load': '120 kg Static',
      'Field Radius': '1.8 Meters',
      'Core Frequency': '4.8 GHz Graviton'
    }),
    is_featured: false
  }
];

class DatabaseService {
  constructor() {
    this.init();
  }

  async init() {
    try {
      // Ensure seed products exist in Supabase database
      const countRes = await pool.query('SELECT count(*)::int as count FROM public.products');
      if (countRes.rows[0].count === 0) {
        console.log('[SUPABASE] Seeding initial products into Supabase PostgreSQL database...');
        for (const p of INITIAL_PRODUCTS) {
          await pool.query(`
            INSERT INTO public.products (id, sku, name, tag, category, price, original_price, stock_quantity, rating, reviews_count, image_url, description, features, specs, is_featured)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO NOTHING
          `, [p.id, p.sku, p.name, p.tag, p.category, p.price, p.original_price, p.stock_quantity, p.rating, p.reviews_count, p.image_url, p.description, p.features, p.specs, p.is_featured]);
        }
      }

      // Ensure seed coupons exist
      const couponCount = await pool.query('SELECT count(*)::int as count FROM public.coupons');
      if (couponCount.rows[0].count === 0) {
        await pool.query(`
          INSERT INTO public.coupons (code, discount_percent, discount_amount, description)
          VALUES 
            ('NEO2026', 20, NULL, '20% Off Launch Discount'),
            ('SANDBOX100', 100, NULL, '100% Free Sandbox Testing'),
            ('CYBER50', NULL, 50.00, '$50 Flat Off Order')
          ON CONFLICT (code) DO NOTHING
        `);
      }

      console.log('✅ Supabase PostgreSQL Database Service Connected & Ready.');
    } catch (err) {
      console.error('Error in DatabaseService init:', err.message);
    }
  }

  // --- Users Operations (Stored in public.users) ---
  async findUserByEmail(email) {
    if (!email) return null;
    const res = await pool.query('SELECT * FROM public.users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    return res.rows[0] || null;
  }

  async findUserById(id) {
    if (!id) return null;
    const res = await pool.query('SELECT * FROM public.users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async createUser({ email, password, name, role = 'customer' }) {
    const existing = await this.findUserByEmail(email);
    if (existing) {
      throw new Error('An account already exists with this email address.');
    }
    const salt = bcrypt.genSaltSync(12);
    const password_hash = bcrypt.hashSync(password, salt);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

    const res = await pool.query(`
      INSERT INTO public.users (id, email, password_hash, name, role, avatar, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [id, email.toLowerCase().trim(), password_hash, name || email.split('@')[0], role, avatar]);

    return res.rows[0];
  }

  verifyPassword(user, plainPassword) {
    return bcrypt.compareSync(plainPassword, user.password_hash);
  }

  // --- Products Operations (Stored in public.products) ---
  async getProducts({ category, search, inStockOnly } = {}) {
    let query = 'SELECT * FROM public.products WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      query += ` AND LOWER(category) = LOWER($${params.length})`;
    }
    if (search) {
      const sanitized = search.replace(/([\\%_])/g, '\\$1').toLowerCase();
      params.push(`%${sanitized}%`);
      query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(category) LIKE $${params.length} OR LOWER(sku) LIKE $${params.length})`;
    }
    if (inStockOnly) {
      query += ' AND stock_quantity > 0';
    }

    query += ' ORDER BY created_at ASC';
    const res = await pool.query(query, params);
    return res.rows.map(r => ({
      ...r,
      price: parseFloat(r.price),
      original_price: parseFloat(r.original_price),
      rating: parseFloat(r.rating)
    }));
  }

  async getProductById(id) {
    const res = await pool.query('SELECT * FROM public.products WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      ...r,
      price: parseFloat(r.price),
      original_price: parseFloat(r.original_price),
      rating: parseFloat(r.rating)
    };
  }

  async updateProductStock(productId, newStock, reason = 'ADMIN_ADJUSTMENT', referenceId = 'OPERATOR_CONSOLE') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const prodRes = await client.query('SELECT * FROM public.products WHERE id = $1 FOR UPDATE', [productId]);
      if (!prodRes.rows[0]) throw new Error('Product not found');
      
      const prevStock = prodRes.rows[0].stock_quantity;
      const targetStock = Math.max(0, parseInt(newStock, 10));
      const diff = targetStock - prevStock;

      const updateRes = await client.query('UPDATE public.products SET stock_quantity = $1 WHERE id = $2 RETURNING *', [targetStock, productId]);

      await client.query(`
        INSERT INTO public.inventory_logs (product_id, product_name, change_amount, previous_stock, new_stock, reason, reference_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [productId, prodRes.rows[0].name, diff, prevStock, targetStock, reason, referenceId]);

      await client.query('COMMIT');
      const updated = updateRes.rows[0];
      return {
        ...updated,
        price: parseFloat(updated.price),
        original_price: parseFloat(updated.original_price),
        rating: parseFloat(updated.rating)
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- Cart Operations (Stored in public.cart_items) ---
  async getCart(cartKey) {
    const res = await pool.query(`
      SELECT ci.id as cart_item_id, ci.quantity, ci.added_at, ci.updated_at,
             p.id as product_id, p.sku, p.name, p.category, p.price, p.original_price, p.stock_quantity, p.image_url, p.description
      FROM public.cart_items ci
      JOIN public.products p ON ci.product_id = p.id
      WHERE ci.cart_key = $1
      ORDER BY ci.added_at ASC
    `, [cartKey]);

    return res.rows.map(row => {
      const product = {
        id: row.product_id,
        sku: row.sku,
        name: row.name,
        category: row.category,
        price: parseFloat(row.price),
        original_price: parseFloat(row.original_price),
        stock_quantity: row.stock_quantity,
        image_url: row.image_url,
        description: row.description
      };
      return {
        productId: row.product_id,
        quantity: row.quantity,
        addedAt: row.added_at,
        updatedAt: row.updated_at,
        product,
        availableStock: product.stock_quantity,
        isOutOfStock: product.stock_quantity <= 0,
        exceedsStock: row.quantity > product.stock_quantity
      };
    });
  }

  async addToCart(cartKey, productId, quantity = 1) {
    const product = await this.getProductById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock_quantity <= 0) throw new Error('Product is out of stock.');

    const existingRes = await pool.query('SELECT quantity FROM public.cart_items WHERE cart_key = $1 AND product_id = $2', [cartKey, productId]);
    let newQty = quantity;

    if (existingRes.rows.length > 0) {
      newQty = existingRes.rows[0].quantity + quantity;
      if (newQty > product.stock_quantity) {
        throw new Error(`Cannot add more. Available warehouse limit is ${product.stock_quantity}.`);
      }
      await pool.query('UPDATE public.cart_items SET quantity = $1, updated_at = NOW() WHERE cart_key = $2 AND product_id = $3', [newQty, cartKey, productId]);
    } else {
      if (quantity > product.stock_quantity) {
        throw new Error(`Requested quantity exceeds available stock (${product.stock_quantity}).`);
      }
      await pool.query(`
        INSERT INTO public.cart_items (cart_key, product_id, quantity, added_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [cartKey, productId, quantity]);
    }

    return this.getCart(cartKey);
  }

  async updateCartQuantity(cartKey, productId, quantity) {
    if (quantity <= 0) {
      return this.removeFromCart(cartKey, productId);
    }
    const product = await this.getProductById(productId);
    if (!product) throw new Error('Product not found');
    if (quantity > product.stock_quantity) {
      throw new Error(`Cannot set quantity higher than available warehouse stock (${product.stock_quantity}).`);
    }

    await pool.query('UPDATE public.cart_items SET quantity = $1, updated_at = NOW() WHERE cart_key = $2 AND product_id = $3', [quantity, cartKey, productId]);
    return this.getCart(cartKey);
  }

  async removeFromCart(cartKey, productId) {
    await pool.query('DELETE FROM public.cart_items WHERE cart_key = $1 AND product_id = $2', [cartKey, productId]);
    return this.getCart(cartKey);
  }

  async clearCart(cartKey) {
    await pool.query('DELETE FROM public.cart_items WHERE cart_key = $1', [cartKey]);
    return [];
  }

  async mergeGuestCartToUser(guestKey, userKey) {
    if (!guestKey || !userKey || guestKey === userKey) return this.getCart(userKey);
    const guestItems = await pool.query('SELECT product_id, quantity FROM public.cart_items WHERE cart_key = $1', [guestKey]);
    
    for (const g of guestItems.rows) {
      const product = await this.getProductById(g.product_id);
      if (product && product.stock_quantity > 0) {
        await pool.query(`
          INSERT INTO public.cart_items (cart_key, product_id, quantity, added_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT (cart_key, product_id)
          DO UPDATE SET quantity = LEAST(public.cart_items.quantity + EXCLUDED.quantity, $4), updated_at = NOW()
        `, [userKey, g.product_id, g.quantity, product.stock_quantity]);
      }
    }

    await pool.query('DELETE FROM public.cart_items WHERE cart_key = $1', [guestKey]);
    return this.getCart(userKey);
  }

  // --- Atomic Checkout Execution (PostgreSQL Transaction in Supabase) ---
  async executeAtomicCheckout({
    userId,
    customerEmail,
    customerName,
    shippingAddress,
    shippingMethod,
    items,
    discountCode,
    paymentDetails
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Validate & Lock stock for all items
      const lockedProducts = [];
      for (const item of items) {
        const prodRes = await client.query('SELECT * FROM public.products WHERE id = $1 FOR UPDATE', [item.productId]);
        if (!prodRes.rows[0]) {
          throw new Error(`Product "${item.name || item.productId}" not found.`);
        }
        const product = prodRes.rows[0];
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}.`);
        }
        lockedProducts.push({ ...product, price: parseFloat(product.price) });
      }

      // 2. Compute Totals
      let subtotal = 0;
      items.forEach(item => {
        const prod = lockedProducts.find(p => p.id === item.productId);
        subtotal += prod.price * item.quantity;
      });

      let discountAmount = 0;
      if (discountCode) {
        const couponRes = await client.query('SELECT * FROM public.coupons WHERE UPPER(code) = UPPER($1) AND is_active = TRUE', [discountCode.trim()]);
        if (couponRes.rows[0]) {
          const coupon = couponRes.rows[0];
          if (coupon.discount_percent) {
            discountAmount = (subtotal * coupon.discount_percent) / 100;
          } else if (coupon.discount_amount) {
            discountAmount = Math.min(subtotal, parseFloat(coupon.discount_amount));
          }
        }
      }

      const shippingRates = { 'drone_orbital': 35.00, 'cyber_express': 18.00, 'ground_standard': 8.00 };
      const shippingCost = shippingRates[shippingMethod] !== undefined ? shippingRates[shippingMethod] : 18.00;
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const tax = Math.round(taxableAmount * 0.0825 * 100) / 100;
      const total = Math.max(0, Math.round((taxableAmount + shippingCost + tax) * 100) / 100);

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const orderNumber = `VX-${Math.floor(100000 + Math.random() * 900000)}`;

      // 3. Atomically Decrement Inventory & Insert Audit Trail
      const stockDeductions = [];
      for (const item of items) {
        const prod = lockedProducts.find(p => p.id === item.productId);
        const prevStock = prod.stock_quantity;
        const newStock = prevStock - item.quantity;

        await client.query('UPDATE public.products SET stock_quantity = $1 WHERE id = $2', [newStock, prod.id]);

        const logId = `inv_deduct_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        await client.query(`
          INSERT INTO public.inventory_logs (id, product_id, product_name, change_amount, previous_stock, new_stock, reason, reference_id, order_number, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `, [logId, prod.id, prod.name, -item.quantity, prevStock, newStock, 'ORDER_CHECKOUT', orderId, orderNumber]);

        stockDeductions.push({
          id: logId,
          product_name: prod.name,
          change_amount: -item.quantity,
          previous_stock: prevStock,
          new_stock: newStock
        });
      }

      // 4. Insert Order Record
      const orderRes = await client.query(`
        INSERT INTO public.orders (
          id, order_number, user_id, customer_email, customer_name, shipping_address, shipping_method,
          subtotal, discount_amount, discount_code, tax, shipping_cost, total, payment_method, payment_status, payment_intent_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
        ) RETURNING *
      `, [
        orderId, orderNumber, userId || null, customerEmail, customerName, JSON.stringify(shippingAddress), shippingMethod,
        subtotal, discountAmount, discountCode || null, tax, shippingCost, total, 'STRIPE_SANDBOX_CARD', 'PAID', paymentDetails.paymentIntentId || `pi_${Date.now()}`
      ]);

      // 5. Insert Order Items
      const orderItems = [];
      for (const item of items) {
        const prod = lockedProducts.find(p => p.id === item.productId);
        const itemSubtotal = prod.price * item.quantity;
        const oiId = `oi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

        await client.query(`
          INSERT INTO public.order_items (id, order_id, product_id, product_name, sku, price, quantity, image_url, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [oiId, orderId, prod.id, prod.name, prod.sku, prod.price, item.quantity, prod.image_url, itemSubtotal]);

        orderItems.push({
          id: oiId,
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          price: prod.price,
          quantity: item.quantity,
          image_url: prod.image_url,
          subtotal: itemSubtotal
        });
      }

      // 6. Insert Sandbox Transaction
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await client.query(`
        INSERT INTO public.sandbox_transactions (id, payment_intent_id, order_id, order_number, amount, currency, status, card_brand, card_last4, latency_ms, three_d_secure, raw_payload, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `, [
        txId, paymentDetails.paymentIntentId || `pi_${Date.now()}`, orderId, orderNumber, total, 'USD', 'succeeded',
        paymentDetails.cardBrand || 'Visa', paymentDetails.cardLast4 || '4242', paymentDetails.latencyMs || 500,
        !!paymentDetails.simulated3DS, JSON.stringify({ amount: Math.round(total * 100), status: 'succeeded' })
      ]);

      // 7. Clear Cart
      const cartKey = userId || customerEmail;
      await client.query('DELETE FROM public.cart_items WHERE cart_key = $1', [cartKey]);

      await client.query('COMMIT');

      const fullOrder = {
        ...orderRes.rows[0],
        subtotal: parseFloat(orderRes.rows[0].subtotal),
        discount_amount: parseFloat(orderRes.rows[0].discount_amount),
        tax: parseFloat(orderRes.rows[0].tax),
        shipping_cost: parseFloat(orderRes.rows[0].shipping_cost),
        total: parseFloat(orderRes.rows[0].total),
        items: orderItems
      };

      return {
        order: fullOrder,
        stockDeductions
      };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- Orders & Refund Restock Operations ---
  async getOrders(userId = null) {
    let query = 'SELECT * FROM public.orders';
    const params = [];
    if (userId) {
      params.push(userId);
      query += ' WHERE user_id = $1';
    }
    query += ' ORDER BY created_at DESC';
    const ordersRes = await pool.query(query, params);

    const orders = [];
    for (const ord of ordersRes.rows) {
      const itemsRes = await pool.query('SELECT * FROM public.order_items WHERE order_id = $1', [ord.id]);
      orders.push({
        ...ord,
        subtotal: parseFloat(ord.subtotal),
        discount_amount: parseFloat(ord.discount_amount),
        tax: parseFloat(ord.tax),
        shipping_cost: parseFloat(ord.shipping_cost),
        total: parseFloat(ord.total),
        items: itemsRes.rows.map(it => ({
          ...it,
          price: parseFloat(it.price),
          subtotal: parseFloat(it.subtotal)
        }))
      });
    }
    return orders;
  }

  async getOrderById(orderId) {
    const orderRes = await pool.query('SELECT * FROM public.orders WHERE id = $1', [orderId]);
    if (!orderRes.rows[0]) return null;
    const ord = orderRes.rows[0];
    const itemsRes = await pool.query('SELECT * FROM public.order_items WHERE order_id = $1', [ord.id]);
    return {
      ...ord,
      subtotal: parseFloat(ord.subtotal),
      discount_amount: parseFloat(ord.discount_amount),
      tax: parseFloat(ord.tax),
      shipping_cost: parseFloat(ord.shipping_cost),
      total: parseFloat(ord.total),
      items: itemsRes.rows.map(it => ({
        ...it,
        price: parseFloat(it.price),
        subtotal: parseFloat(it.subtotal)
      }))
    };
  }

  async refundOrder(orderId, reason = 'CUSTOMER_REQUEST') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orderRes = await client.query('SELECT * FROM public.orders WHERE id = $1 FOR UPDATE', [orderId]);
      if (!orderRes.rows[0]) throw new Error('Order not found');
      const order = orderRes.rows[0];
      if (order.payment_status === 'REFUNDED') throw new Error('Order is already refunded');

      await client.query("UPDATE public.orders SET payment_status = 'REFUNDED', refunded_at = NOW() WHERE id = $1", [orderId]);

      const itemsRes = await client.query('SELECT * FROM public.order_items WHERE order_id = $1', [orderId]);
      const restockLogs = [];

      for (const item of itemsRes.rows) {
        const prodRes = await client.query('SELECT stock_quantity, name FROM public.products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (prodRes.rows[0]) {
          const prevStock = prodRes.rows[0].stock_quantity;
          const newStock = prevStock + item.quantity;
          await client.query('UPDATE public.products SET stock_quantity = $1 WHERE id = $2', [newStock, item.product_id]);

          const logId = `inv_restock_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          await client.query(`
            INSERT INTO public.inventory_logs (id, product_id, product_name, change_amount, previous_stock, new_stock, reason, reference_id, order_number, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          `, [logId, item.product_id, prodRes.rows[0].name, item.quantity, prevStock, newStock, 'ORDER_REFUND', order.id, order.order_number]);

          restockLogs.push({ id: logId, product_name: prodRes.rows[0].name, change_amount: item.quantity, new_stock: newStock });
        }
      }

      await client.query('COMMIT');
      const updatedOrder = await this.getOrderById(orderId);
      return { order: updatedOrder, restockLogs };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getInventoryLogs() {
    const res = await pool.query('SELECT * FROM public.inventory_logs ORDER BY created_at DESC LIMIT 50');
    return res.rows;
  }

  async getSandboxTransactions() {
    const res = await pool.query('SELECT * FROM public.sandbox_transactions ORDER BY created_at DESC LIMIT 50');
    return res.rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));
  }

  async getCoupons() {
    const res = await pool.query('SELECT * FROM public.coupons WHERE is_active = TRUE');
    return res.rows.map(r => ({
      code: r.code,
      discountPercent: r.discount_percent,
      discountAmount: r.discount_amount ? parseFloat(r.discount_amount) : null,
      description: r.description
    }));
  }
}

const db = new DatabaseService();
module.exports = db;
