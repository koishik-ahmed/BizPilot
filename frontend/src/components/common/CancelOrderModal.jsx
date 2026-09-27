import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Loader2,
  Mail,
  RotateCcw,
  PackageCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/currency';

export default function CancelOrderModal({ order, isOpen, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  const [reasonSelect, setReasonSelect] = useState('Customer Request / Changed Mind');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(Boolean(order?.customer_email));
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const isPaid = order.payment_status === 'Paid';
  const customerEmail = order.customer_email || order.customer?.email;

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const finalReason = reasonSelect === 'Other'
      ? (customReason.trim() || 'Merchant Cancelled')
      : reasonSelect;

    try {
      const res = await authFetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: finalReason,
          notes: notes.trim(),
          send_email: sendEmail && Boolean(customerEmail)
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        refreshNotifications();
        if (onSuccess) onSuccess(data.order);
        onClose();
      } else {
        showToast(data.message || 'Failed to cancel order', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while cancelling order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-lg w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto custom-scroll">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isPaid ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Action</span>
              <h3 className="font-black text-lg text-slate-900">
                Cancel Order #{order.order_number}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary Strip */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <p className="font-bold text-slate-800">{order.customer_name}</p>
            <p className="text-[11px] text-slate-500">{order.customer_phone}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-slate-900 text-sm">{formatCurrency(order.total)}</p>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Contextual Flow Banner */}
        {isPaid ? (
          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Paid Order Cancellation & Refund Flow</span>
            </div>
            <p className="text-amber-700 leading-relaxed text-[11px]">
              This order has been marked as <strong>PAID</strong> ({formatCurrency(order.total)}).
              Upon confirming cancellation:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800 font-medium">
              <li>Ordered items will be <strong>restored to inventory immediately</strong>.</li>
              <li>Order status will become <strong className="text-rose-700">Cancelled</strong>.</li>
              <li>Order will move to <strong className="text-amber-700">Refund Pending</strong> so you can process payout and record the transaction reference.</li>
            </ul>
          </div>
        ) : (
          <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <PackageCheck className="w-4 h-4 text-rose-600" />
              <span>Unpaid Order Cancellation Flow</span>
            </div>
            <p className="text-rose-700 leading-relaxed text-[11px]">
              This order is <strong>UNPAID</strong>. Upon confirming cancellation:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-800 font-medium">
              <li>Stock will be <strong>replenished back into your inventory</strong>.</li>
              <li>Order and customer statistics will be updated.</li>
              <li>A formal <strong>Cancellation Notice</strong> will be emailed to the customer.</li>
            </ul>
          </div>
        )}

        {/* Cancellation Form */}
        <form onSubmit={handleCancelOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Cancellation Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reasonSelect}
              onChange={(e) => setReasonSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-canvas border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="Customer Request / Changed Mind">Customer Request / Changed Mind</option>
              <option value="Duplicate Order">Duplicate Order Placed</option>
              <option value="Item Out of Stock / Unfulfillable">Item Out of Stock / Damaged Goods</option>
              <option value="Incorrect Customer Address / Contact">Incorrect Customer Address / Unreachable</option>
              <option value="Fraudulent / Suspicious Order">Fraudulent / Suspicious Order</option>
              <option value="Other">Other Reason (Specify below)</option>
            </select>
          </div>

          {reasonSelect === 'Other' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Specify Reason <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Type reason for order cancellation..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-surface-canvas border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-brand-500"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Internal Merchant Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes for order audit trail..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface-canvas border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Email Notification Option */}
          {customerEmail ? (
            <label className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <div className="flex items-center gap-1.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">
                  Send cancellation notification to <strong className="text-slate-900">{customerEmail}</strong>
                </span>
              </div>
            </label>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
              ℹ️ No customer email on file — no email will be dispatched.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Cancellation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

