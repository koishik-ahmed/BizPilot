import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  PlusCircle,
  Boxes,
  Users,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import DashboardCalendar from '../../components/common/DashboardCalendar';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

// Compact number formatter: 1000 -> 1k, 10000 -> 10k, 100000 -> 100k, 1000000 -> 1M
const formatCompactNumber = (value) => {
  if (value === 0 || value === '0' || !value) return '0';
  const num = Number(value);
  if (isNaN(num)) return value;
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (abs >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (abs >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
};

// Saturday-to-Friday week day order for Bangladeshi business week
const WEEK_DAY_ORDER = { Sat: 0, Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6 };

const sortWeekDays = (list, key = 'date') => {
  if (!Array.isArray(list) || list.length === 0) return [];
  const allAreWeekDays = list.every(item => item && WEEK_DAY_ORDER[item[key]] !== undefined);
  if (allAreWeekDays) {
    return [...list].sort((a, b) => WEEK_DAY_ORDER[a[key]] - WEEK_DAY_ORDER[b[key]]);
  }
  return list;
};

export default function DashboardPage() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState('7d');
  const [revenuePeriod, setRevenuePeriod] = useState('30d');

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await authFetch(`/api/dashboard?salesPeriod=${salesPeriod}&revenuePeriod=${revenuePeriod}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [salesPeriod, revenuePeriod]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-slate-200 rounded-2xl w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 rounded-3xl"></div>
          <div className="h-72 bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const { kpis, salesChartData, revenueChartData, recentOrders, topProducts, quickActions, calendarOrders } = data || {};

  const displaySalesChartData = salesPeriod === '7d' 
    ? sortWeekDays(salesChartData, 'date') 
    : (salesChartData || []);

  const displayRevenueChartData = revenuePeriod === '7d' 
    ? sortWeekDays(revenueChartData, 'period') 
    : (revenueChartData || []);

  return (
    <div className="space-y-8">
      {/* 12.2 Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Merchant'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here’s your business performance and fulfillment overview for today.
          </p>
        </div>

        {/* Actions: Refresh & Place Order */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition border border-slate-200 shadow-sm"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <Link
            to="/orders/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/25 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Place New Order</span>
          </Link>
        </div>
      </div>

      {/* 12.3 Exactly Four KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Today's Sales (Highlighted in Brand Color) */}
        <div className="bg-gradient-to-br from-[#0a3328] via-[#0d4033] to-[#07241c] text-white p-6 rounded-3xl shadow-xl shadow-brand-950/20 border border-brand-700/50 flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-brand-200/90 uppercase tracking-wider">Today's Total Sales</span>
            <div className="p-2 rounded-xl bg-white/15 text-emerald-300 backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-3xl font-black text-white tracking-tight">
              {formatCurrency(kpis?.todaySales || 0)}
            </h3>
            <p className="text-[11px] text-emerald-300/90 font-semibold mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Confirmed paid volume today
            </p>
          </div>
          {/* Subtle Ambient Decorative Glows */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-emerald-400/15 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Card 2: Today's Orders */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between hover:shadow-card-hover transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Orders</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis?.todayOrdersCount || 0}
            </h3>
            <p className="text-[11px] text-brand-700 font-semibold mt-1">
              Active orders received
            </p>
          </div>
        </div>

        {/* Card 3: Active Products */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between hover:shadow-card-hover transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Products</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis?.activeProductsCount || 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Available in catalog
            </p>
          </div>
        </div>

        {/* Card 4: Low Stock (links to Inventory) */}
        <Link
          to="/inventory?filter=low"
          className="bg-white p-6 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between hover:border-coral-400 hover:shadow-card-hover transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock</span>
            <div className="p-2 rounded-xl bg-coral-50 text-coral-500 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-coral-500 tracking-tight">
              {kpis?.lowStockCount || 0}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-coral-600 font-bold mt-1">
              <span>Review Inventory</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Row 1: Sales Performance Chart (8 cols) & Activity Calendar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Performance Chart (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-900">Sales Performance</h3>
              <p className="text-xs text-slate-400">Order count and volume trends from database</p>
            </div>
            {/* Options: 7 Days, 30 Days, 3 Months */}
            <div className="flex items-center gap-1 bg-surface-canvas p-1 rounded-xl text-xs font-semibold">
              {['7d', '30d', '3m'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSalesPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg transition uppercase ${
                    salesPeriod === p ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displaySalesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b6b55" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1b6b55" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  tickFormatter={formatCompactNumber}
                  width={42}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Sales Volume']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#1b6b55" strokeWidth={3} fillOpacity={1} fill="url(#salesTeal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dashboard Activity Calendar (lg:col-span-4) */}
        <div className="lg:col-span-4">
          <DashboardCalendar
            orders={calendarOrders || recentOrders || []}
            onSelectDate={(d) => console.log('Selected date:', d)}
          />
        </div>
      </div>

      {/* Row 2: Revenue Overview (6 cols) & Top Selling Products (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Chart (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-900">Revenue Overview</h3>
              <p className="text-xs text-slate-400">Based strictly on confirmed paid orders</p>
            </div>
            <div className="flex items-center gap-1 bg-surface-canvas p-1 rounded-xl text-xs font-semibold">
              {['7d', '30d', '3m', '1y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setRevenuePeriod(p)}
                  className={`px-2.5 py-1 rounded-lg transition uppercase ${
                    revenuePeriod === p ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayRevenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f3" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  tickFormatter={formatCompactNumber}
                  width={42}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#1b6b55" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Top Selling Products</h3>
                <p className="text-xs text-slate-400">Highest volume performers in catalog</p>
              </div>
              <Link to="/products" className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1">
                <span>Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {topProducts && topProducts.length > 0 ? (
                topProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/products?view=${p.id}`)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-slate-100/60 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                          <Package className="w-4 h-4" />
                          <span className="text-[7px] font-bold">No Image</span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 group-hover:text-brand-700 line-clamp-1">
                          {p.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">SKU: {p.sku}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xs text-slate-900">{p.unitsSold} sold</p>
                      <p className="text-[10px] text-brand-700 font-semibold">{formatCurrency(p.revenueContribution)} rev</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No product sales logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Orders (8 cols) & Quick Operations (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-card border border-surface-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Recent Orders</h3>
              <p className="text-xs text-slate-400">Latest customer activity</p>
            </div>
            <Link to="/orders" className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5">Order</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Payment</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => navigate(`/orders?view=${ord.id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer transition"
                    >
                      <td className="py-3 font-bold text-brand-700">{ord.order_number}</td>
                      <td className="py-3 text-slate-800">{ord.customer_name}</td>
                      <td className="py-3 font-bold text-slate-900">{formatCurrency(ord.total)}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.payment_status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {ord.order_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-4">Quick Operations</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/products?action=new"
                className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-surface-canvas hover:bg-brand-50 hover:border-brand-200 border border-slate-200/80 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md mb-2">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <p className="font-bold text-xs text-slate-900 group-hover:text-brand-700">Add Product</p>
                <p className="text-[10px] text-slate-400">Expand catalog</p>
              </Link>

              <Link
                to="/inventory"
                className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-surface-canvas hover:bg-brand-50 hover:border-brand-200 border border-slate-200/80 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md mb-2">
                  <Boxes className="w-5 h-5" />
                </div>
                <p className="font-bold text-xs text-slate-900 group-hover:text-brand-700">Inventory</p>
                <p className="text-[10px] text-slate-400">Stock audit</p>
              </Link>

              <Link
                to="/customers"
                className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-surface-canvas hover:bg-brand-50 hover:border-brand-200 border border-slate-200/80 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <p className="font-bold text-xs text-slate-900 group-hover:text-brand-700">Customers</p>
                <p className="text-[10px] text-slate-400">Directory</p>
              </Link>

              <Link
                to="/revenue"
                className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-surface-canvas hover:bg-brand-50 hover:border-brand-200 border border-slate-200/80 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md mb-2">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="font-bold text-xs text-slate-900 group-hover:text-brand-700">Revenue</p>
                <p className="text-[10px] text-slate-400">Cash flow</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

