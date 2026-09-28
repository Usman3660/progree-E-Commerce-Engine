import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { SandboxProvider, useSandbox } from './context/SandboxContext';

import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import SandboxAdminConsole from './components/SandboxAdminConsole';
import OrdersModal from './components/OrdersModal';
import ToastNotification from './components/ToastNotification';

import { 
  Cpu, 
  RefreshCw, 
  Search, 
  ArrowUpDown,
  Terminal,
  Zap
} from 'lucide-react';

function StoreApp() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const { isConsoleOpen, setIsConsoleOpen, refreshTelemetry } = useSandbox();
  const { fetchCart } = useCart();

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (inStockOnly) params.append('inStockOnly', 'true');

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        if (data.categories) setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, inStockOnly]);

  // Sort Products
  const sortedProducts = useMemo(() => {
    let list = [...products];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock') {
      list.sort((a, b) => b.stock_quantity - a.stock_quantity);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [products, sortBy]);

  const scrollToCatalog = () => {
    const el = document.getElementById('neural-catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070a12] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Hero Banner */}
      <HeroBanner
        onExploreCatalog={scrollToCatalog}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Catalog & Store Section */}
      <main id="neural-catalog" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" /> Hardware Repository // Live Inventory
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Neural & Cybernetic Artifacts
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { fetchProducts(); fetchCart(); refreshTelemetry(); showToast('Synchronized with backend database', 'info'); }}
              className="btn-secondary text-xs py-2 px-3"
              title="Sync and reload live stock"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Catalog</span>
            </button>

            <button
              onClick={() => setIsConsoleOpen(true)}
              className="btn-cyan-outline text-xs py-2 px-3.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Inventory Matrix</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap font-medium ${
                selectedCategory === cat
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Controls Bar: Count, In-Stock filter, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Showing:</span>
            <span className="text-cyan-300 font-semibold">{sortedProducts.length} Neural Products</span>
            {searchQuery && (
              <span className="text-slate-500">for "{searchQuery}"</span>
            )}
          </div>

          <div className="flex items-center gap-5 flex-wrap">
            {/* In Stock Only Switch */}
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400 text-xs"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="stock">Stock Availability</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
            <div className="text-xs text-slate-400 font-mono">Loading quantum catalog...</div>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3 glass-card p-8">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-sm">No matching hardware found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No products match your active search filters. Try clearing your search or switching category filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setInStockOnly(false); }}
              className="btn-secondary text-xs mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetail={(prod) => setSelectedProduct(prod)}
                onShowToast={showToast}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#040710] py-10 px-4 sm:px-6 lg:px-8 mt-16 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-cyan-400 flex items-center justify-center text-black font-bold">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-white">
                VORTEX<span className="text-cyan-400">.APEX</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Architectural showcase for secure e-commerce systems, JWT cryptographic authentication, persistent shopping cart state engines, atomic inventory settlement logic, and interactive Stripe sandbox testing.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="badge-pill badge-cyan text-[10px]">JWT HS256 Auth</span>
              <span className="badge-pill badge-emerald text-[10px]">Atomic Stock Settling</span>
              <span className="badge-pill badge-rose text-[10px]">Stripe Sandbox</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-200 uppercase text-[11px] font-mono">Quick Access</div>
            <ul className="space-y-1 text-slate-400">
              <li><button onClick={() => setIsAuthOpen(true)} className="hover:text-cyan-300 transition-colors">JWT Authentication</button></li>
              <li><button onClick={() => setIsConsoleOpen(true)} className="hover:text-cyan-300 transition-colors">Inventory Matrix</button></li>
              <li><button onClick={() => setIsOrdersOpen(true)} className="hover:text-cyan-300 transition-colors">Order Ledgers & Invoices</button></li>
              <li><button onClick={scrollToCatalog} className="hover:text-cyan-300 transition-colors">Hardware Catalog</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-200 uppercase text-[11px] font-mono">Test Sandbox Cards</div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono">
              <div><span className="text-emerald-400 font-semibold">4242...4242</span>: Settle (200 OK)</div>
              <div><span className="text-purple-400 font-semibold">4000...0002</span>: 3D Secure Challenge</div>
              <div><span className="text-rose-400 font-semibold">4000...0069</span>: Card Declined</div>
              <div><span className="text-amber-400 font-semibold">4000...0127</span>: Insufficient Funds</div>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>&copy; 2026 VORTEX APEX ENGINE. ALL INVENTORY ATOMICALLY RESERVED.</div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            All Sandbox Engines Nominal
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onShowToast={showToast}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        onShowToast={showToast}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onShowToast={showToast}
        onOrderSuccess={(order) => {
          fetchProducts();
          refreshTelemetry();
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onShowToast={showToast}
      />

      <SandboxAdminConsole
        onShowToast={showToast}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        onShowToast={showToast}
      />

      {/* Holographic Toast Notification */}
      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SandboxProvider>
          <StoreApp />
        </SandboxProvider>
      </CartProvider>
    </AuthProvider>
  );
}
