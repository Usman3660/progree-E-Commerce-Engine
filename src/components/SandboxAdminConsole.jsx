import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Cpu, 
  CreditCard, 
  PackageCheck, 
  BarChart3, 
  RefreshCw, 
  Plus, 
  Minus, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Code,
  ArrowRight,
  Database
} from 'lucide-react';
import { useSandbox } from '../context/SandboxContext';
import { useCart } from '../context/CartContext';

export default function SandboxAdminConsole({ onShowToast }) {
  const { 
    isConsoleOpen, 
    setIsConsoleOpen, 
    activeTab, 
    setActiveTab, 
    telemetry, 
    refreshTelemetry 
  } = useSandbox();

  const { fetchCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    if (isConsoleOpen) {
      refreshTelemetry();
    }
  }, [isConsoleOpen]);

  if (!isConsoleOpen) return null;

  // Handle Inline Stock Adjustment
  const handleStockAdjust = async (productId, newStock) => {
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStock, reason: 'OPERATOR_MANUAL_OVERRIDE' })
      });
      const data = await res.json();
      if (res.ok) {
        if (onShowToast) onShowToast(`Inventory updated: ${data.product.name} = ${data.product.stock_quantity} units`, 'success');
        refreshTelemetry();
        fetchCart();
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    }
  };

  // Handle Order Refund & Backend Inventory Restock Logic Path
  const handleRefundOrder = async (orderId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'ADMIN_OPERATOR_SIMULATION' })
      });
      const data = await res.json();
      if (res.ok) {
        if (onShowToast) onShowToast(`Order refunded! Restocked ${data.restockLogs.length} items to warehouse.`, 'success');
        refreshTelemetry();
        fetchCart();
      } else {
        if (onShowToast) onShowToast(data.error, 'error');
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Factory Reset Database
  const handleResetCatalog = async () => {
    if (!window.confirm('Reset database to factory seed catalog, accounts, and inventory?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-catalog', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (onShowToast) onShowToast(data.message, 'success');
        refreshTelemetry();
        fetchCart();
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const summary = telemetry?.summary || {};
  const products = telemetry?.products || [];
  const inventoryLogs = telemetry?.inventoryLogs || [];
  const sandboxTransactions = telemetry?.sandboxTransactions || [];
  const recentOrders = telemetry?.recentOrders || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg animate-fadeIn">
      <div className="glass-panel border-cyan-500/50 w-full max-w-6xl overflow-hidden shadow-2xl relative max-h-[94vh] flex flex-col bg-[#070b16]">
        
        {/* Modal Top Header */}
        <div className="p-4 px-6 border-b border-cyan-500/20 bg-[#060912] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-400/30">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white font-mono flex items-center gap-2">
                OPERATOR MATRIX & PAYMENT SANDBOX CONSOLE
                <span className="cyber-badge badge-cyan text-[10px]">LIVE TELEMETRY</span>
              </h2>
              <div className="text-[10px] font-mono text-slate-400">
                Direct inspect & manipulate inventory logic paths, Stripe sandbox intents, and audit ledgers.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshTelemetry}
              className="p-1.5 rounded-lg bg-[#0c1324] border border-slate-800 text-cyan-400 hover:border-cyan-400 transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsConsoleOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* System Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#090e1c] border-b border-slate-800/80 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-cyan-500/20">
            <div className="text-[10px] text-slate-400">TOTAL SETTLED REVENUE</div>
            <div className="text-base font-black text-cyan-400">${summary.totalRevenue?.toFixed(2) || '0.00'}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-purple-500/20">
            <div className="text-[10px] text-slate-400">ORDERS PROCESSED</div>
            <div className="text-base font-black text-purple-300">
              {summary.totalOrders || 0} <span className="text-[10px] text-slate-500 font-normal">({summary.paidOrders || 0} Paid / {summary.refundedOrders || 0} Refunded)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-500/20">
            <div className="text-[10px] text-slate-400">TOTAL STOCK UNITS</div>
            <div className="text-base font-black text-emerald-400">{summary.totalStockUnits || 0} Units</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-500/20">
            <div className="text-[10px] text-slate-400">LOW / ZERO STOCK ALERTS</div>
            <div className="text-base font-black text-amber-400">
              {summary.lowStockCount || 0} Low / {summary.outOfStockCount || 0} Out
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 font-mono text-xs overflow-x-auto bg-[#060a14]">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-5 border-r border-slate-800 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-cyan-500/15 text-cyan-300 font-bold border-b-2 border-b-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>LIVE INVENTORY MANAGER ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`py-3 px-5 border-r border-slate-800 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'audit_logs' ? 'bg-cyan-500/15 text-cyan-300 font-bold border-b-2 border-b-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>INVENTORY AUDIT TRAIL ({inventoryLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-3 px-5 border-r border-slate-800 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'transactions' ? 'bg-cyan-500/15 text-cyan-300 font-bold border-b-2 border-b-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>SANDBOX TRANSACTIONS ({sandboxTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-5 border-r border-slate-800 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'orders' ? 'bg-cyan-500/15 text-cyan-300 font-bold border-b-2 border-b-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>ORDERS & RESTOCK PATHS ({recentOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-5 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'supabase' ? 'bg-emerald-500/15 text-emerald-300 font-bold border-b-2 border-b-emerald-400' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>SUPABASE POSTGRESQL</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">

          {/* TAB 1: LIVE INVENTORY MANAGER */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Directly adjust stock quantities to test out-of-stock validation, limits, and real-time inventory updates.
                </span>
                <button
                  onClick={handleResetCatalog}
                  className="btn-cyber-danger text-[11px] py-1 px-3 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Factory Reset Database
                </button>
              </div>

              <div className="space-y-2">
                {products.map((p) => {
                  const isOutOfStock = p.stock_quantity <= 0;
                  const isLow = p.stock_quantity > 0 && p.stock_quantity <= 5;

                  return (
                    <div 
                      key={p.id}
                      className="p-3.5 rounded-xl bg-[#0b1020] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold truncate">{p.name}</span>
                            <span className="text-[10px] text-cyan-400">{p.sku}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">${p.price.toFixed(2)} • {p.category}</div>
                        </div>
                      </div>

                      {/* Stock Manipulator */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className={`font-bold ${isOutOfStock ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {isOutOfStock ? 'DEPLETED (0)' : `${p.stock_quantity} IN STOCK`}
                          </div>
                          <div className="text-[10px] text-slate-500">Live Inventory Counter</div>
                        </div>

                        {/* Fast Adjust Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStockAdjust(p.id, Math.max(0, p.stock_quantity - 1))}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Decrement 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleStockAdjust(p.id, p.stock_quantity + 5)}
                            className="p-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold"
                            title="Add 5 units"
                          >
                            +5
                          </button>

                          <button
                            onClick={() => handleStockAdjust(p.id, 0)}
                            className="p-1.5 px-2 rounded bg-rose-950/60 border border-rose-500/30 hover:bg-rose-900/60 text-rose-300 text-[10px]"
                            title="Set to Out of Stock for testing"
                          >
                            Zero Stock
                          </button>

                          <button
                            onClick={() => handleStockAdjust(p.id, 20)}
                            className="p-1.5 px-2 rounded bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/60 text-emerald-300 text-[10px]"
                            title="Restock to 20 units"
                          >
                            Restock 20
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY AUDIT TRAIL */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-3">
              <div className="text-slate-400">
                Immutable audit ledger recording every inventory state transition, decrement upon checkout, and restock upon refund.
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090d18]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 bg-slate-900/80">
                      <th className="p-3">TIMESTAMP</th>
                      <th className="p-3">PRODUCT</th>
                      <th className="p-3">CHANGE</th>
                      <th className="p-3">STOCK DELTA</th>
                      <th className="p-3">REASON</th>
                      <th className="p-3">REFERENCE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {inventoryLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">No inventory events logged yet.</td>
                      </tr>
                    ) : (
                      inventoryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-cyan-500/5 transition-colors">
                          <td className="p-3 text-[11px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</td>
                          <td className="p-3 font-bold text-white">{log.product_name}</td>
                          <td className="p-3 font-bold">
                            <span className={log.change_amount < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                              {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 font-mono">
                            {log.previous_stock} &rarr; <span className="text-cyan-300 font-bold">{log.new_stock}</span>
                          </td>
                          <td className="p-3">
                            <span className={`cyber-badge text-[9px] py-0.5 ${
                              log.reason === 'ORDER_CHECKOUT' ? 'badge-magenta' : 
                              log.reason === 'ORDER_REFUND' ? 'badge-emerald' : 'badge-cyan'
                            }`}>
                              {log.reason}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-cyan-400/80">{log.order_number || log.reference_id}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SANDBOX TRANSACTIONS & WEBHOOKS */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="text-slate-400">
                Stripe Sandbox Payment Intent authorizations, risk evaluation, 3DS telemetry, and raw JSON payloads.
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Transaction List */}
                <div className="lg:col-span-6 space-y-2">
                  {sandboxTransactions.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-500">
                      No sandbox transactions recorded. Perform a checkout to generate intents!
                    </div>
                  ) : (
                    sandboxTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedTx?.id === tx.id 
                            ? 'border-cyan-400 bg-cyan-950/30' 
                            : 'border-slate-800 bg-[#090d1a] hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{tx.payment_intent_id}</span>
                          <span className="cyber-badge badge-emerald text-[9px]">200 SUCCEEDED</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                          <span>Order #{tx.order_number}</span>
                          <span className="text-cyan-300 font-bold">${tx.amount?.toFixed(2)} USD</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                          <span>Card: {tx.card_brand} •••• {tx.card_last4}</span>
                          <span>Latency: {tx.latency_ms}ms</span>
                          <span>3DS: {tx.three_d_secure ? 'Passed' : 'None'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Raw JSON Inspector */}
                <div className="lg:col-span-6">
                  <div className="rounded-xl bg-[#040711] border border-cyan-500/30 p-4 h-full min-h-[250px] flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <span className="text-cyan-400 font-bold flex items-center gap-1.5 text-xs">
                        <Code className="w-3.5 h-3.5" /> RAW STRIPE INTENT OBJECT
                      </span>
                      {selectedTx && <span className="text-slate-400 text-[10px]">{selectedTx.payment_intent_id}</span>}
                    </div>

                    <pre className="flex-1 overflow-x-auto text-[11px] font-mono text-cyan-300/90 leading-relaxed">
                      {selectedTx 
                        ? JSON.stringify(selectedTx.raw_payload || selectedTx, null, 2)
                        : '// Select a transaction from the left to inspect raw Stripe payload'}
                    </pre>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: ORDERS & RESTOCK PATH SIMULATOR */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="text-slate-400">
                Customer orders pipeline. Clicking "Refund & Restock" triggers the backend inventory restoration logic path!
              </div>

              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-500">
                    No orders registered yet. Run a checkout in sandbox to see live orders!
                  </div>
                ) : (
                  recentOrders.map((ord) => (
                    <div 
                      key={ord.id}
                      className="p-4 rounded-xl bg-[#090e1c] border border-slate-800 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">ORDER #{ord.order_number}</span>
                            <span className={`cyber-badge text-[9px] py-0.5 ${ord.payment_status === 'PAID' ? 'badge-emerald' : 'badge-magenta'}`}>
                              {ord.payment_status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {ord.customer_name} ({ord.customer_email}) • {new Date(ord.created_at).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-base font-black text-cyan-400">${ord.total?.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-500">{ord.payment_method}</div>
                          </div>

                          {ord.payment_status === 'PAID' && (
                            <button
                              onClick={() => handleRefundOrder(ord.id)}
                              className="btn-cyber-outline text-[11px] py-1.5 px-3 hover:border-rose-400 hover:text-rose-300"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                              <span>Refund & Restock</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
                        {ord.items?.map((item, idx) => (
                          <div key={idx} className="p-2 rounded bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
                            <span className="text-slate-300 truncate">{item.quantity}x {item.product_name}</span>
                            <span className="text-cyan-300 font-bold shrink-0">${item.subtotal?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SUPABASE POSTGRESQL INTEGRATION */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900/80 border border-emerald-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/40">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        SUPABASE CLOUD POSTGRESQL ENGINE
                        <span className="badge-pill badge-emerald text-[10px]">READY</span>
                      </h4>
                      <div className="text-[11px] text-slate-300">
                        Full PostgreSQL relational schema with row-level locks, audit trails, and atomic stored procedures.
                      </div>
                    </div>
                  </div>

                  <a 
                    href="https://supabase.com/dashboard" 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-cyan-outline text-xs py-1.5 px-3 self-start sm:self-auto"
                  >
                    Open Supabase Dashboard &rarr;
                  </a>
                </div>

                {/* Status Indicator */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">CONFIGURATION STATUS</div>
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      PostgreSQL DDL & Schema Active
                    </div>
                    <div className="text-[11px] text-slate-400">
                      File: <code className="text-cyan-300">supabase_schema.sql</code>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">ENVIRONMENT KEYS</div>
                    <div className="text-slate-300 font-semibold">SUPABASE_URL & SUPABASE_KEY</div>
                    <div className="text-[11px] text-slate-500">Configure in <code className="text-cyan-300">.env</code> to connect directly to cloud instance.</div>
                  </div>
                </div>
              </div>

              {/* 8 Relational Tables Overview */}
              <div className="space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>MANAGED POSTGRESQL TABLES (8 TABLES):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#0b1222] border border-slate-800">
                    <div className="text-cyan-400 font-bold">1. users</div>
                    <div className="text-[10px] text-slate-400">JWT Auth, bcrypt hashes, RBAC</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0b1222] border border-slate-800">
                    <div className="text-cyan-400 font-bold">2. products</div>
                    <div className="text-[10px] text-slate-400">SKU, stock, specs JSONB</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0b1222] border border-slate-800">
                    <div className="text-cyan-400 font-bold">3. cart_items</div>
                    <div className="text-[10px] text-slate-400">Persistent state & guest keys</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0b1222] border border-slate-800">
                    <div className="text-cyan-400 font-bold">4. orders</div>
                    <div className="text-[10px] text-slate-400">Order ledger & payment state</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0b1222] border border-slate-800">
                    <div className="text-purple-400 font-bold">5. order_items</div>
                    <div className="text-[10px] text-slate-400">Purchased snapshots & subtotal</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0b1222] border border-slate-800">
                    <div className="text-emerald-400 font-bold">6. inventory_logs</div>
                    <div className="text-[10px] text-slate-400">Immutable stock audit trail</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0b1222] border border-slate-800">
                    <div className="text-purple-400 font-bold">7. sandbox_tx</div>
                    <div className="text-[10px] text-slate-400">Stripe intents & 3DS logs</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0b1222] border border-slate-800">
                    <div className="text-cyan-400 font-bold">8. coupons</div>
                    <div className="text-[10px] text-slate-400">Promo codes & discounts</div>
                  </div>
                </div>
              </div>

              {/* Stored Procedure / Schema Info */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">PostgreSQL Transactional Stored Procedure:</span>
                  <span className="badge-pill badge-cyan text-[10px]">execute_atomic_checkout()</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The SQL function locks rows with <code className="text-cyan-300">FOR UPDATE</code>, verifies sufficient inventory, atomically decrements quantities, generates immutable audit log records, and commits the order in a single ACID transaction.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      fetch('/supabase_schema.sql')
                        .then(r => r.text())
                        .then(sql => {
                          navigator.clipboard.writeText(sql);
                          if (onShowToast) onShowToast('Full Supabase SQL schema copied to clipboard!', 'success');
                        });
                    }}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Copy Full SQL for Supabase SQL Editor
                  </button>
                  <span className="text-[11px] text-slate-500">Run in Supabase &rarr; SQL Editor &rarr; New Query</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 px-6 border-t border-cyan-500/20 bg-[#060912] flex items-center justify-between font-mono text-xs">
          <span className="text-slate-500">VORTEX ENGINE // OPERATOR LEVEL 5 CLEARANCE</span>
          <button
            onClick={() => setIsConsoleOpen(false)}
            className="btn-cyber-outline py-1.5 px-4 text-xs"
          >
            Close Matrix Console
          </button>
        </div>

      </div>
    </div>
  );
}
