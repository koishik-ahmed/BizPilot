import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  ShoppingBag,
  DollarSign,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  PackageX,
  Clock,
  ShieldAlert,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminDashboardPage() {
  const { adminFetch } = useAdminAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      setRefreshing(true);
      const res = await adminFetch('/api/admin/dashboard/overview');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load platform analytics');
      }
    } catch (err) {
      setError('Could not connect to admin metrics service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading platform health and operational metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-700 shadow-card">
        <p className="text-sm font-bold">{error || 'Data unavailable'}</p>
        <button
          onClick={fetchOverview}
          className="mt-3 px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm hover:bg-rose-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, needs_attention, top_merchants, daily_stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Command Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time platform telemetry, merchant operational health, and cross-currency throughput
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOverview}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-surface-border shadow-card transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Merchants */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Merchants</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{kpis.total_merchants}</div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="text-brand-600 font-bold">{kpis.active_merchants} active</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-500 font-bold">{kpis.suspended_merchants} suspended</span>
          </div>
        </div>

        {/* Card 2: Signups Today / This Week */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">New Signups</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">+{kpis.signups_today}</div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span className="text-brand-600 font-bold">+{kpis.signups_this_week}</span> this calendar week
          </div>
        </div>

        {/* Card 3: Orders Placed Today */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Orders Today</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{kpis.orders_today}</div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">Platform-wide throughput</div>
        </div>

        {/* Card 4: GMV Today (Cross-Currency) */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">GMV Today</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              ${(kpis.gmv_today?.USD || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              <span className="text-xs font-semibold text-slate-400 ml-1">USD</span>
            </div>
            {Boolean(kpis.gmv_today?.BDT) && (
              <div className="text-xs font-bold text-brand-600">
                ৳{(kpis.gmv_today?.BDT || 0).toLocaleString()} <span className="text-[10px] text-slate-400">BDT</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 5: Active Merchants 7d */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active (7 Days)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{kpis.active_merchants_7d}</div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            {Math.round((kpis.active_merchants_7d / (kpis.total_merchants || 1)) * 100)}% active platform usage
          </div>
        </div>

        {/* Card 6: Platform Health & Errors */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Error Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-brand-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-brand-600 tracking-tight">{kpis.error_rate}</div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-600 font-bold">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            All gateways healthy
          </div>
        </div>
      </div>

      {/* "Needs Attention" Operational Panel matching Ryvix Emerald theme */}
      <div className="bg-white border border-surface-border rounded-3xl overflow-hidden shadow-card">
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-center justify-between bg-surface-canvas/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Needs Immediate Operational Attention</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                  {needs_attention.length} Alerts
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Onboarding stuck, churning merchants, depleted catalogs, and account suspensions
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">Priority Action Queue</span>
        </div>

        {needs_attention.length === 0 ? (
          <div className="p-10 text-center text-xs font-semibold text-slate-500">
            ✅ All merchants are healthy and on track. Zero operational alerts.
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {needs_attention.map((item) => {
              const isCritical = item.severity === 'critical';
              const isHigh = item.severity === 'high';
              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-canvas/60 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                        isCritical
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : isHigh
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-brand-50 text-brand-600 border border-brand-200'
                      }`}
                    >
                      {item.type === 'stock_depleted' ? (
                        <PackageX className="w-5 h-5" />
                      ) : item.type === 'onboarding_stuck' ? (
                        <Clock className="w-5 h-5" />
                      ) : item.type === 'merchant_suspended' ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.title}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isCritical
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isHigh
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-brand-50 text-brand-800 border border-brand-200'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                      <div className="mt-1.5 flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span>Email: <strong className="text-slate-800">{item.email}</strong></span>
                        {item.phone && <span>Phone: <strong className="text-slate-800">{item.phone}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/admin/merchants/${item.merchant_id}`)}
                    className="self-end sm:self-center px-4 py-2 bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-700 border border-brand-200 hover:border-brand-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <span>{item.action_label}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visual Analytics & Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Orders & Signups (7 Days) */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Orders & Signups Trend (7 Days)</h3>
              <p className="text-xs text-slate-500">Platform throughput cadence</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_stats}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b6b55" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1b6b55" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b57" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff6b57" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="orders" stroke="#1b6b55" strokeWidth={2} fillOpacity={1} fill="url(#orderGrad)" name="Orders" />
                <Area type="monotone" dataKey="signups" stroke="#ff6b57" strokeWidth={2} fillOpacity={1} fill="url(#signupGrad)" name="Signups" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily GMV Volume */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Daily GMV Volume by Currency</h3>
              <p className="text-xs text-slate-500">Gross Merchandise Value across all active stores</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily_stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val, name) => [name === 'gmv_bdt' ? `৳${val.toLocaleString()}` : `$${val.toLocaleString()}`, name === 'gmv_bdt' ? 'BDT GMV' : 'USD GMV']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="gmv_usd" fill="#228267" name="gmv_usd" radius={[6, 6, 0, 0]} />
                <Bar dataKey="gmv_bdt" fill="#1b6b55" name="gmv_bdt" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 10 Merchants by GMV This Month */}
      <div className="bg-white border border-surface-border rounded-3xl overflow-hidden shadow-card">
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Top Merchants by GMV (This Month)</h3>
            <p className="text-xs text-slate-500">Core growth and volume drivers across the platform</p>
          </div>
          <button
            onClick={() => navigate('/admin/merchants')}
            className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
          >
            <span>View All Merchants</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-canvas/60 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Merchant / Business</th>
                <th className="py-3 px-4">Owner & Contact</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Catalog Size</th>
                <th className="py-3 px-4 text-right">Orders</th>
                <th className="py-3 px-4 text-right">GMV (This Month)</th>
                <th className="py-3 px-4 text-right">GMV (All-Time)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {top_merchants.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{m.business_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">#{m.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <p className="text-slate-900 font-semibold">{m.owner_name}</p>
                    <p className="text-[11px] text-slate-400">{m.email}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        m.status === 'suspended'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700 font-medium">
                    {m.products_count} items
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700 font-medium">
                    {m.total_orders}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-brand-600">
                    {m.currency === 'BDT' ? '৳' : '$'}{m.gmv_this_month.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {m.currency === 'BDT' ? '৳' : '$'}{m.gmv_all_time.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => navigate(`/admin/merchants/${m.id}`)}
                      className="px-3 py-1 bg-surface-canvas hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-xl text-[11px] font-bold transition border border-slate-200"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
