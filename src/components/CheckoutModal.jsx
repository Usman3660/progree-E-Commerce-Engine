import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Printer,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSandbox } from '../context/SandboxContext';

export default function CheckoutModal({ isOpen, onClose, onShowToast, onOrderSuccess }) {
  const { user } = useAuth();
  const { 
    items, 
    subtotal, 
    shippingMethod, 
    setShippingMethod, 
    shippingCost, 
    discountAmount, 
    appliedCoupon, 
    tax, 
    grandTotal, 
    fetchCart 
  } = useCart();
  const { latencyMs, testCards, selectTestCard } = useSandbox();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: 3DS Challenge, 4: Confirmation
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrderData, setCompletedOrderData] = useState(null);

  // Form State
  const [shippingForm, setShippingForm] = useState({
    fullName: user ? user.name : 'Usman Ali',
    email: user ? user.email : 'usman.ali@example.com',
    addressLine: '742 Evergreen Terrace, Sector 4',
    city: 'Neo-Tokyo',
    state: 'Kanto',
    postalCode: '90210',
    country: 'United States'
  });

  // Card Payment State
  const [cardData, setCardData] = useState({
    cardNumber: '4242 4242 4242 4242',
    cardholderName: user ? user.name : 'USMAN ALI',
    expMonth: '12',
    expYear: '2028',
    cvc: '123',
    brand: 'Visa'
  });

  // 3DS State
  const [otpInput, setOtpInput] = useState('');
  const [otpHint, setOtpHint] = useState('777999');
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMessage('');
      setProcessing(false);
      setCompletedOrderData(null);
      if (user) {
        setShippingForm(prev => ({
          ...prev,
          fullName: user.name,
          email: user.email,
          cardholderName: user.name.toUpperCase()
        }));
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleAutofillShipping = () => {
    setShippingForm({
      fullName: user ? user.name : 'Usman Ali',
      email: user ? user.email : 'usman.ali@example.com',
      addressLine: '100 Innovation Way, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'United States'
    });
  };

  const handleSelectTestCard = (testCard) => {
    selectTestCard(testCard);
    setCardData({
      cardNumber: testCard.cardNumber,
      cardholderName: (shippingForm.fullName || 'USMAN ALI').toUpperCase(),
      expMonth: testCard.expMonth,
      expYear: testCard.expYear,
      cvc: testCard.cvc,
      brand: testCard.cardBrand
    });
    setErrorMessage('');
  };

  const handleProcessPayment = async (verifiedOtp = false) => {
    setProcessing(true);
    setErrorMessage('');

    try {
      const payload = {
        paymentIntentId: paymentIntentId || `pi_sbx_${Date.now()}`,
        card: cardData,
        orderData: {
          customerEmail: shippingForm.email,
          customerName: shippingForm.fullName,
          shippingAddress: shippingForm,
          shippingMethod,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            name: item.product.name
          })),
          discountCode: appliedCoupon?.code
        },
        sandboxOptions: {
          latencyMs,
          simulateOutcome: 'auto'
        },
        otpVerified: verifiedOtp
      };

      const res = await fetch('/api/checkout/process-sandbox-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        const errObj = data.error || {};
        const msg = errObj.message || 'Payment authorization failed.';
        setErrorMessage(msg);
        setProcessing(false);
        return;
      }

      if (data.requiresAction && data.actionType === '3ds_challenge') {
        setPaymentIntentId(data.paymentIntentId);
        setOtpHint(data.otpHint || '777999');
        setStep(3);
        setProcessing(false);
        return;
      }

      // Success
      setCompletedOrderData(data);
      setStep(4);
      setProcessing(false);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      if (onShowToast) {
        onShowToast(`Order #${data.order.order_number} confirmed!`, 'success');
      }

      fetchCart();
      if (onOrderSuccess) onOrderSuccess(data.order);

    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with checkout server.');
      setProcessing(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otpInput !== otpHint && otpInput !== '777999') {
      setErrorMessage('Invalid verification code. Use: 777999');
      return;
    }
    handleProcessPayment(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col bg-[#080d1a] border border-slate-700">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">
              Secure Checkout
            </h3>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-medium">
          <div className={`p-2.5 text-center transition-all ${step === 1 ? 'bg-cyan-500/10 text-cyan-400 font-bold border-b-2 border-cyan-400' : step > 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
            1. Shipping Address
          </div>
          <div className={`p-2.5 text-center transition-all ${step === 2 || step === 3 ? 'bg-cyan-500/10 text-cyan-400 font-bold border-b-2 border-cyan-400' : step > 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
            2. Payment
          </div>
          <div className={`p-2.5 text-center transition-all ${step === 4 ? 'bg-emerald-500/10 text-emerald-400 font-bold border-b-2 border-emerald-400' : 'text-slate-500'}`}>
            3. Order Complete
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Payment Error:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* ================= STEP 1: SHIPPING ================= */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" /> Shipping Destination
                  </h4>
                  <p className="text-xs text-slate-400">Where should we deliver your order?</p>
                </div>
                <button
                  onClick={handleAutofillShipping}
                  className="btn-cyan-outline text-xs py-1 px-2.5"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Autofill Sample
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={shippingForm.fullName}
                    onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email (For Order Receipt)</label>
                  <input
                    type="email"
                    value={shippingForm.email}
                    onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={shippingForm.addressLine}
                    onChange={(e) => setShippingForm({ ...shippingForm, addressLine: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={shippingForm.state}
                    onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Delivery Speed Selector */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">Delivery Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div 
                    onClick={() => setShippingMethod('cyber_express')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${shippingMethod === 'cyber_express' ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-center font-bold text-white">
                      <span>Express</span>
                      <span>$18.00</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">1-2 Business Days</div>
                  </div>

                  <div 
                    onClick={() => setShippingMethod('drone_orbital')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${shippingMethod === 'drone_orbital' ? 'border-purple-400 bg-purple-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-center font-bold text-white">
                      <span>Drone Delivery</span>
                      <span>$35.00</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Same-Day Priority</div>
                  </div>

                  <div 
                    onClick={() => setShippingMethod('ground_standard')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${shippingMethod === 'ground_standard' ? 'border-emerald-400 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-center font-bold text-white">
                      <span>Standard Ground</span>
                      <span>$8.00</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">3-5 Business Days</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= STEP 2: PAYMENT ================= */}
          {step === 2 && (
            <div className="space-y-5">
              
              {/* Sandbox Test Card Presets */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                  <span>Sandbox Test Cards (Click to auto-fill):</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {testCards.slice(0, 4).map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectTestCard(card)}
                      className={`p-2 rounded-lg text-left border transition-all ${
                        cardData.cardNumber === card.cardNumber 
                          ? 'border-cyan-400 bg-cyan-500/15 text-white font-semibold' 
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-cyan-400">{card.category}</div>
                      <div className="text-[10px] text-slate-400 font-mono">...{card.cardNumber.slice(-4)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cardData.cardNumber}
                      onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                      className="form-input pl-9 font-mono"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Name on Card</label>
                  <input
                    type="text"
                    value={cardData.cardholderName}
                    onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value.toUpperCase() })}
                    className="form-input uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Expiry</label>
                    <input
                      type="text"
                      value={`${cardData.expMonth}/${cardData.expYear}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('/');
                        setCardData({ ...cardData, expMonth: parts[0] || '12', expYear: parts[1] || '2028' });
                      }}
                      className="form-input text-center font-mono"
                      placeholder="12/28"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardData.cvc}
                      onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                      className="form-input text-center font-mono"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Preview */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-cyan-400">
                    <span>Discount:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Shipping:</span>
                  <span className="text-white">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Tax:</span>
                  <span className="text-white">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-cyan-300 pt-2 border-t border-slate-800">
                  <span>Total:</span>
                  <span>${grandTotal.toFixed(2)} USD</span>
                </div>
              </div>

            </div>
          )}

          {/* ================= STEP 3: 3DS OTP ================= */}
          {step === 3 && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto text-xs">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Bank Verification Required</h4>
                <p className="text-slate-400 mt-1">
                  Please enter the 6-digit code sent to your phone.
                </p>
              </div>

              <div className="w-full space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="777999"
                  className="form-input text-center text-lg tracking-widest font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => setOtpInput(otpHint)}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Autofill code ({otpHint})
                </button>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 btn-secondary text-xs py-2"
                >
                  Back
                </button>
                <button
                  disabled={processing || !otpInput}
                  onClick={handleVerifyOtp}
                  className="flex-1 btn-primary text-xs py-2"
                >
                  {processing ? 'Verifying...' : 'Verify & Pay'}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: ORDER CONFIRMED ================= */}
          {step === 4 && completedOrderData && (
            <div className="space-y-5 py-2 text-xs">
              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Thank you for your order!</h3>
                <p className="text-slate-300">
                  Order <strong className="text-cyan-400">#{completedOrderData.order.order_number}</strong> has been placed and confirmed.
                </p>
              </div>

              {/* Order Receipt Details */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="font-bold text-white text-xs">Purchased Items:</div>
                <div className="space-y-1.5">
                  {completedOrderData.order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-800/60 last:border-0">
                      <span className="text-slate-300">{item.quantity}x {item.product_name}</span>
                      <span className="text-white font-semibold">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-cyan-300">
                  <span>Total Paid:</span>
                  <span>${completedOrderData.order.total.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 btn-primary text-xs py-2.5"
                >
                  Continue Shopping
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer (for Steps 1 and 2) */}
        {step < 3 && (
          <div className="p-4 px-6 border-t border-slate-800 flex items-center justify-between text-xs">
            {step === 1 ? (
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                Cancel
              </button>
            ) : (
              <button onClick={() => setStep(1)} className="btn-secondary py-2 px-3 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Total:</div>
                <div className="text-base font-bold text-cyan-300">${grandTotal.toFixed(2)}</div>
              </div>

              {step === 1 ? (
                <button onClick={() => setStep(2)} className="btn-primary py-2 px-4">
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  disabled={processing}
                  onClick={() => handleProcessPayment(false)}
                  className="btn-primary py-2 px-5 font-bold"
                >
                  {processing ? 'Processing Payment...' : `Pay $${grandTotal.toFixed(2)}`}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
