import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, KeyRound, ShieldAlert, CheckCircle, RefreshCw, X, User } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminUsersPage() {
  const { adminFetch, admin } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'support', initial_password: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: `${data.message} Temporary Password: ${data.temporary_password}`
        });
        setAddModalOpen(false);
        setFormData({ name: '', email: '', role: 'support', initial_password: '' });
        fetchAdmins();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to create administrator.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAdmin = async (id, email) => {
    if (!window.confirm(`Are you sure you want to permanently revoke administrator access for ${email}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        fetchAdmins();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to revoke access.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Operators & Roles</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage administrative accounts, role privileges, and multi-factor authentication requirements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdmins}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-surface-border shadow-card transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-md shadow-brand-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision Administrator</span>
          </button>
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
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-brand-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-70 text-slate-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admins Table Card */}
      <div className="bg-white border border-surface-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
              <tr>
                <th className="py-3.5 px-4">Operator Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-center">Assigned Role</th>
                <th className="py-3.5 px-4 text-center">2FA Security</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                      <span>Loading admin accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No administrators found.
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-black text-xs border border-brand-200/60 shadow-xs">
                        {a.name ? a.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{a.name}</p>
                        {a.id === admin?.id && (
                          <span className="text-[10px] text-brand-600 font-semibold">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{a.email}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-brand-50 text-brand-700 border border-brand-200/60">
                        {a.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          a.two_factor_enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {a.two_factor_enabled ? 'Enforced' : 'Not Configured'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {a.last_login_at ? new Date(a.last_login_at).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {a.id !== admin?.id ? (
                        <button
                          onClick={() => handleRevokeAdmin(a.id, a.email)}
                          title="Revoke Administrator Access"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Admin Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-surface-border rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Provision Administrator</h3>
                  <p className="text-xs text-slate-500">Add trusted platform staff member</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rachel Support Lead"
                  className="w-full bg-slate-50 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@bizpilot.io"
                  className="w-full bg-slate-50 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Administrative Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                >
                  <option value="support">Support Agent (Read-only + Impersonate)</option>
                  <option value="billing">Billing Specialist (Plans & Financials)</option>
                  <option value="readonly">Read-Only Observer (Metrics dashboards only)</option>
                  <option value="super_admin">Super Administrator (Full unrestricted access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Custom Initial Password <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="password"
                  value={formData.initial_password}
                  onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
                  placeholder="Leave empty to auto-generate password"
                  className="w-full bg-slate-50 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-600/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
