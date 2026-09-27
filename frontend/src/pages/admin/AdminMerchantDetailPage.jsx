import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Store,
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  ShieldBan,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Trash2,
  Clock,
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Layers,
  X
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminMerchantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminFetch, admin } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals
  const [suspendModal, setSuspendModal] = useState({ open: false, reason: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, confirmInput: '' });

  const fetchMerchantDetail = async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`/api/admin/merchants/${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setNotification({ type: 'error', message: json.message || 'Merchant not found.' });
      }
    } catch (err) {
      console.error('Failed to load merchant:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading merchant records...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.merchant) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-surface-border text-center shadow-card">
        <p className="text-sm font-bold text-slate-900">Merchant not found</p>
        <button
          onClick={() => navigate('/admin/merchants')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/25"
        >
          Return to Merchants
        </button>
      </div>
    );
  }

  const { merchant, stats, tabs } = data;

  // Actions
  const handleImpersonate = async () => {
    try {
      setActionLoading(true);
      const res = await adminFetch(`/api/admin/merchants/${merchant.id}/impersonate`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.token) {
        localStorage.setItem('bizpilot_token', json.token);
        sessionStorage.setItem('bizpilot_impersonating', 'true');
        window.open('/dashboard', '_blank');
        setNotification({
          type: 'success',
          message: `Impersonation active for "${merchant.business_name}" in new tab.`
        });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to impersonate.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async () => {
    const isSuspending = merchant.status !== 'suspended';
    try {
      setActionLoading(true);
      const endpoint = isSuspending
        ? `/api/admin/merchants/${merchant.id}/suspend`
        : `/api/admin/merchants/${merchant.id}/unsuspend`;

      const res = await adminFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason: suspendModal.reason || 'Administrative restriction applied.' })
      });
      const json = await res.json();

      if (json.success) {
        setNotification({ type: 'success', message: json.message });
        setSuspendModal({ open: false, reason: '' });
        fetchMerchantDetail();
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Action failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setActionLoading(true);
      const res = await adminFetch(`/api/admin/merchants/${merchant.id}/reset-password`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setNotification({ type: 'success', message: json.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to trigger reset email.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteModal.confirmInput.trim() !== merchant.business_name.trim()) return;

    try {
      setActionLoading(true);
      const res = await adminFetch(`/api/admin/merchants/${merchant.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirm_business_name: deleteModal.confirmInput.trim() })
      });
      const json = await res.json();
      if (json.success) {
        navigate('/admin/merchants');
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete.' });
    } finally {
      setActionLoading(false);
    }
  };

  const tabList = [
    { key: 'products', label: 'Catalog Products', count: tabs.products.length, icon: Package },
    { key: 'orders', label: 'Customer Orders', count: tabs.orders.length, icon: ShoppingBag },
    { key: 'customers', label: 'Customers', count: tabs.customers.length, icon: Users },
    { key: 'stock_history', label: 'Stock Audit Trail', count: tabs.stock_history.length, icon: Clock },
    { key: 'courier_consignments', label: 'Courier Consignments', count: tabs.courier_consignments.length, icon: Truck },
    { key: 'audit_logs', label: 'Admin Action History', count: tabs.audit_logs.length, icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/merchants')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 text-brand-600" />
          <span>Back to Merchants Directory</span>
        </button>

        {/* Admin Operational Actions Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Safe Impersonation */}
          <button
            onClick={handleImpersonate}
            disabled={actionLoading || merchant.status === 'suspended'}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition shadow-xs disabled:opacity-40"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Impersonate Storefront</span>
          </button>

          {/* Send Password Reset Email */}
          <button
            onClick={handleResetPassword}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-surface-border text-xs font-bold transition shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Send Password Reset</span>
          </button>

          {/* Suspend / Unsuspend */}
          <button
            onClick={() => setSuspendModal({ open: true, reason: merchant.suspension_reason || '' })}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-xs ${
              merchant.status === 'suspended'
                ? 'bg-brand-50 hover:bg-brand-100 text-brand-800 border-brand-200'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
            }`}
          >
            {merchant.status === 'suspended' ? <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> : <ShieldBan className="w-3.5 h-3.5 text-rose-600" />}
            <span>{merchant.status === 'suspended' ? 'Reactivate Store' : 'Suspend Account'}</span>
          </button>

          {/* Cascade Delete (Super Admin only) */}
          {admin.role === 'super_admin' && (
            <button
              onClick={() => setDeleteModal({ open: true, confirmInput: '' })}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition shadow-xs"
              title="Delete Merchant & Cascade Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-xs ${
            notification.type === 'success'
              ? 'bg-brand-50 border-brand-200 text-brand-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span className="font-semibold">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Merchant Profile Header Banner */}
      <div className="bg-white border border-surface-border rounded-3xl p-6 sm:p-8 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0 font-bold text-xl shadow-xs">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{merchant.business_name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    merchant.status === 'suspended'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-brand-50 text-brand-700 border border-brand-200'
                  }`}
                >
                  {merchant.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">Merchant #{merchant.id}</span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-800 font-semibold">{merchant.name}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-800">{merchant.email}</span>
                </span>
                {merchant.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-800">{merchant.phone}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Currency: <strong className="text-slate-800">{merchant.currency}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Joined {new Date(merchant.created_at).toLocaleDateString()}</span>
                </span>
              </div>

              {merchant.status === 'suspended' && (
                <div className="mt-3.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>
                    <strong>Suspension Reason:</strong> {merchant.suspension_reason || 'Administrative restriction applied.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6 Metric Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-500">Products</span>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.products_count}</p>
          </div>
          <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-500">Stock Units</span>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.total_stock_units}</p>
          </div>
          <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-500">Catalog Value</span>
            <p className="text-xl font-black text-brand-600 mt-1">
              {merchant.currency === 'BDT' ? '৳' : '$'}{stats.inventory_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Orders</span>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.orders_count}</p>
          </div>
          <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total GMV</span>
            <p className="text-xl font-black text-brand-600 mt-1">
              {merchant.currency === 'BDT' ? '৳' : '$'}{stats.total_gmv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-500">Customers</span>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.customers_count}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Read-Only Mirror of Merchant Portal) */}
      <div className="flex border-b border-surface-border space-x-1 overflow-x-auto">
        {tabList.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                isActive
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Read-Only Tab Contents */}
      <div className="bg-white border border-surface-border rounded-3xl overflow-hidden shadow-card">
        {/* Tab 1: Products */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {tabs.products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No products created by this merchant yet.
                    </td>
                  </tr>
                ) : (
                  tabs.products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <span>{p.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {merchant.currency === 'BDT' ? '৳' : '$'}{parseFloat(p.cost_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {merchant.currency === 'BDT' ? '৳' : '$'}{parseFloat(p.selling_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={p.stock === 0 ? 'text-rose-600 font-bold' : p.stock <= p.low_stock_threshold ? 'text-amber-600 font-bold' : 'text-slate-800 font-medium'}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          p.stock === 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : p.stock <= p.low_stock_threshold ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-brand-50 text-brand-700 border border-brand-200'
                        }`}>
                          {p.status || (p.stock === 0 ? 'Out of Stock' : 'In Stock')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Placed Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {tabs.orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No customer orders placed yet.
                    </td>
                  </tr>
                ) : (
                  tabs.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">#{o.order_number}</td>
                      <td className="py-3 px-4 text-slate-800">
                        <p className="font-bold text-slate-900">{o.customer_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{o.customer_phone}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {merchant.currency === 'BDT' ? '৳' : '$'}{parseFloat(o.total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          o.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {o.order_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Customers */}
        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Total Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {tabs.customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No customer profiles recorded for this merchant.
                    </td>
                  </tr>
                ) : (
                  tabs.customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{c.phone}</td>
                      <td className="py-3 px-4 text-slate-400">{c.email || '—'}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700 font-bold">{c.total_orders || 1}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-brand-600">
                        {merchant.currency === 'BDT' ? '৳' : '$'}{parseFloat(c.total_spent || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Stock History */}
        {activeTab === 'stock_history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-center">Change</th>
                  <th className="py-3 px-4 text-center">Prev Stock</th>
                  <th className="py-3 px-4 text-center">New Stock</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {tabs.stock_history.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      Zero manual stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  tabs.stock_history.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.movement_type}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={s.quantity_change > 0 ? 'text-brand-600' : 'text-rose-600'}>
                          {s.quantity_change > 0 ? `+${s.quantity_change}` : s.quantity_change}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{s.previous_stock}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{s.new_stock}</td>
                      <td className="py-3 px-4 text-slate-500">{s.reason || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: Courier Consignments */}
        {activeTab === 'courier_consignments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Consignment ID</th>
                  <th className="py-3 px-4">Courier Partner</th>
                  <th className="py-3 px-4">Tracking Code</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">COD Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {tabs.courier_consignments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No courier consignments booked by this merchant yet.
                    </td>
                  </tr>
                ) : (
                  tabs.courier_consignments.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">#{c.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{c.courier_name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">{c.tracking_code}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {merchant.currency === 'BDT' ? '৳' : '$'}{parseFloat(c.cod_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 6: Admin Action History */}
        {activeTab === 'audit_logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {tabs.audit_logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No administrative actions recorded against this merchant yet.
                    </td>
                  </tr>
                ) : (
                  tabs.audit_logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-brand-700 font-bold">{log.admin_email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-50 text-brand-800 border border-brand-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{log.ip_address}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      {suspendModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-surface-border rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {merchant.status === 'suspended' ? 'Reactivate Merchant Account' : 'Suspend Merchant Account'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {merchant.status === 'suspended'
                ? 'Merchant will immediately regain access to their storefront dashboard and inventory.'
                : 'Suspension blocks merchant login and prevents customers from placing orders.'}
            </p>

            {merchant.status !== 'suspended' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Suspension
                </label>
                <textarea
                  rows="3"
                  value={suspendModal.reason}
                  onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                  placeholder="e.g. Repeated chargebacks, fraudulent courier bookings..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSuspendModal({ open: false, reason: '' })}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleSuspend}
                className={`w-1/2 py-2.5 text-white rounded-xl text-xs font-bold transition shadow-sm ${
                  merchant.status === 'suspended' ? 'bg-brand-600 hover:bg-brand-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Saving...' : merchant.status === 'suspended' ? 'Confirm Reactivation' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal with Strict Type-To-Confirm */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-base font-bold text-rose-600 mb-2">Permanently Delete Merchant & Cascade</h3>
            <p className="text-xs text-slate-600 mb-3">
              This action cannot be undone. To proceed, please type <span className="font-bold text-rose-600 select-all font-mono">"{merchant.business_name}"</span>:
            </p>
            <input
              type="text"
              autoFocus
              value={deleteModal.confirmInput}
              onChange={(e) => setDeleteModal({ ...deleteModal, confirmInput: e.target.value })}
              placeholder={merchant.business_name}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500 mb-4 font-medium"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, confirmInput: '' })}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Abort
              </button>
              <button
                type="button"
                disabled={actionLoading || deleteModal.confirmInput.trim() !== merchant.business_name.trim()}
                onClick={handleDelete}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {actionLoading ? 'Deleting...' : 'Delete Business Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
