import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  DollarSign,
  Ban,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  CheckCheck,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import InvoiceModal from '../../components/common/InvoiceModal';
import CourierBookingModal from '../../components/common/CourierBookingModal';
import CancelOrderModal from '../../components/common/CancelOrderModal';
import RefundModal from '../../components/common/RefundModal';
import { formatCurrency } from '../../utils/currency';

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');

  // Modals
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);
  const [courierOrder, setCourierOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [refundingOrder, setRefundingOrder] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);

  const orderStatuses = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const paymentStatuses = ['All', 'Paid', 'Unpaid', 'Refund Pending', 'Refund Processing', 'Refunded'];

  const fetchOrders = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (orderStatus !== 'All') query.append('order_status', orderStatus);
      if (paymentStatus !== 'All') query.append('payment_status', paymentStatus);

      const res = await authFetch(`/api/orders?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, orderStatus, paymentStatus]);

  // Check URL params
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId) {
      handleOpenDetails(viewId);
      if (searchParams.get('invoice') === 'true') {
        setInvoiceOrderId(viewId);
      }
    }
  }, [searchParams]);

  const handleOpenDetails = async (id) => {
    try {
      const res = await authFetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedOrderDetails(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark as Paid
  const handleMarkAsPaid = async (orderId) => {
    setMarkingPaidId(orderId);
    try {
      const res = await authFetch(`/api/orders/${orderId}/mark-paid`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        refreshNotifications();
        fetchOrders();
        if (selectedOrderDetails?.order?.id === orderId) {
          setSelectedOrderDetails({
            ...selectedOrderDetails,
            order: { ...selectedOrderDetails.order, payment_status: 'Paid' }
          });
        }
      }
    } catch (err) {
      showToast('Failed to update payment status', 'error');
    } finally {
      setMarkingPaidId(null);
    }
  };

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter(o => o.payment_status === 'Paid' && o.order_status !== 'Cancelled').length;
    const unpaid = orders.filter(o => o.payment_status === 'Unpaid' && o.order_status !== 'Cancelled').length;
    const cancelled = orders.filter(o => o.order_status === 'Cancelled').length;
    const refunds = orders.filter(o => o.payment_status === 'Refunded' || o.refund_status === 'Refunded' || o.refund_status === 'Refund Pending' || o.refund_status === 'Refund Processing').length;

    return { total, paid, unpaid, cancelled, refunds };
  }, [orders]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Orders</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Complete owner control: track shipments, mark collections as paid, manage cancellations & refund lifecycles.
            </p>
          </div>

          <Link
            to="/orders/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Place New Order</span>
          </Link>
        </div>

        {/* Quick Filter Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Card 1: Total Orders (Highlighted in Brand Color) */}
          <button
            onClick={() => { setOrderStatus('All'); setPaymentStatus('All'); }}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              orderStatus === 'All' && paymentStatus === 'All'
                ? 'bg-brand-700 text-white border-brand-700 shadow-md shadow-brand-700/25 ring-2 ring-brand-700/30'
                : 'bg-white text-slate-700 border-surface-border hover:border-brand-400 hover:bg-brand-50/30'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              orderStatus === 'All' && paymentStatus === 'All' ? 'text-brand-100' : 'text-slate-400'
            }`}>
              Total Orders
            </span>
            <span className={`text-lg font-black ${
              orderStatus === 'All' && paymentStatus === 'All' ? 'text-white' : 'text-brand-700'
            }`}>
              {metrics.total}
            </span>
          </button>

          {/* Card 2: Paid Orders */}
          <button
            onClick={() => { setOrderStatus('All'); setPaymentStatus('Paid'); }}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              paymentStatus === 'Paid' && orderStatus !== 'Cancelled'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                : 'bg-white text-slate-700 border-surface-border hover:border-emerald-300 hover:bg-emerald-50/30'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              paymentStatus === 'Paid' && orderStatus !== 'Cancelled' ? 'text-emerald-100' : 'text-slate-400'
            }`}>
              Paid Orders
            </span>
            <span className={`text-lg font-black ${
              paymentStatus === 'Paid' && orderStatus !== 'Cancelled' ? 'text-white' : 'text-emerald-600'
            }`}>
              {metrics.paid}
            </span>
          </button>

          {/* Card 3: Unpaid Orders */}
          <button
            onClick={() => { setOrderStatus('All'); setPaymentStatus('Unpaid'); }}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              paymentStatus === 'Unpaid' && orderStatus !== 'Cancelled'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25'
                : 'bg-white text-slate-700 border-surface-border hover:border-amber-300 hover:bg-amber-50/30'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              paymentStatus === 'Unpaid' && orderStatus !== 'Cancelled' ? 'text-amber-100' : 'text-slate-400'
            }`}>
              Unpaid Orders
            </span>
            <span className={`text-lg font-black ${
              paymentStatus === 'Unpaid' && orderStatus !== 'Cancelled' ? 'text-white' : 'text-amber-600'
            }`}>
              {metrics.unpaid}
            </span>
          </button>

          {/* Card 4: Cancelled */}
          <button
            onClick={() => { setOrderStatus('Cancelled'); setPaymentStatus('All'); }}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              orderStatus === 'Cancelled'
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25'
                : 'bg-white text-slate-700 border-surface-border hover:border-rose-300 hover:bg-rose-50/30'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              orderStatus === 'Cancelled' ? 'text-rose-100' : 'text-slate-400'
            }`}>
              Cancelled
            </span>
            <span className={`text-lg font-black ${
              orderStatus === 'Cancelled' ? 'text-white' : 'text-rose-600'
            }`}>
              {metrics.cancelled}
            </span>
          </button>

          {/* Card 5: Refunds */}
          <button
            onClick={() => { setOrderStatus('All'); setPaymentStatus('Refunded'); }}
            className={`p-3.5 rounded-2xl border text-left transition col-span-2 sm:col-span-1 cursor-pointer ${
              paymentStatus === 'Refunded' || paymentStatus === 'Refund Pending'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25'
                : 'bg-white text-slate-700 border-surface-border hover:border-purple-300 hover:bg-purple-50/30'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              paymentStatus === 'Refunded' || paymentStatus === 'Refund Pending' ? 'text-purple-100' : 'text-slate-400'
            }`}>
              Refunds
            </span>
            <span className={`text-lg font-black ${
              paymentStatus === 'Refunded' || paymentStatus === 'Refund Pending' ? 'text-white' : 'text-purple-600'
            }`}>
              {metrics.refunds}
            </span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-surface-border flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search order # or customer name/phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-canvas rounded-full border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
            {/* Order Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-[11px] text-slate-400">Order Status:</span>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="bg-surface-canvas border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
              >
                {orderStatuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-[11px] text-slate-400">Payment / Refund:</span>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="bg-surface-canvas border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
              >
                {paymentStatuses.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Order List Table */}
        <div className="bg-white rounded-3xl shadow-card border border-surface-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas text-slate-400 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4 text-right">Total</th>
                  <th className="px-4 py-4 text-center">Payment / Refund</th>
                  <th className="px-4 py-4 text-center">Order Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                      <span>Loading order registry...</span>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <h3 className="font-bold text-slate-800 text-sm">No Orders Found</h3>
                      <p className="text-xs text-slate-400 mt-1">No orders match the current filter criteria.</p>
                      <Link
                        to="/orders/new"
                        className="inline-block mt-4 px-5 py-2 rounded-full bg-brand-600 text-white font-bold text-xs shadow-sm"
                      >
                        Place New Order
                      </Link>
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const isCancelled = ord.order_status === 'Cancelled';
                    const isPaid = ord.payment_status === 'Paid';
                    const isRefundPending = ord.payment_status === 'Refund Pending' || ord.refund_status === 'Refund Pending';
                    const isRefundProcessing = ord.payment_status === 'Refund Processing' || ord.refund_status === 'Refund Processing';
                    const isRefunded = ord.payment_status === 'Refunded' || ord.refund_status === 'Refunded';

                    return (
                      <tr key={ord.id} className={`hover:bg-slate-50/70 transition ${isCancelled ? 'bg-rose-50/20' : ''}`}>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenDetails(ord.id)}
                            className="font-bold text-brand-700 hover:underline"
                          >
                            #{ord.order_number}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">{ord.customer_name}</p>
                          <p className="text-[10px] text-slate-400">{ord.customer_phone}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-500 font-mono text-[11px]">
                          {new Date(ord.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-4 text-right font-black text-slate-900">
                          {formatCurrency(ord.total)}
                        </td>

                        {/* Payment / Refund Status Badge */}
                        <td className="px-4 py-4 text-center">
                          {isRefunded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                              <CheckCheck className="w-3 h-3" />
                              <span>Refunded</span>
                            </span>
                          ) : isRefundProcessing ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Refund Processing</span>
                            </span>
                          ) : isRefundPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>Refund Pending</span>
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>Unpaid</span>
                            </span>
                          )}
                        </td>

                        {/* Order Status Badge */}
                        <td className="px-4 py-4 text-center">
                          {isCancelled ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                <XCircle className="w-3 h-3" />
                                <span>Cancelled</span>
                              </span>
                              {ord.cancellation_reason && (
                                <span className="text-[9px] text-rose-500 font-medium max-w-[120px] truncate block mt-0.5" title={ord.cancellation_reason}>
                                  {ord.cancellation_reason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {ord.order_status}
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Mark as Paid for active unpaid orders */}
                            {!isPaid && !isCancelled && (
                              <button
                                onClick={() => handleMarkAsPaid(ord.id)}
                                disabled={markingPaidId === ord.id}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold transition border border-emerald-200"
                                title="Mark as Paid"
                              >
                                {markingPaidId === ord.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <DollarSign className="w-3 h-3" />
                                )}
                                <span>Mark Paid</span>
                              </button>
                            )}

                            {/* Cancel Order trigger for active orders */}
                            {!isCancelled && (
                              <button
                                onClick={() => setCancellingOrder(ord)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Cancel Order"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}

                            {/* Refund Actions for Cancelled Paid Orders */}
                            {isCancelled && (isRefundPending || isRefundProcessing) && (
                              <button
                                onClick={() => setRefundingOrder(ord)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                                  isRefundProcessing
                                    ? 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                                }`}
                                title="Process Refund"
                              >
                                {isRefundProcessing ? (
                                  <RefreshCw className="w-3 h-3" />
                                ) : (
                                  <RotateCcw className="w-3 h-3" />
                                )}
                                <span>{isRefundProcessing ? 'Complete Refund' : 'Process Refund'}</span>
                              </button>
                            )}

                            {/* View Refund Receipt for settled refund */}
                            {isRefunded && (
                              <button
                                onClick={() => setRefundingOrder(ord)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold border border-purple-200 transition"
                                title="View Refund Receipt"
                              >
                                <CheckCheck className="w-3 h-3" />
                                <span>Refunded</span>
                              </button>
                            )}

                            {/* Invoice trigger */}
                            <button
                              onClick={() => setInvoiceOrderId(ord.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                              title="Generate invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Courier booking trigger */}
                            {!isCancelled && (
                              <button
                                onClick={() => setCourierOrder(ord)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                                title="Book courier"
                              >
                                <Truck className="w-4 h-4" />
                              </button>
                            )}

                            {/* View details */}
                            <button
                              onClick={() => handleOpenDetails(ord.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                              title="Order details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Order Overview</span>
                <h3 className="font-black text-xl text-slate-900 mt-0.5">
                  Order #{selectedOrderDetails.order.order_number}
                </h3>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cancellation Banner if cancelled */}
            {selectedOrderDetails.order.order_status === 'Cancelled' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Order Cancelled</span>
                  </span>
                  {selectedOrderDetails.order.cancelled_at && (
                    <span className="text-[10px] text-rose-600 font-mono">
                      {new Date(selectedOrderDetails.order.cancelled_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-rose-800 pt-1">
                  <strong>Reason:</strong> {selectedOrderDetails.order.cancellation_reason || 'Merchant Cancelled'}
                </p>
                {selectedOrderDetails.order.refund_notes && (
                  <p className="text-rose-700 text-[11px]">
                    <strong>Note:</strong> {selectedOrderDetails.order.refund_notes}
                  </p>
                )}
              </div>
            )}

            {/* Refund Lifecycle Card if in refund workflow */}
            {(selectedOrderDetails.order.refund_status === 'Refund Pending' ||
              selectedOrderDetails.order.refund_status === 'Refund Processing' ||
              selectedOrderDetails.order.refund_status === 'Refunded' ||
              selectedOrderDetails.order.payment_status === 'Refunded') && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                    <span>Refund Status: {selectedOrderDetails.order.refund_status || selectedOrderDetails.order.payment_status}</span>
                  </span>
                  <button
                    onClick={() => setRefundingOrder(selectedOrderDetails.order)}
                    className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-sm transition"
                  >
                    {selectedOrderDetails.order.refund_status === 'Refunded' ? 'View Details' : 'Manage Refund →'}
                  </button>
                </div>
                <div className="text-[11px] text-purple-800 grid grid-cols-2 gap-2 pt-1 border-t border-purple-200/60">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Refund Amount</span>
                    <strong className="text-slate-900 text-sm">
                      {formatCurrency(selectedOrderDetails.order.refund_amount || selectedOrderDetails.order.total)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Method</span>
                    <strong className="text-slate-900">
                      {selectedOrderDetails.order.refund_method || 'Pending'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Information Block */}
            <div className="p-4 bg-surface-canvas rounded-2xl border border-slate-100 space-y-1.5 text-xs">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Customer Details</p>
              <p className="text-sm font-bold text-slate-900">{selectedOrderDetails.order.customer_name}</p>
              <p className="text-slate-600">Phone: <strong>{selectedOrderDetails.order.customer_phone}</strong></p>
              {selectedOrderDetails.order.customer_email && (
                <p className="text-slate-600">Email: {selectedOrderDetails.order.customer_email}</p>
              )}
              <p className="text-slate-600">Address: {selectedOrderDetails.order.customer_address}</p>
              {selectedOrderDetails.order.notes && (
                <p className="text-slate-500 italic pt-1">Notes: "{selectedOrderDetails.order.notes}"</p>
              )}
            </div>

            {/* Items Table */}
            <div>
              <p className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Order Line Items</p>
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-canvas text-slate-400 font-bold border-b border-slate-200/80 text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-3 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Price</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedOrderDetails.order.items || []).map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{item.product_name}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-900">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-brand-50/70 border border-brand-100 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <p className="text-brand-800 font-bold">Total Grand Balance</p>
                <p className="text-2xl font-black text-brand-700 mt-0.5">
                  {formatCurrency(selectedOrderDetails.order.total)}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  selectedOrderDetails.order.payment_status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedOrderDetails.order.payment_status === 'Refunded'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedOrderDetails.order.payment_status}
                </span>
                {selectedOrderDetails.order.payment_status === 'Unpaid' && selectedOrderDetails.order.order_status !== 'Cancelled' && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedOrderDetails.order.id)}
                    className="block mt-2 text-xs font-bold text-brand-700 hover:underline"
                  >
                    Mark as Paid Now →
                  </button>
                )}
              </div>
            </div>

            {/* Courier Status if booked */}
            {selectedOrderDetails.courierBooking && (
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-sky-900">Courier Consignment: {selectedOrderDetails.courierBooking.provider}</p>
                  <p className="text-sky-700 mt-0.5">Tracking ID: <strong>{selectedOrderDetails.courierBooking.tracking_id}</strong></p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-sky-800 font-bold shadow-sm">
                  {selectedOrderDetails.courierBooking.status}
                </span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvoiceOrderId(selectedOrderDetails.order.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-canvas border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100"
                >
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>Open Invoice</span>
                </button>

                {/* Cancel order button in details if active */}
                {selectedOrderDetails.order.order_status !== 'Cancelled' && (
                  <button
                    onClick={() => setCancellingOrder(selectedOrderDetails.order)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceOrderId && (
        <InvoiceModal orderId={invoiceOrderId} onClose={() => setInvoiceOrderId(null)} />
      )}

      {/* Courier Booking Modal */}
      {courierOrder && (
        <CourierBookingModal
          order={courierOrder}
          onClose={() => setCourierOrder(null)}
          onSuccess={() => fetchOrders()}
        />
      )}

      {/* Cancel Order Modal */}
      {cancellingOrder && (
        <CancelOrderModal
          order={cancellingOrder}
          isOpen={Boolean(cancellingOrder)}
          onClose={() => setCancellingOrder(null)}
          onSuccess={() => {
            fetchOrders();
            if (selectedOrderDetails?.order?.id === cancellingOrder.id) {
              handleOpenDetails(cancellingOrder.id);
            }
          }}
        />
      )}

      {/* Refund Lifecycle Modal */}
      {refundingOrder && (
        <RefundModal
          order={refundingOrder}
          isOpen={Boolean(refundingOrder)}
          onClose={() => setRefundingOrder(null)}
          onSuccess={() => {
            fetchOrders();
            if (selectedOrderDetails?.order?.id === refundingOrder.id) {
              handleOpenDetails(refundingOrder.id);
            }
          }}
        />
      )}
    </>
  );
}
