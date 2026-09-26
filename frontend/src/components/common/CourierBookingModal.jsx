import React, { useState, useEffect } from 'react';
import { X, Truck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function CourierBookingModal({ order, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    order_id: '',
    provider: 'Steadfast',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    weight: '1.0',
    collection_amount: '0.00'
  });

  useEffect(() => {
    if (order) {
      setFormData({
        order_id: order.id,
        provider: 'Steadfast',
        recipient_name: order.customer_name || '',
        recipient_phone: order.customer_phone || '',
        recipient_address: order.customer_address || '',
        weight: '1.0',
        collection_amount: order.payment_status === 'Unpaid' ? parseFloat(order.total).toFixed(2) : '0.00'
      });
    }
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authFetch('/api/courier/book', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to book courier.');
      }
      showToast(data.message || 'Courier booked successfully!');
      refreshNotifications();
      if (onSuccess) onSuccess(data.booking);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Book Courier Delivery</h3>
              <p className="text-xs text-slate-400">Order #{order.order_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Courier Provider Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Courier Partner</label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
            >
              <option value="Steadfast">Steadfast Courier (Fastest Domestic)</option>
              <option value="Pathao">Pathao Courier (Next-Day Delivery)</option>
              <option value="RedX">RedX Delivery (Nationwide Reach)</option>
              <option value="DHL Express">DHL Express Worldwide</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Recipient Name</label>
              <input
                type="text"
                required
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Recipient Phone</label>
              <input
                type="text"
                required
                value={formData.recipient_phone}
                onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Delivery Address</label>
            <textarea
              rows={2}
              required
              value={formData.recipient_address}
              onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
              className="w-full px-3.5 py-2 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Parcel Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">COD Collection Amount (৳)</label>
              <input
                type="number"
                step="0.01"
                value={formData.collection_amount}
                onChange={(e) => setFormData({ ...formData, collection_amount: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
              />
            </div>
          </div>

          <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 flex items-center justify-between text-brand-800">
            <span>Payment Status of Order:</span>
            <span className="font-bold">{order.payment_status}</span>
          </div>

          <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-600/20 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm Booking</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

