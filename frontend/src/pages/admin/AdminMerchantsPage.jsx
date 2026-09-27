import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  ShieldBan,
  ShieldCheck,
  UserCheck,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminMerchantsPage() {
  const { adminFetch, admin } = useAdminAuth();
  const navigate = useNavigate();

  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modals state
  const [suspendModal, setSuspendModal] = useState({ open: false, merchant: null, reason: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, merchant: null, confirmInput: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        status: statusFilter,
        currency: currencyFilter,
        sort: sortBy
      });
      const res = await adminFetch(`/api/admin/merchants?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setMerchants(data.merchants);
      }
    } catch (err) {
      console.error('Failed to fetch merchants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [search, statusFilter, currencyFilter, sortBy]);

  // Handle Impersonate
  const handleImpersonate = async (m) => {
    try {
      setActionLoading(true);
      const res = await adminFetch(`/api/admin/merchants/${m.id}/impersonate`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('bizpilot_token', data.token);
        sessionStorage.setItem('bizpilot_impersonating', 'true');
        window.open('/dashboard', '_blank');
        setNotification({
          type: 'success',
          message: `Impersonation session opened in new tab for "${m.business_name}". Active for 30 minutes.`
        });
      } else {
        setNotification({ type: 'error', message: data.message || 'Impersonation failed.' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to initiate impersonation.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Suspend / Unsuspend
  const handleToggleSuspend = async () => {
    if (!suspendModal.merchant) return;
    const m = suspendModal.merchant;
    const isSuspending = m.status !== 'suspended';

    try {
      setActionLoading(true);
      const endpoint = isSuspending
        ? `/api/admin/merchants/${m.id}/suspend`
        : `/api/admin/merchants/${m.id}/unsuspend`;

      const res = await adminFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason: suspendModal.reason || 'Administrative hold applied.' })
      });
      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setSuspendModal({ open: false, merchant: null, reason: '' });
        fetchMerchants();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Operation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Type-to-Confirm Deletion
  const handleDeleteMerchant = async () => {
    if (!deleteModal.merchant) return;
    const m = deleteModal.merchant;

    if (deleteModal.confirmInput.trim() !== m.business_name.trim()) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await adminFetch(`/api/admin/merchants/${m.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirm_business_name: deleteModal.confirmInput.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setDeleteModal({ open: false, merchant: null, confirmInput: '' });
        fetchMerchants();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete merchant.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Merchants Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Full directory of platform businesses, subscription health, activity signals, and account controls
          </p>
        </div>
        <button
          onClick={fetchMerchants}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-surface-border shadow-card transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-sm ${
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

      {/* Search and Filters Bar */}
      <div className="bg-white border border-surface-border rounded-2xl p-4 sm:p-5 shadow-card flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by business name, owner name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-canvas border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-canvas border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          {/* Currency Filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-surface-canvas border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="BDT">BDT (৳)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface-canvas border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="gmv_desc">Highest GMV</option>
            <option value="orders_desc">Most Orders</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-surface-border rounded-3xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Business / Owner</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Catalog</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">GMV (This Month)</th>
                <th className="py-3 px-4 text-right">GMV (All-Time)</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    Loading merchants...
                  </td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No merchants found matching your filters.
                  </td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    {/* Business / Owner */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => navigate(`/admin/merchants/${m.id}`)}
                        className="text-left font-bold text-slate-900 hover:text-brand-600 transition"
                      >
                        {m.business_name}
                      </button>
                      <p className="text-[11px] text-slate-500">{m.name}</p>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-medium text-slate-800">{m.email}</p>
                      <p className="text-[11px] text-slate-400">{m.phone || 'No phone'}</p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          m.status === 'suspended'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-brand-50 text-brand-700 border border-brand-200'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    {/* Catalog */}
                    <td className="py-3 px-4 text-center font-mono text-slate-700 font-medium">
                      {m.products_count} items
                    </td>

                    {/* Orders */}
                    <td className="py-3 px-4 text-center font-mono text-slate-700 font-medium">
                      {m.orders_count}
                    </td>

                    {/* GMV Month */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-brand-600">
                      {m.currency === 'BDT' ? '৳' : '$'}{m.gmv_this_month.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* GMV All-Time */}
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {m.currency === 'BDT' ? '৳' : '$'}{m.gmv_all_time.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Last Activity */}
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {m.last_activity ? new Date(m.last_activity).toLocaleDateString() : 'None'}
                    </td>

                    {/* Operational Action Buttons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => navigate(`/admin/merchants/${m.id}`)}
                          title="Open Deep Inspector"
                          className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Safe Impersonation */}
                        <button
                          onClick={() => handleImpersonate(m)}
                          disabled={actionLoading || m.status === 'suspended'}
                          title="Impersonate Merchant (Opens in new tab with warning banner)"
                          className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition disabled:opacity-30"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>

                        {/* Suspend / Unsuspend */}
                        <button
                          onClick={() => setSuspendModal({ open: true, merchant: m, reason: m.suspension_reason || '' })}
                          title={m.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                          className={`p-2 rounded-xl transition ${
                            m.status === 'suspended'
                              ? 'text-brand-600 hover:bg-brand-50'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          {m.status === 'suspended' ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <ShieldBan className="w-4 h-4" />
                          )}
                        </button>

                        {/* Cascade Delete (Super Admin only) */}
                        {admin.role === 'super_admin' && (
                          <button
                            onClick={() => setDeleteModal({ open: true, merchant: m, confirmInput: '' })}
                            title="Permanently Delete Merchant (Cascade)"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend / Unsuspend Modal */}
      {suspendModal.open && suspendModal.merchant && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-surface-border rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-2xl ${suspendModal.merchant.status === 'suspended' ? 'bg-brand-50 text-brand-600' : 'bg-rose-50 text-rose-600'}`}>
                {suspendModal.merchant.status === 'suspended' ? <ShieldCheck className="w-5 h-5" /> : <ShieldBan className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {suspendModal.merchant.status === 'suspended' ? 'Reactivate Merchant Account' : 'Suspend Merchant Account'}
                </h3>
                <p className="text-xs text-slate-500">{suspendModal.merchant.business_name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {suspendModal.merchant.status === 'suspended'
                ? 'Reactivating this account will restore full access for the merchant to log in and process storefront orders.'
                : 'Suspension blocks merchant login and prevents new orders from being placed. All merchant data, products, and order history will remain preserved.'}
            </p>

            {suspendModal.merchant.status !== 'suspended' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Suspension (Visible to Merchant & Audit Trail)
                </label>
                <textarea
                  rows="3"
                  value={suspendModal.reason}
                  onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                  placeholder="e.g. Terms of service violation, unfulfilled COD shipments, chargebacks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSuspendModal({ open: false, merchant: null, reason: '' })}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleSuspend}
                className={`w-1/2 py-2.5 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                  suspendModal.merchant.status === 'suspended'
                    ? 'bg-brand-600 hover:bg-brand-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Processing...' : suspendModal.merchant.status === 'suspended' ? 'Confirm Reactivation' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Type-to-Confirm Deletion Modal */}
      {deleteModal.open && deleteModal.merchant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Permanent Cascade Deletion</h3>
                <p className="text-xs text-rose-600 font-semibold">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              You are about to permanently delete <strong>{deleteModal.merchant.business_name}</strong>.
              This will cascade through all tables and permanently erase:
            </p>
            <ul className="text-[11px] text-slate-600 list-disc list-inside mb-4 space-y-1 bg-surface-canvas p-3.5 rounded-2xl border border-slate-200">
              <li>All {deleteModal.merchant.products_count} catalog products & stock movement history</li>
              <li>All {deleteModal.merchant.orders_count} customer orders, line items, and payment logs</li>
              <li>Customer profiles, courier consignments, and store configurations</li>
            </ul>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                To confirm, please type <span className="font-mono text-rose-600 select-all font-bold">"{deleteModal.merchant.business_name}"</span> below:
              </label>
              <input
                type="text"
                autoFocus
                value={deleteModal.confirmInput}
                onChange={(e) => setDeleteModal({ ...deleteModal, confirmInput: e.target.value })}
                placeholder={deleteModal.merchant.business_name}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, merchant: null, confirmInput: '' })}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel & Abort
              </button>
              <button
                type="button"
                disabled={actionLoading || deleteModal.confirmInput.trim() !== deleteModal.merchant.business_name.trim()}
                onClick={handleDeleteMerchant}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                {actionLoading ? 'Deleting...' : 'Delete Business & Cascade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
