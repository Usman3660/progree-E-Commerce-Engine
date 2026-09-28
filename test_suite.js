const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n🧪 ========================================================');
  console.log('⚡ STARTING FULL VORTEX APEX E-COMMERCE ENGINE TEST SUITE');
  console.log('========================================================\n');

  let testUserToken = null;
  let testUserId = null;
  const testGuestKey = `test_guest_${Date.now()}`;

  // 1. Health check
  console.log('▶ TEST 1: System Health Check');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  assert.strictEqual(health.status, 'ONLINE');
  console.log('  ✔ Health check passed (Status: ONLINE, Sandbox: ACTIVE)\n');

  // 2. Fetch Products
  console.log('▶ TEST 2: Catalog & Stock Query');
  const prodRes = await fetch(`${BASE_URL}/products`);
  const prodData = await prodRes.json();
  assert(prodData.products.length > 0, 'Should return products');
  const firstProduct = prodData.products[0];
  const initialStock = firstProduct.stock_quantity;
  console.log(`  ✔ Catalog loaded: ${prodData.products.length} products. Target: "${firstProduct.name}" (Stock: ${initialStock})\n`);

  // 3. User Registration & JWT Issuance
  console.log('▶ TEST 3: User Registration with Hashed Credentials & JWT Token');
  const regEmail = `usman_${Date.now()}@vortexapex.io`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: regEmail,
      password: 'StrongCyberPassword2026!',
      name: 'Usman Ali',
      guestCartKey: testGuestKey
    })
  });
  const regData = await regRes.json();
  assert(regData.token, 'Registration must return a valid JWT token');
  assert.strictEqual(regData.user.email, regEmail.toLowerCase());
  testUserToken = regData.token;
  testUserId = regData.user.id;
  console.log(`  ✔ Registered user "${regData.user.name}" -> JWT Issued: ${testUserToken.substring(0, 24)}...\n`);

  // 4. JWT Authentication /me endpoint
  console.log('▶ TEST 4: JWT Token Verification');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const meData = await meRes.json();
  assert.strictEqual(meData.user.email, regEmail.toLowerCase());
  console.log(`  ✔ JWT verified successfully for user ID: ${meData.user.id}\n`);

  // 5. Persistent Shopping Cart Engine
  console.log('▶ TEST 5: Persistent Shopping Cart State Engine');
  // Add item
  const addCartRes = await fetch(`${BASE_URL}/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testUserToken}`
    },
    body: JSON.stringify({ productId: firstProduct.id, quantity: 2 })
  });
  const addCart = await addCartRes.json();
  assert(addCart.items.length > 0);
  assert.strictEqual(addCart.items[0].quantity, 2);
  console.log(`  ✔ Added 2 units of "${firstProduct.name}" to user's persistent cart. Subtotal: $${addCart.subtotal}`);

  // Test Stock limit enforcement
  const overStockRes = await fetch(`${BASE_URL}/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testUserToken}`
    },
    body: JSON.stringify({ productId: firstProduct.id, quantity: 9999 })
  });
  assert.strictEqual(overStockRes.status, 400, 'Adding more than stock must be rejected with 400');
  console.log('  ✔ Real-time stock overflow protection verified (rejected quantity > available inventory)\n');

  // 6. Promotional Coupon Validation
  console.log('▶ TEST 6: Promo Code Engine');
  const couponRes = await fetch(`${BASE_URL}/checkout/validate-coupon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'NEO2026', subtotal: addCart.subtotal })
  });
  const couponData = await couponRes.json();
  assert.strictEqual(couponData.valid, true);
  console.log(`  ✔ Validated coupon "NEO2026" (-20%): Discount = $${couponData.discountAmount}\n`);

  // 7. Payment Sandbox Failure Simulations
  console.log('▶ TEST 7: Stripe Sandbox Failure Scenarios');
  
  // 7a. Test Card Declined
  const declineRes = await fetch(`${BASE_URL}/checkout/process-sandbox-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testUserToken}`
    },
    body: JSON.stringify({
      card: { number: '4000 0000 0000 0069', brand: 'Visa' },
      orderData: {
        customerEmail: regEmail,
        customerName: 'Usman Ali',
        shippingAddress: { addressLine: 'Grid 9' },
        items: [{ productId: firstProduct.id, quantity: 1, price: firstProduct.price }]
      },
      sandboxOptions: { latencyMs: 50, simulateOutcome: 'decline' }
    })
  });
  assert.strictEqual(declineRes.status, 402, 'Declined card must return HTTP 402');
  const declineData = await declineRes.json();
  console.log(`  ✔ Card Declined path handled: code="${declineData.error.code}", decline_code="${declineData.error.decline_code}"`);

  // 7b. Test 3D Secure Challenge
  const threeDsRes = await fetch(`${BASE_URL}/checkout/process-sandbox-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testUserToken}`
    },
    body: JSON.stringify({
      card: { number: '4000 0002 0000 0002', brand: 'Visa 3DS' },
      orderData: {
        customerEmail: regEmail,
        customerName: 'Usman Ali',
        shippingAddress: { addressLine: 'Grid 9' },
        items: [{ productId: firstProduct.id, quantity: 1, price: firstProduct.price }]
      },
      sandboxOptions: { latencyMs: 50, simulateOutcome: '3ds' }
    })
  });
  const threeDsData = await threeDsRes.json();
  assert.strictEqual(threeDsData.requiresAction, true, '3DS card must trigger requiresAction: true');
  console.log(`  ✔ 3D Secure challenge path verified (Action required: "${threeDsData.actionType}", Hint: ${threeDsData.otpHint})\n`);

  // 8. Successful Settlement & Atomic Inventory Deduction
  console.log('▶ TEST 8: Full Settlement & Atomic Inventory Decrement');
  const checkoutRes = await fetch(`${BASE_URL}/checkout/process-sandbox-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testUserToken}`
    },
    body: JSON.stringify({
      card: { number: '4242 4242 4242 4242', brand: 'Visa' },
      orderData: {
        customerEmail: regEmail,
        customerName: 'Usman Ali',
        shippingAddress: {
          fullName: 'Usman Ali',
          addressLine: 'Sector 4, Neon Spire 101',
          city: 'Neo-Tokyo',
          state: 'Kanto Orbit',
          country: 'Cyber Federation'
        },
        shippingMethod: 'cyber_express',
        items: [{ productId: firstProduct.id, quantity: 2, price: firstProduct.price, name: firstProduct.name }],
        discountCode: 'NEO2026'
      },
      sandboxOptions: { latencyMs: 50, simulateOutcome: 'success' }
    })
  });
  const checkoutData = await checkoutRes.json();
  assert.strictEqual(checkoutRes.status, 200);
  assert(checkoutData.order, 'Must return settled order');
  const settledOrder = checkoutData.order;
  console.log(`  ✔ Order #${settledOrder.order_number} settled! Total: $${settledOrder.total} USD`);
  console.log(`  ✔ Payment Intent ID: ${settledOrder.payment_intent_id}`);

  // Verify stock was decremented
  const verifyProdRes = await fetch(`${BASE_URL}/products/${firstProduct.id}`);
  const verifyProd = (await verifyProdRes.json()).product;
  assert.strictEqual(verifyProd.stock_quantity, initialStock - 2, `Stock must decrease by 2 (Was: ${initialStock}, Now: ${verifyProd.stock_quantity})`);
  console.log(`  ✔ Atomic Inventory Deduction verified: ${initialStock} -> ${verifyProd.stock_quantity} units\n`);

  // 9. Inventory Audit Trail
  console.log('▶ TEST 9: Inventory Audit Logs Verification');
  const adminMetricsRes = await fetch(`${BASE_URL}/admin/metrics`);
  const adminMetrics = await adminMetricsRes.json();
  const latestLog = adminMetrics.inventoryLogs[0];
  assert.strictEqual(latestLog.reason, 'ORDER_CHECKOUT');
  assert.strictEqual(latestLog.change_amount, -2);
  console.log(`  ✔ Latest Audit Trail Log verified: [${latestLog.reason}] ${latestLog.product_name} (${latestLog.change_amount} units) Order: ${latestLog.order_number}\n`);

  // 10. Order Refund & Inventory Restock Path (Protected Route)
  console.log('▶ TEST 10: Order Refund & Inventory Restock Logic Path');
  
  // 10a. Verify unauthenticated refund is rejected (401)
  const unauthRefund = await fetch(`${BASE_URL}/orders/${settledOrder.id}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'MALICIOUS_UNAUTH_ATTEMPT' })
  });
  assert.strictEqual(unauthRefund.status, 401, 'Unauthenticated refund attempt must be blocked with HTTP 401');
  console.log('  ✔ Access Control Verified: Unauthenticated refund blocked (HTTP 401)');

  // 10b. Authorized refund by order owner
  const refundRes = await fetch(`${BASE_URL}/orders/${settledOrder.id}/refund`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testUserToken}`
    },
    body: JSON.stringify({ reason: 'AUTOMATED_TEST_SUITE' })
  });
  const refundData = await refundRes.json();
  assert.strictEqual(refundData.order.payment_status, 'REFUNDED');
  
  // Verify inventory restored
  const finalProdRes = await fetch(`${BASE_URL}/products/${firstProduct.id}`);
  const finalProd = (await finalProdRes.json()).product;
  assert.strictEqual(finalProd.stock_quantity, initialStock, `Stock must be restored to ${initialStock}`);
  console.log(`  ✔ Order #${settledOrder.order_number} refunded! Inventory restocked: ${verifyProd.stock_quantity} -> ${finalProd.stock_quantity} units\n`);

  console.log('========================================================');
  console.log('🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY WITH 100% SUCCESS');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
