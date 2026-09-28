import React, { useState } from 'react';
import { 
  Zap, 
  ShoppingCart, 
  User, 
  LogOut, 
  Search,
  Package,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSandbox } from '../context/SandboxContext';

export default function Navbar({ onOpenAuth, onOpenOrders, searchQuery, setSearchQuery }) {
  const { user, logout, demoLogin, isAuthenticated, isAdmin } = useAuth();
  const { totalItems, setIsDrawerOpen } = useCart();
  const { setIsConsoleOpen } = useSandbox();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#080c16]/95 border-b border-slate-800 transition-all">
      {/* Top Clean Promo Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          <span>Free Express Shipping on Orders Over $500</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 hidden sm:inline">Use code <strong className="text-cyan-400">NEO2026</strong> for 20% off</span>
          <button
            onClick={() => setIsConsoleOpen(true)}
            className="text-slate-400 hover:text-cyan-400 text-[11px] flex items-center gap-1 border-l border-slate-700 pl-3 transition-colors"
          >
            <Sliders className="w-3 h-3" />
            <span>Store Manager & Sandbox</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            <Zap className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white font-sans">
              VORTEX <span className="text-cyan-400 font-normal text-sm">STORE</span>
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, implants, processors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          
          {/* Orders Button */}
          <button
            onClick={onOpenOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-cyan-400 hover:border-slate-600 transition-all text-xs font-medium"
            title="View Order History"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Orders</span>
          </button>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all text-xs font-bold shadow-md shadow-cyan-500/10"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart</span>
            {totalItems > 0 && (
              <span className="w-5 h-5 bg-slate-950 text-white font-bold text-[11px] rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Auth / Profile Dropdown */}
          <div className="relative">
            {isAuthenticated ? (
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 transition-all"
              >
                <img 
                  src={user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'} 
                  alt={user.name} 
                  className="w-7 h-7 rounded-md bg-slate-800"
                />
                <span className="text-xs font-medium text-white hidden lg:inline pr-1">
                  {user.name.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all text-xs font-semibold"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {userDropdownOpen && isAuthenticated && (
              <div 
                className="absolute right-0 mt-2 w-56 glass-card p-2 shadow-2xl z-50 text-xs"
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                <div className="p-2 border-b border-slate-800 mb-1">
                  <div className="text-white font-bold truncate">{user.name}</div>
                  <div className="text-slate-400 text-[11px] truncate">{user.email}</div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => { onOpenOrders(); setUserDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                  >
                    <Package className="w-4 h-4 text-slate-400" />
                    My Orders
                  </button>
                  <button
                    onClick={() => { setIsConsoleOpen(true); setUserDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                  >
                    <Sliders className="w-4 h-4 text-slate-400" />
                    Inventory & Sandbox
                  </button>

                  <button
                    onClick={() => { logout(); setUserDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 border-t border-slate-800 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
