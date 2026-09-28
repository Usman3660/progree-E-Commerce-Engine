import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ArrowRight, 
  ShieldCheck, 
  Tag, 
  AlertTriangle, 
  Check,
  Percent,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartDrawer({ onProceedToCheckout, onShowToast }) {
  const { 
    items, 
    subtotal, 
    totalItems, 
    hasStockIssue, 
    isDrawerOpen, 
    setIsDrawerOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    shippingCost,
    discountAmount,
    tax,
    grandTotal
  } = useCart();

  const { isAuthenticated, user } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (!isDrawerOpen) return null;

  const handleApplyCoupon = async (codeToApply) => {
    const targetCode = codeToApply || couponInput;
    if (!targetCode) return;
    setCouponLoading(true);
    try {
      const result = await applyCoupon(targetCode);
      if (onShowToast) {
        onShowToast(`Promo code "${result.code}" applied: ${result.description}`, 'success');
      }
      setCouponInput('');
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message, 'error');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel border-l border-cyan-500/30 rounded-none bg-[#0a0f1d] flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-5 border-b border-cyan-500/20 bg-[#070c18] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white font-mono flex items-center gap-2">
                  PERSISTENT CART
                  <span className="cyber-badge badge-cyan text-[10px]">{totalItems} ITEMS</span>
                </h2>
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {isAuthenticated ? `Synced to ${user.name}` : 'Local Guest Session Synced'}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white">YOUR CART IS EMPTY</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Explore our cybernetic hardware catalog to add neural processors, bio-manipulators, and quantum units.
                </p>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="btn-cyber-outline text-xs mt-2"
                >
                  DISCOVER HARDWARE
                </button>
              </div>
            ) : (
              <>
                {/* Stock issues warning alert */}
                {hasStockIssue && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Inventory Alert:</span> Some items in your cart exceed available stock. Please adjust quantities before checkout.
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {items.map((item) => {
                    const product = item.product;
                    if (!product) return null;
                    const isExceeding = item.quantity > product.stock_quantity;
                    const isZeroStock = product.stock_quantity <= 0;

                    return (
                      <div 
                        key={item.productId}
                        className={`p-3.5 rounded-xl bg-[#0d1424] border transition-all ${
                          isZeroStock || isExceeding 
                            ? 'border-rose-500/50 bg-rose-950/20' 
                            : 'border-slate-800 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="flex gap-3">
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-16 h-16 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-mono text-xs font-bold text-white truncate">{product.name}</h4>
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[10px] font-mono text-cyan-400/80">{product.sku}</div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="font-mono font-bold text-sm text-cyan-300">
                                ${(product.price * item.quantity).toFixed(2)}
                                <span className="text-[10px] text-slate-500 font-normal ml-1">
                                  (${product.price.toFixed(2)} ea)
                                </span>
                              </div>

                              {/* Quantity Stepper */}
                              <div className="flex items-center border border-slate-700 rounded-md bg-[#080d1a] font-mono text-xs">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="px-2 py-1 text-slate-400 hover:text-white"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 py-1 text-white font-bold">{item.quantity}</span>
                                <button
                                  disabled={item.quantity >= product.stock_quantity}
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Stock status badge for item */}
                            <div className="mt-1.5 text-[10px] font-mono flex items-center justify-between">
                              <span className="text-slate-500">Max Available: {product.stock_quantity}</span>
                              {isZeroStock ? (
                                <span className="text-rose-400 font-bold">SOLD OUT</span>
                              ) : isExceeding ? (
                                <span className="text-amber-400 font-bold">EXCEEDS STOCK</span>
                              ) : (
                                <span className="text-emerald-400">AVAILABLE</span>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-between items-center text-xs font-mono">
                  <button
                    onClick={clearCart}
                    className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Entire Cart
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer & Order Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-cyan-500/20 bg-[#070c18] space-y-4">
              
              {/* Promo Code Applicator */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span className="text-[11px] font-mono text-slate-300 font-bold uppercase">PROMOTIONAL CODE:</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-500/10 border border-cyan-400/40 text-xs font-mono">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{appliedCoupon.code}</span>
                      <span className="text-slate-400 font-normal">(-${appliedCoupon.discountAmount.toFixed(2)})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-slate-400 hover:text-rose-400 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. NEO2026 or SANDBOX100"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="cyber-input py-1.5 text-xs uppercase font-mono flex-1"
                      />
                      <button
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading || !couponInput.trim()}
                        className="btn-cyber-outline py-1.5 px-3 text-xs"
                      >
                        {couponLoading ? '...' : 'APPLY'}
                      </button>
                    </div>

                    {/* Quick promo tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleApplyCoupon('NEO2026')}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:border-cyan-400"
                      >
                        + NEO2026 (20% Off)
                      </button>
                      <button
                        onClick={() => handleApplyCoupon('SANDBOX100')}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:border-purple-400"
                      >
                        + SANDBOX100 (100% Free)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-1.5 text-xs font-mono border-t border-slate-800 pt-3">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-cyan-400">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Est. Cyber-Express Shipping:</span>
                  <span className="text-white">${shippingCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Neo-City Tax (8.25%):</span>
                  <span className="text-white">${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base font-black text-cyan-400 border-t border-slate-800 pt-2">
                  <span>Grand Total:</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                disabled={hasStockIssue || items.length === 0}
                onClick={() => {
                  setIsDrawerOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full btn-cyber-primary py-3.5 text-sm"
              >
                <span>PROCEED TO CHECKOUT PIPELINE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
