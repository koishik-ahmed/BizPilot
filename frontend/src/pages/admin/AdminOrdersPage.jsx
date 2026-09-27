import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, RefreshCw, Eye, X, Store, CheckCircle, Clock } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminOrdersPage() {
  const { adminFetch } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [orderStatus, setOrderStatus] = useState('all');
  const [currency, setCurrency] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        payment_status: paymentStatus,
        order_status: orderStatus,
        currency
      });
      const res = await adminFetch(`/api/admin/orders?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, paymentStatus, orderStatus, currency]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform-Wide Orders</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global read-only browser across all tenant merchants, payment statuses, and consignments
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-surface-border shadow-card transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-surface-border rounded-2xl p-4 sm:p-5 shadow-card flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order # (e.g. BP-1024), merchant name, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-canvas border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Status */}
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="bg-surface-canvas border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid / COD Pending</option>
          </select>

          {/* Order Status */}
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            className="bg-surface-canvas border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Fulfillment Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Currency */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-surface-canvas border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="BDT">BDT (৳)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-surface-border rounded-3xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Store / Merchant</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Placed Date</th>
                <th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Fulfillment</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading platform orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No orders matched the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">
                      #{o.order_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{o.merchant_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Merchant #{o.user_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{o.customer_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{o.customer_phone}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {o.currency === 'BDT' ? '৳' : '$'}{parseFloat(o.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          o.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
                        title="View Full Order Breakdown"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-surface-border rounded-3xl w-full max-w-xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Order #{selectedOrder.order_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Store: <strong className="text-brand-600">{selectedOrder.merchant_name}</strong> • Placed {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4">
              {/* Customer Info Box */}
              <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Shipping & Customer</span>
                <p className="font-bold text-slate-900">{selectedOrder.customer_name}</p>
                <p className="text-slate-600 font-mono">{selectedOrder.customer_phone}</p>
                {selectedOrder.customer_email && <p className="text-slate-500">{selectedOrder.customer_email}</p>}
                {selectedOrder.customer_address && (
                  <p className="text-slate-700 mt-1 pt-1 border-t border-slate-200">{selectedOrder.customer_address}</p>
                )}
                {selectedOrder.notes && (
                  <p className="text-amber-800 font-medium italic mt-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Note: {selectedOrder.notes}
                  </p>
                )}
              </div>

              {/* Items Table */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 px-1">Order Items</span>
                <div className="mt-2 bg-white rounded-2xl border border-surface-border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] border-b border-surface-border">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {(selectedOrder.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{item.product_name}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                            {selectedOrder.currency === 'BDT' ? '৳' : '$'}{parseFloat(item.unit_price || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700 font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {selectedOrder.currency === 'BDT' ? '৳' : '$'}{parseFloat(item.line_total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {selectedOrder.currency === 'BDT' ? '৳' : '$'}{parseFloat(selectedOrder.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping Fee</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {selectedOrder.currency === 'BDT' ? '৳' : '$'}{parseFloat(selectedOrder.shipping || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {selectedOrder.currency === 'BDT' ? '৳' : '$'}{parseFloat(selectedOrder.tax || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="font-mono text-brand-600 font-black">
                    {selectedOrder.currency === 'BDT' ? '৳' : '$'}{parseFloat(selectedOrder.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
