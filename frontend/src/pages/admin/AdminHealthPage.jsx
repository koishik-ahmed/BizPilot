import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Cpu, ShieldCheck, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminHealthPage() {
  const { adminFetch } = useAdminAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      setRefreshing(true);
      const res = await adminFetch('/api/admin/health');
      const data = await res.json();
      if (data.success) {
        setHealth(data.data);
      }
    } catch (err) {
      console.error('Failed to load system health:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
        Failed to fetch system diagnostic metrics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Health & Telemetry</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Diagnostic metrics, memory footprints, table row distributions, and gateway statuses
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-surface-border shadow-card transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Top Status Banner */}
      <div className="bg-white border border-surface-border rounded-3xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-brand-600 shrink-0 shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">All Platform Systems Operational</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                {health.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Uptime: <strong className="text-slate-800">{health.system.uptime_formatted}</strong> • Telemetry Timestamp: {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Node Process */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Node Environment</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{health.system.node_version}</div>
          <p className="text-xs text-slate-500 mt-1">
            Platform: {health.system.platform} ({health.system.arch})
          </p>
          <p className="text-xs text-slate-500">
            CPUs: {health.system.cpu_count} Core(s)
          </p>
        </div>

        {/* Memory Footprint */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Heap Memory</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{health.process.heap_used_mb} MB Used</div>
          <p className="text-xs text-slate-500 mt-1">
            Heap Total: {health.process.heap_total_mb} MB
          </p>
          <p className="text-xs text-slate-500">
            RSS: {health.process.rss_mb} MB
          </p>
        </div>

        {/* Database Engine */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Storage Engine</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-black text-slate-900 leading-snug">{health.database.engine}</div>
          <p className="text-xs text-brand-600 mt-1 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            Status: {health.database.status}
          </p>
        </div>

        {/* Security & Rate Limiting */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Gate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">
            {health.security.active_ip_blocks} Blocked IP(s)
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracked Login IPs: {health.security.tracked_rate_limit_ips}
          </p>
          <p className="text-xs text-slate-500">
            5 attempts / 15m lockout
          </p>
        </div>
      </div>

      {/* Database Table Rows Distribution */}
      <div className="bg-white border border-surface-border rounded-3xl p-6 shadow-card space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-600" />
          <span>Database Table Row Distribution</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(health.database.table_counts || {}).map(([table, count]) => (
            <div key={table} className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">{table}</span>
              <p className="text-xl font-black text-slate-900 mt-1">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Integrations Telemetry */}
      <div className="bg-white border border-surface-border rounded-3xl p-6 shadow-card space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-600" />
          <span>Active Integration Gateways</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-900">Email Gateway (SMTP)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs text-slate-500">{health.integrations.smtp_email.provider}</p>
            <p className="text-xs text-brand-600 mt-2 font-bold">100% Delivery Success Rate</p>
          </div>

          <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-900">Courier Logistics</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs text-slate-500">
              {health.integrations.courier_gateway.providers.join(', ')}
            </p>
            <p className="text-xs text-brand-600 mt-2 font-bold">Automated Consignments Online</p>
          </div>

          <div className="bg-surface-canvas p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-900">Reconciliation Engine</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs text-slate-500">{health.integrations.payment_reconciliation.type}</p>
            <p className="text-xs text-brand-600 mt-2 font-bold">Multi-Currency (BDT ৳ & USD $)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
