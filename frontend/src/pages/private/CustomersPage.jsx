import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  X,
  Loader2,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';

export default function CustomersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 18.3 Customer Profile Drawer
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);

      const res = await authFetch(`/api/customers?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  // Check URL params
  useEffect(() => {
    const profileId = searchParams.get('profile');
    if (profileId) {
      handleOpenProfile(profileId);
    }
  }, [searchParams]);

  const handleOpenProfile = async (id) => {
    setProfileLoading(true);
    try {
      const res = await authFetch(`/api/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
      {/* 18 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Customers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Auto-populated buyer directory with lifetime value analytics and repeat order links.
          </p>
        </div>

        {/* Section 18 Note banner */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-50 border border-brand-100 text-xs font-semibold text-brand-800">
          <Info className="w-4 h-4 text-brand-600 shrink-0" />
          <span>Customers are automatically recorded when placing orders.</span>
        </div>
      </div>

      {/* 18.2 Customer Search */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-surface-border flex items-center justify-between">
        <div className="w-full max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-canvas rounded-full border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
          />
        </div>

        <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
          {customers.length} total buyers
        </span>
      </div>

      {/* 18.1 Customer List Table */}
      <div className="bg-white rounded-3xl shadow-card border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-canvas text-slate-400 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4 text-center">Total Orders</th>
                <th className="px-4 py-4 text-right">Total Spent</th>
                <th className="px-4 py-4">Last Order</th>
                <th className="px-6 py-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                    <span>Loading customers...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-800 text-sm">No Customers Yet</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Customers will automatically be listed here as soon as you place your first order.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleOpenProfile(c.id)}
                    className="hover:bg-slate-50/70 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                          {c.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{c.phone}</td>
                    <td className="px-4 py-4 text-slate-500">{c.email || '—'}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-900">{c.total_orders}</td>
                    <td className="px-4 py-4 text-right font-black text-brand-700">
                      {formatCurrency(c.total_spent || 0)}
                    </td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-[11px]">
                      {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProfile(c.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* 18.3 Customer Profile Drawer */}
      {selectedProfile && (
        <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="bg-white w-full max-w-lg h-full p-6 sm:p-8 space-y-6 overflow-y-auto custom-scroll shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-brand-700">
                  <Users className="w-5 h-5" />
                  <h3 className="font-bold text-base">Customer Intelligence</h3>
                </div>
                <button onClick={() => setSelectedProfile(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="p-5 rounded-3xl bg-surface-canvas border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {selectedProfile.customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{selectedProfile.customer.name}</h3>
                    <p className="text-xs text-brand-700 font-semibold">Active Customer</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedProfile.customer.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedProfile.customer.email || 'No email registered'}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedProfile.customer.address}</span>
                  </p>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-brand-50/70 border border-brand-100 rounded-2xl">
                  <p className="text-brand-800 font-bold uppercase text-[10px]">Total Lifetime Orders</p>
                  <p className="text-2xl font-black text-brand-700 mt-1">{selectedProfile.customer.total_orders}</p>
                </div>
                <div className="p-4 bg-brand-50/70 border border-brand-100 rounded-2xl">
                  <p className="text-brand-800 font-bold uppercase text-[10px]">Total Lifetime Spent</p>
                  <p className="text-2xl font-black text-brand-700 mt-1">
                    {formatCurrency(selectedProfile.customer.total_spent || 0)}
                  </p>
                </div>
              </div>

              {/* 18.4 Repeat Customer Workflow Action */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-emerald-900">Repeat Customer Flow</p>
                  <p className="text-[11px] text-emerald-700">Place an order with customer info auto-filled</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProfile(null);
                    navigate('/orders/new');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm"
                >
                  New Order →
                </button>
              </div>

              {/* Order History */}
              <div className="space-y-2.5">
                <p className="font-bold text-xs text-slate-800 uppercase tracking-wider">Purchase History</p>
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scroll pr-1">
                  {(selectedProfile.orders || []).map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setSelectedProfile(null);
                        navigate(`/orders?view=${o.id}`);
                      }}
                      className="p-3 rounded-2xl bg-surface-canvas border border-slate-200/80 hover:bg-slate-100/80 cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">#{o.order_number}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(o.created_at).toLocaleDateString()} • {o.order_status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatCurrency(o.total)}</p>
                        <span className={`text-[10px] font-bold ${o.payment_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {o.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedProfile(null)}
              className="w-full py-3 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
    </>
  );
}

