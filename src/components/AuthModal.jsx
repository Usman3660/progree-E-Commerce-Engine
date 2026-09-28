import React, { useState } from 'react';
import { X, Lock, User, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function AuthModal({ isOpen, onClose, onShowToast }) {
  const { login, register } = useAuth();
  const { fetchCart } = useCart();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (onShowToast) onShowToast(`Welcome back, ${res.user.name}!`, 'success');
      } else {
        const res = await register(email, password, name);
        if (onShowToast) onShowToast(`Account created! Welcome, ${res.user.name}.`, 'success');
      }
      fetchCart();
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl relative bg-[#0a0f1d] border border-slate-700">
        
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>{mode === 'login' ? 'Sign In to Your Account' : 'Create New Account'}</span>
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-3 text-center font-medium transition-all ${
              mode === 'login' 
                ? 'bg-slate-800 text-cyan-400 font-bold border-b-2 border-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`py-3 text-center font-medium transition-all ${
              mode === 'register' 
                ? 'bg-slate-800 text-cyan-400 font-bold border-b-2 border-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input pl-9"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-9"
                />
              </div>
              {mode === 'register' && (
                <div className="text-[11px] text-slate-500 mt-1">
                  Password must be at least 6 characters
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 mt-2 text-xs font-semibold"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
