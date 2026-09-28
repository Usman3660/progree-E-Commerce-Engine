import React, { useState } from 'react';
import { X, ShoppingCart, Star, ShieldCheck, CheckCircle2, Cpu, AlertTriangle, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductModal({ product, onClose, onShowToast, onOpenAuth }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const handleAddToCart = async () => {
    if (!user) {
      if (onShowToast) {
        onShowToast('Please sign in or create an account to add items to your cart.', 'info');
      }
      if (onOpenAuth) {
        onOpenAuth();
      }
      return;
    }
    if (isOutOfStock) return;
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      if (onShowToast) {
        onShowToast(`Added ${quantity}x "${product.name}" to cart`, 'success');
      }
      onClose();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message, 'error');
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="glass-panel border-cyan-500/40 w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-[#080d1a]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-200 font-semibold tracking-wide">
              Product Details & Specifications ({product.sku})
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Image Preview */}
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-700/60 bg-[#060a14] h-64">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
                {product.tag && (
                  <span className="absolute top-3 left-3 cyber-badge badge-cyan text-[10px]">
                    {product.tag}
                  </span>
                )}
              </div>

              {/* Stock Bar */}
              <div className="p-3 rounded-lg bg-[#080e1c] border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Warehouse Allocation:</span>
                  <span className={isOutOfStock ? 'text-rose-400 font-bold' : isLowStock ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {isOutOfStock ? 'OUT OF STOCK' : `${product.stock_quantity} Units Available`}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all ${isOutOfStock ? 'bg-rose-500 w-0' : isLowStock ? 'bg-amber-400' : 'bg-cyan-400'}`}
                    style={{ width: `${Math.min(100, (product.stock_quantity / 25) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Product Details & Specs */}
            <div className="space-y-4">
              <div>
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wide">{product.category}</div>
                <h2 className="text-2xl font-black text-white font-mono mt-1">{product.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-amber-400 font-mono text-xs">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-bold">{product.rating}</span>
                    <span className="text-slate-500">({product.reviews_count} netrunner reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {product.description}
              </p>

              {/* Feature Bullet Points */}
              {product.features && (
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-slate-400 font-bold">KEY CAPABILITIES:</div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {product.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Specifications Table */}
              {product.specs && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-xs font-mono text-slate-400 font-bold">ENGINEERING MATRIX:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="p-2 rounded bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">{key}</div>
                        <div className="text-cyan-300 font-semibold">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 px-6 border-t border-cyan-500/20 bg-[#080d1a] flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 line-through font-mono">
              ${product.original_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-2xl font-black font-mono text-cyan-400">
              ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isOutOfStock && (
              <div className="flex items-center border border-cyan-500/30 rounded-lg bg-[#0c1222] font-mono">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-white font-bold text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  +
                </button>
              </div>
            )}

            <button
              disabled={isOutOfStock || adding}
              onClick={handleAddToCart}
              className={`btn-cyber-primary ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{adding ? 'UPDATING CART...' : isOutOfStock ? 'OUT OF STOCK' : 'ADD TO SECURE CART'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
