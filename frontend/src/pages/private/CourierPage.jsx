import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Truck,
  Search,
  Filter,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import CourierBookingModal from '../../components/common/CourierBookingModal';
import CourierTrackingModal from '../../components/common/CourierTrackingModal';
import { formatCurrency } from '../../utils/currency';

export default function CourierPage() {
  const [searchParams] = useSearchParams();
  const { authFetch } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'eligible'
  const [bookings, setBookings] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [bookingModalOrder, setBookingModalOrder] = useState(null);
  const [trackingModalId, setTrackingModalId] = useState(null);

  const providers = ['All', 'Steadfast', 'Pathao', 'RedX', 'DHL Express'];
  const statuses = ['All', 'Booked', 'Picked Up', 'In Transit', 'Delivered', 'Failed', 'Cancelled'];

  const fetchData = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (providerFilter !== 'All') query.append('provider', providerFilter);
      if (statusFilter !== 'All') query.append('status', statusFilter);

      const [bRes, eRes] = await Promise.all([
        authFetch(`/api/courier/bookings?${query.toString()}`),
        authFetch('/api/courier/eligible')
      ]);

      const bData = await bRes.json();
      const eData = await eRes.json();

      if (bData.success) setBookings(bData.bookings || []);
      if (eData.success) {
        setEligibleOrders(eData.eligibleOrders || []);

        // Check if query param asked to open booking for specific order
        const targetOrderId = searchParams.get('order_id');
        if (targetOrderId) {
          const match = (eData.eligibleOrders || []).find(o => o.id === parseInt(targetOrderId));
          if (match) {
            setBookingModalOrder(match);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, providerFilter, statusFilter]);

  return (
    <>
      <div className="space-y-6">
      {/* 20.1 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Courier Logistics Gateway</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch parcels directly to Steadfast, Pathao, RedX, and DHL with live tracking and COD reconciliation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface-canvas p-1 rounded-full border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-full transition ${
              activeTab === 'bookings' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Consignments ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('eligible')}
            className={`px-4 py-2 rounded-full transition ${
              activeTab === 'eligible' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ready to Dispatch ({eligibleOrders.length})
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-surface-border flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tracking ID or recipient phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-canvas rounded-full border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          {/* Provider Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-[11px] text-slate-400">Courier:</span>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="bg-surface-canvas border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
            >
              {providers.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-[11px] text-slate-400">Delivery Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-canvas border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab 1: Active Consignments */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl shadow-card border border-surface-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas text-slate-400 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Tracking ID</th>
                  <th className="px-4 py-4">Provider</th>
                  <th className="px-4 py-4">Recipient</th>
                  <th className="px-4 py-4">Weight</th>
                  <th className="px-4 py-4 text-right">COD Amount</th>
                  <th className="px-4 py-4 text-center">Courier Status</th>
                  <th className="px-6 py-4 text-right">Live Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                      <span>Checking courier gateway...</span>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <h3 className="font-bold text-slate-800 text-sm">No Active Shipments</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Switch to the "Ready to Dispatch" tab to book courier delivery for confirmed orders.
                      </p>
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setTrackingModalId(b.tracking_id)}
                          className="font-bold text-brand-700 hover:underline flex items-center gap-1.5"
                        >
                          <span>{b.tracking_id}</span>
                          <ExternalLink className="w-3 h-3 text-brand-500" />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-800">{b.provider}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{b.recipient_name}</p>
                        <p className="text-[10px] text-slate-400">{b.recipient_phone}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{b.weight} kg</td>
                      <td className="px-4 py-4 text-right font-black text-slate-900">
                        {formatCurrency(b.collection_amount || 0)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          b.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'In Transit'
                            ? 'bg-sky-100 text-sky-800'
                            : b.status === 'Picked Up'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setTrackingModalId(b.tracking_id)}
                          className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition shadow-sm"
                        >
                          View Tracker
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: 20.2 Eligible Orders for Courier Booking */}
      {activeTab === 'eligible' && (
        <div className="bg-white rounded-3xl shadow-card border border-surface-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas text-slate-400 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Delivery Address</th>
                  <th className="px-4 py-4 text-right">Amount</th>
                  <th className="px-4 py-4 text-center">Payment</th>
                  <th className="px-6 py-4 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {eligibleOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center text-slate-400">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <h4 className="font-bold text-slate-800 text-sm">All Orders Booked!</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        There are currently no unassigned confirmed orders waiting for courier pickup.
                      </p>
                    </td>
                  </tr>
                ) : (
                  eligibleOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-bold text-brand-700">#{ord.order_number}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{ord.customer_name}</td>
                      <td className="px-4 py-4 text-slate-600">{ord.customer_phone}</td>
                      <td className="px-4 py-4 text-slate-500 max-w-xs truncate">{ord.customer_address}</td>
                      <td className="px-4 py-4 text-right font-black text-slate-900">{formatCurrency(ord.total)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setBookingModalOrder(ord)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition shadow-sm ml-auto"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Book Courier</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

      {/* Courier Booking Modal */}
      {bookingModalOrder && (
        <CourierBookingModal
          order={bookingModalOrder}
          onClose={() => setBookingModalOrder(null)}
          onSuccess={() => {
            fetchData();
            setActiveTab('bookings');
          }}
        />
      )}

      {/* Courier Tracking Modal */}
      {trackingModalId && (
        <CourierTrackingModal
          trackingId={trackingModalId}
          onClose={() => setTrackingModalId(null)}
          onStatusUpdated={() => fetchData()}
        />
      )}
    </>
  );
}

