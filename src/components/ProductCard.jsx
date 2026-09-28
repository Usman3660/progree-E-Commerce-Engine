import React, { useState } from 'react';
import { ShoppingCart, Star, Eye, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, onOpenDetail, onShowToast }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      if (onShowToast) {
        onShowToast(`Added 1x "${product.name}" to cart`, 'success');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message, 'error');
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div 
      onClick={() => onOpenDetail(product)}
      className="glass-card-hover flex flex-col justify-between overflow-hidden group cursor-pointer relative"
    >
      {/* Top Banner Tag */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {product.tag && (
          <span className="badge-pill badge-cyan text-[10px] shadow-md">
            {product.tag}
          </span>
        )}
      </div>

      {/* Stock Status Indicator Pill */}
      <div className="absolute top-3 right-3 z-10">
        {isOutOfStock ? (
          <span className="badge-pill badge-rose text-[10px] shadow-md flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Out of Stock (0)
          </span>
        ) : isLowStock ? (
          <span className="badge-pill badge-amber text-[10px] shadow-md flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Only {product.stock_quantity} Left
          </span>
        ) : (
          <span className="badge-pill badge-emerald text-[10px] shadow-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> In Stock ({product.stock_quantity})
          </span>
        )}
      </div>

      {/* Product Image Area */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-transparent to-transparent opacity-80"></div>
        
        {/* Quick View Floating Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpenDetail(product); }}
          className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-500/20"
          title="Inspect Full Specifications"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>{product.category}</span>
            <span className="text-cyan-400/80">{product.sku}</span>
          </div>

          <h3 className="font-bold text-base text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Rating & Stock Health */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-amber-400 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-500 text-[11px]">({product.reviews_count})</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Units: <span className={isOutOfStock ? 'text-rose-400 font-bold' : isLowStock ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{product.stock_quantity}</span>
            </div>
          </div>

          {/* Pricing & Add to Cart Button */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-[11px] text-slate-500 line-through font-mono">
                ${product.original_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-lg font-bold font-mono text-cyan-300">
                ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <button
              disabled={isOutOfStock || adding}
              onClick={handleAddToCart}
              className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isOutOfStock 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'btn-primary'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{adding ? 'Adding...' : isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
