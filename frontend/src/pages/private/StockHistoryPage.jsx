import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { History, Search, Filter, ArrowDownRight, ArrowUpRight, RotateCcw, Package, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StockHistoryPage() {
  const [searchParams] = useSearchParams();
  const { authFetch } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movementType, setMovementType] = useState('All');
  const [productId, setProductId] = useState(searchParams.get('product_id') || 'All');
  const [search, setSearch] = useState('');

  const movementTypes = [
    'All',
    'Initial Stock',
    'Restock',
    'Order/Sale Deduction',
    'Manual Adjustment',
    'Return/Correction'
  ];

  const fetchHistory = async () => {
    try {
      const query = new URLSearchParams();
      if (movementType !== 'All') query.append('movement_type', movementType);
      if (productId !== 'All') query.append('product_id', productId);
      if (search) query.append('search', search);

      const res = await authFetch(`/api/stock-history?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setHistory(json.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [movementType, productId, search]);

  return (
    <div className="space-y-6">
      {/* 16 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Stock Audit Trail</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete verifiable history of every stock addition, order sale deduction, and adjustment.
          </p>
        </div>

        <Link
          to="/inventory"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-canvas border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          <span>Back to Live Inventory</span>
        </Link>
      </div>

      {/* 16.1 Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-surface-border flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search product name or reference reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-canvas rounded-full border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-[11px] text-slate-400">Movement Type:</span>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="bg-surface-canvas border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
            >
              {movementTypes.map((mt) => (
                <option key={mt} value={mt}>{mt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 16.3 History Table */}
      <div className="bg-white rounded-3xl shadow-card border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-canvas text-slate-400 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Date / Time</th>
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">Movement Type</th>
                <th className="px-4 py-4 text-center">Change</th>
                <th className="px-4 py-4 text-center">Previous</th>
                <th className="px-4 py-4 text-center">New Stock</th>
                <th className="px-6 py-4">Reason / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-800 text-sm">No Stock Logs Found</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      No stock history records match your selected movement filters.
                    </p>
                  </td>
                </tr>
              ) : (
                history.map((log) => {
                  const isPositive = log.quantity_change > 0;
                  const isNegative = log.quantity_change < 0;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900">{log.product_name}</span>
                        {log.sku && <span className="block text-[10px] text-slate-400">SKU: {log.sku}</span>}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            log.movement_type === 'Restock' || log.movement_type === 'Initial Stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.movement_type === 'Order/Sale Deduction'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.movement_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-black text-xs ${
                            isPositive
                              ? 'text-emerald-600'
                              : isNegative
                              ? 'text-rose-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isNegative && <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{isPositive ? `+${log.quantity_change}` : log.quantity_change}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-slate-500">{log.previous_stock}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-900">{log.new_stock}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {log.reason || 'Standard system adjustment'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

