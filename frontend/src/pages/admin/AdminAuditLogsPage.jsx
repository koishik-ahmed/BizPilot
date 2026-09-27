import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, RefreshCw, Shield, AlertCircle, Clock } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminAuditLogsPage() {
  const { adminFetch } = useAdminAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ search, action: actionFilter });
      const res = await adminFetch(`/api/admin/audit-logs?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

  const getActionBadgeColor = (action) => {
    if (action.includes('SUSPEND') || action.includes('DELETE') || action.includes('REVOKE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('IMPERSONATE') || action.includes('CONFIG')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (action.includes('LOGIN') || action.includes('RESTORE') || action.includes('UNSUSPEND') || action.includes('ENABLE')) {
      return 'bg-brand-50 text-brand-800 border-brand-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Audit Trail</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable system audit logs recording every administrative action, suspension, and impersonation
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-surface-border shadow-card transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-surface-border rounded-2xl p-4 sm:p-5 shadow-card flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by admin email, target merchant, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-canvas border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-surface-canvas border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
        >
          <option value="all">All Action Types</option>
          <option value="IMPERSONATE_MERCHANT">Impersonation Sessions</option>
          <option value="SUSPEND_MERCHANT">Suspensions</option>
          <option value="UNSUSPEND_MERCHANT">Reactivations</option>
          <option value="DELETE_MERCHANT">Cascade Deletions</option>
          <option value="UPDATE_PLATFORM_CONFIG">Config / Feature Flag Changes</option>
          <option value="ADMIN_LOGIN">Admin Logins</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-surface-border rounded-3xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-center">Action Type</th>
                <th className="py-3 px-4">Target Record</th>
                <th className="py-3 px-4">Origin IP</th>
                <th className="py-3 px-4">Context / Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No audit records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.admin_email}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <p className="font-bold text-slate-900">{log.target_name || log.target_id || 'System'}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">{log.target_type}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.ip_address}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
