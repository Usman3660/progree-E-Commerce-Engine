import React, { useState, useEffect } from 'react';
import { X, PackageCheck, FileText, Printer, RotateCcw, CheckCircle2, ShieldAlert, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function OrdersModal({ isOpen, onClose, onShowToast }) {
  const { user, isAuthenticated } = useAuth();
  const { fetchCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = user?.email ? `/api/orders?email=${encodeURIComponent(user.email)}` : '/api/orders';
      const res = await fetch(url, {
        headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleRefund = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        if (onShowToast) onShowToast(`Order #${data.order.order_number} refunded and items restocked!`, 'success');
        fetchOrders();
        fetchCart();
      } else {
        if (onShowToast) onShowToast(data.error, 'error');
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel border-cyan-500/40 w-full max-w-4xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col bg-[#070b16]">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-cyan-500/20 bg-[#060a14] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              ORDER LEDGER & INVOICES
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
          {orders.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-white text-sm">NO ORDERS RECORDED</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-xs">
                Complete a transaction through the Payment Sandbox to generate an order invoice.
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div 
                key={ord.id}
                className="p-4 rounded-xl bg-[#0b1022] border border-slate-800 space-y-3 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white">ORDER #{ord.order_number}</span>
                      <span className={`cyber-badge text-[9px] py-0.5 ${ord.payment_status === 'PAID' ? 'badge-emerald' : 'badge-magenta'}`}>
                        {ord.payment_status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Placed on {new Date(ord.created_at).toLocaleString()} • {ord.customer_name} ({ord.customer_email})
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-black text-cyan-400">${ord.total.toFixed(2)} USD</div>
                      <div className="text-[10px] text-slate-500 font-mono">Intent: {ord.payment_intent_id}</div>
                    </div>

                    {ord.payment_status === 'PAID' && (
                      <button
                        onClick={() => handleRefund(ord.id)}
                        className="btn-cyber-danger text-[10px] py-1 px-2.5 flex items-center gap-1"
                        title="Simulate Refund & Trigger Inventory Restock"
                      >
                        <RotateCcw className="w-3 h-3" /> Refund & Restock
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {ord.items.map((item, i) => (
                    <div key={i} className="p-2 rounded bg-slate-900/80 border border-slate-800/90 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={item.image_url} 
                          alt="" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80';
                          }}
                          className="w-8 h-8 rounded object-cover" 
                        />
                        <div className="truncate">
                          <div className="text-white font-bold truncate">{item.product_name}</div>
                          <div className="text-[10px] text-slate-500">{item.quantity} units @ ${item.price.toFixed(2)}</div>
                        </div>
                      </div>
                      <span className="text-cyan-300 font-bold shrink-0 ml-2">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Shipping & Payment Meta */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <div>
                    Destination: <span className="text-slate-200">{ord.shipping_address?.addressLine}, {ord.shipping_address?.city}</span>
                  </div>
                  <div>
                    Method: <span className="text-cyan-400">{ord.shipping_method}</span> | Subtotal: <span className="text-white">${ord.subtotal.toFixed(2)}</span> | Tax: <span className="text-white">${ord.tax.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-cyan-500/20 bg-[#060a14] flex items-center justify-between font-mono text-xs">
          <button
            onClick={() => window.print()}
            className="btn-cyber-outline py-2 px-3 flex items-center gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print All Invoices
          </button>
          <button
            onClick={onClose}
            className="btn-cyber-primary py-2 px-4 text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
