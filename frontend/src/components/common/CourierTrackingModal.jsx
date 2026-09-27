import React, { useState, useEffect } from 'react';
import { X, Truck, CheckCircle2, Clock, MapPin, Package, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function CourierTrackingModal({ trackingId, onClose, onStatusUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { authFetch } = useAuth();
  const { showToast } = useNotifications();

  const fetchTracking = async () => {
    try {
      const res = await authFetch(`/api/courier/track/${trackingId}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackingId) fetchTracking();
  }, [trackingId]);

  const advanceStatus = async (nextStatus) => {
    if (!data?.booking) return;
    setUpdating(true);
    try {
      const res = await authFetch(`/api/courier/status/${data.booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message);
        await fetchTracking();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      showToast('Status update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Querying Courier Tracking Gateway...</p>
        </div>
      </div>
    );
  }

  if (!data?.booking) return null;

  const { booking, timeline } = data;

  const nextStatusMap = {
    Booked: 'Picked Up',
    'Picked Up': 'In Transit',
    'In Transit': 'Delivered'
  };
  const nextStatus = nextStatusMap[booking.status];

  return (
    <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-lg w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">{booking.provider} Tracking</span>
            <h3 className="font-extrabold text-xl text-slate-900 mt-0.5">{booking.tracking_id}</h3>
            <p className="text-xs text-slate-500 mt-1">Recipient: {booking.recipient_name} ({booking.recipient_phone})</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="flex items-center justify-between p-3.5 bg-surface-canvas rounded-2xl border border-slate-200/80">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Consignment Status</p>
            <p className="text-sm font-black text-brand-700 mt-0.5">{booking.status}</p>
          </div>
          {nextStatus && (
            <button
              onClick={() => advanceStatus(nextStatus)}
              disabled={updating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
            >
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              <span>Simulate Next: {nextStatus}</span>
            </button>
          )}
        </div>

        {/* Timeline Stepper */}
        <div className="space-y-4 pl-2">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Shipment Milestones</p>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((step, idx) => (
              <div key={idx} className="relative group">
                <span
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                    step.completed
                      ? 'border-brand-600 text-brand-600 bg-brand-50'
                      : 'border-slate-300 text-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${step.completed ? 'bg-brand-600' : 'bg-transparent'}`}></span>
                </span>
                <div>
                  <p className={`text-xs font-bold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
                  <span className="text-[10px] text-slate-400">
                    {step.timestamp ? new Date(step.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Footer */}
        <div className="p-3 bg-slate-50 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
          <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Delivery Destination: </span>
            <span>{booking.recipient_address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

