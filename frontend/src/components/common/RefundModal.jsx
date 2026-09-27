import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Mail,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/currency';

export default function RefundModal({ order, isOpen, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  const isAlreadyRefunded = order?.refund_status === 'Refunded' || order?.payment_status === 'Refunded';
  const isProcessing = order?.refund_status === 'Refund Processing' || order?.payment_status === 'Refund Processing';
  const customerEmail = order?.customer_email || order?.customer?.email;

  const [refundAmount, setRefundAmount] = useState(
    order?.refund_amount ? String(order.refund_amount) : (order?.total ? String(order.total) : '0')
  );
  const [refundMethod, setRefundMethod] = useState(order?.refund_method || 'Original Payment Method');
  const [transactionId, setTransactionId] = useState(order?.refund_transaction_id || '');
  const [notes, setNotes] = useState(order?.refund_notes || '');
  const [sendEmail, setSendEmail] = useState(Boolean(customerEmail));
  const [submittingAction, setSubmittingAction] = useState(null); // 'processing' or 'complete'

  if (!isOpen || !order) return null;

  // Handle move to Processing
  const handleMarkProcessing = async () => {
    setSubmittingAction('processing');
    try {
      const res = await authFetch(`/api/orders/${order.id}/refund/processing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        refreshNotifications();
        if (onSuccess) onSuccess(data.order);
        onClose();
      } else {
        showToast(data.message || 'Failed to update refund status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating status', 'error');
    } finally {
      setSubmittingAction(null);
    }
  };

  // Handle complete refund
  const handleCompleteRefund = async (e) => {
    if (e) e.preventDefault();
    setSubmittingAction('complete');
    try {
      const res = await authFetch(`/api/orders/${order.id}/refund/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refund_amount: parseFloat(refundAmount) || order.total,
          refund_method: refundMethod,
          transaction_id: transactionId.trim(),
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
        showToast(data.message || 'Failed to complete refund', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error completing refund', 'error');
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-lg w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto custom-scroll">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Refund Lifecycle</span>
              <h3 className="font-black text-lg text-slate-900">
                Refund Management: Order #{order.order_number}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={Boolean(submittingAction)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Lifecycle Stepper */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold">
            {/* Step 1: Pending */}
            <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  isAlreadyRefunded || isProcessing
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}
              >
                {isAlreadyRefunded || isProcessing ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
              </div>
              <span className={isAlreadyRefunded || isProcessing ? 'text-emerald-700' : 'text-amber-700'}>
                1. Pending
              </span>
            </div>

            <div className={`h-0.5 flex-1 mx-1 ${isAlreadyRefunded || isProcessing ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 2: Processing */}
            <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  isAlreadyRefunded
                    ? 'bg-emerald-500 text-white'
                    : isProcessing
                    ? 'bg-sky-600 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isAlreadyRefunded ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />}
              </div>
              <span className={isAlreadyRefunded ? 'text-emerald-700' : isProcessing ? 'text-sky-700' : 'text-slate-400'}>
                2. Processing
              </span>
            </div>

            <div className={`h-0.5 flex-1 mx-1 ${isAlreadyRefunded ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 3: Refunded */}
            <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  isAlreadyRefunded
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className={isAlreadyRefunded ? 'text-purple-700' : 'text-slate-400'}>
                3. Refunded
              </span>
            </div>
          </div>
        </div>

        {/* View-Only Mode if already refunded */}
        {isAlreadyRefunded ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 text-sm">Refund Completed</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-800 font-bold text-[10px]">
                  Settled
                </span>
              </div>
              <div className="text-2xl font-black text-purple-700">
                {formatCurrency(order.refund_amount || order.total)}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200/60 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Payout Method</span>
                  <span className="font-bold text-slate-800">{order.refund_method || 'Original Payment Method'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Transaction Ref / TrxID</span>
                  <span className="font-mono font-bold text-slate-800">{order.refund_transaction_id || 'N/A'}</span>
                </div>
              </div>
              {order.refund_notes && (
                <div className="pt-2 text-[11px] text-purple-900">
                  <strong>Notes:</strong> {order.refund_notes}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Payout Processing / Complete Form */
          <form onSubmit={handleCompleteRefund} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Refund Amount <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={order.total}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-surface-canvas border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Original order total: {formatCurrency(order.total)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Refund Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-canvas border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-brand-500"
                >
                  <option value="Original Payment Method">Original Payment Method</option>
                  <option value="Bank Transfer / Wire">Bank Transfer / Wire</option>
                  <option value="bKash (Mobile Banking)">bKash (Mobile Banking)</option>
                  <option value="Nagad (Mobile Banking)">Nagad (Mobile Banking)</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Cash / Store Credit">Cash / Store Credit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Transaction Reference / TrxID
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. TRX-9988224 or Bank Slip #..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface-canvas border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Refund Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Audit notes or instructions for the customer..."
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
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold">
                    Send official refund receipt to <strong className="text-slate-900">{customerEmail}</strong>
                  </span>
                </div>
              </label>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                ℹ️ No customer email on file — no email will be dispatched.
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={Boolean(submittingAction)}
                className="px-3.5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={handleMarkProcessing}
                    disabled={Boolean(submittingAction)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold transition disabled:opacity-50"
                  >
                    {submittingAction === 'processing' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Mark as Processing</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={Boolean(submittingAction)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 transition disabled:opacity-50"
                >
                  {submittingAction === 'complete' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete & Mark Refunded</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

