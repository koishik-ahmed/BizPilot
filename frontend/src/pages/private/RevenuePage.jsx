import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ArrowDownRight,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  PieChart as PieIcon,
  Sparkles,
  Loader2,
  Coins,
  Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';
import { downloadReportPDF } from '../../utils/reportPdfGenerator';

export default function RevenuePage() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [period, setPeriod] = useState('This Month');
  const [finInterval, setFinInterval] = useState('monthly'); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [markingId, setMarkingId] = useState(null);

  const periods = ['Today', 'This Week', 'This Month', 'Last Month', 'This Year'];

  const fetchRevenue = async () => {
    try {
      const res = await authFetch(`/api/revenue?period=${encodeURIComponent(period)}`);
      const json = await res.json();
      if (json.success) {
        setRevenueData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [period]);

  // 13.10 Workflow: Mark unpaid order as paid
  const handleMarkAsPaid = async (orderId) => {
    setMarkingId(orderId);
    try {
      const res = await authFetch(`/api/orders/${orderId}/mark-paid`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        refreshNotifications();
        fetchRevenue();
      }
    } catch (err) {
      showToast('Payment update failed', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/reports/export-csv?reportType=sales', '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!revenueData) {
      showToast('Revenue data is still loading, please wait.', 'error');
      return;
    }
    setDownloadingPdf(true);
    try {
      const { kpis, financials, categoryData, chartData } = revenueData;
      const businessName = user?.business_name || 'BizPilot Merchant Store';
      const ownerName = user?.name || 'Store Owner';

      const title = 'Financial Revenue & Profitability Statement';
      const subtitle = `Comprehensive financial breakdown, revenue streams, and cash collections for ${period}`;
      const fileName = `bizpilot-revenue-statement-${period.toLowerCase().replace(/\s+/g, '-')}.pdf`;

      const kpiCards = [
        { label: 'Total Settled Revenue', value: formatCurrency(kpis?.totalRevenue || 0), subtext: 'Confirmed cleared funds' },
        { label: 'Confirmed Paid Orders', value: `${kpis?.paidOrdersCount || 0} orders`, subtext: 'Successfully settled' },
        { label: 'Average Order Value', value: formatCurrency(kpis?.averageOrderValue || 0), subtext: 'Revenue per transaction' },
        { label: 'Pending Receivables (COD)', value: formatCurrency(kpis?.pendingRevenue || 0), subtext: 'Awaiting rider reconciliation' }
      ];

      const tables = [
        {
          title: 'Financial Operating Statement (Income vs Product Costs vs Profit)',
          subtitle: 'Aggregated operating metrics across standard calendar intervals',
          headers: ['Financial Interval', 'Gross Revenue (Income)', 'COGS (Product Costs)', 'Net Operating Profit', 'Margin (%)'],
          rows: [
            ['Today (Daily)', formatCurrency(financials?.daily?.income || 0), formatCurrency(financials?.daily?.expense || 0), formatCurrency(financials?.daily?.profit || 0), `${financials?.daily?.profitMargin || 0}%`],
            ['Last 7 Days (Weekly)', formatCurrency(financials?.weekly?.income || 0), formatCurrency(financials?.weekly?.expense || 0), formatCurrency(financials?.weekly?.profit || 0), `${financials?.weekly?.profitMargin || 0}%`],
            ['Last 30 Days (Monthly)', formatCurrency(financials?.monthly?.income || 0), formatCurrency(financials?.monthly?.expense || 0), formatCurrency(financials?.monthly?.profit || 0), `${financials?.monthly?.profitMargin || 0}%`],
            ['Last 12 Months (Yearly)', formatCurrency(financials?.yearly?.income || 0), formatCurrency(financials?.yearly?.expense || 0), formatCurrency(financials?.yearly?.profit || 0), `${financials?.yearly?.profitMargin || 0}%`]
          ]
        },
        {
          title: 'Revenue Distribution by Product Category',
          subtitle: 'Sales volume distribution across primary store departments',
          headers: ['Product Category', 'Total Volume (BDT)', 'Category Share (%)'],
          rows: (categoryData || []).map(c => [c.category, formatCurrency(c.revenue || 0), `${c.percentage || 0}%`])
        },
        {
          title: 'Weekly Revenue Trajectory / Daily Settlement Log',
          subtitle: 'Day-by-day confirmed payment records',
          headers: ['Date / Day', 'Confirmed Paid Orders', 'Daily Settled Revenue'],
          rows: (chartData || []).map(cd => [cd.fullDate ? `${cd.date} (${cd.fullDate})` : cd.date, `${cd.orders || 0} orders`, formatCurrency(cd.revenue || 0)]),
          totals: [
            'Period Total',
            `${(chartData || []).reduce((s, c) => s + (c.orders || 0), 0)} orders`,
            formatCurrency((chartData || []).reduce((s, c) => s + (parseFloat(c.revenue) || 0), 0))
          ]
        }
      ];

      await downloadReportPDF({
        title,
        subtitle,
        businessName,
        ownerName,
        period,
        kpis: kpiCards,
        tables,
        fileName
      });
      showToast('Revenue Statement PDF downloaded successfully!');
    } catch (err) {
      console.error('Failed to export revenue PDF:', err);
      showToast('Failed to generate revenue statement PDF. Please try again.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-3xl w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const { kpis, financials, chartData, categoryData, paymentStatusData, recentTransactions, pendingPayments, aiInsight } =
    revenueData || {};

  const paidVal = Number(paymentStatusData?.paidAmount ?? 0);
  const pendingVal = Number(paymentStatusData?.pendingAmount ?? 0);

  const pieSlices = [];
  if (paidVal > 0) {
    pieSlices.push({ name: 'Paid Revenue', value: paidVal, fill: '#1b6b55' });
  }
  if (pendingVal > 0) {
    pieSlices.push({ name: 'Pending Balance', value: pendingVal, fill: '#ff6b57' });
  }

  const displayPieData = pieSlices.length > 0
    ? pieSlices
    : [{ name: 'No Orders', value: 1, fill: '#e2e8f0' }];

  return (
    <div className="space-y-8">
      {/* 13.1 Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Revenue & Financial Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Confirmed collected income, average order values, and live receivables management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 13.2 Date Filter */}
          <div className="flex items-center gap-1.5 bg-surface-canvas p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none pr-3 py-1"
            >
              {periods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 13.3 Export Buttons */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-canvas hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-brand-600/20 transition cursor-pointer disabled:opacity-60"
          >
            {downloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* 13.11 AI Revenue Insight Banner */}
      {aiInsight && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-brand-50 via-white to-brand-50 border border-brand-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-brand-900">{aiInsight.title}</h4>
                <span className="text-[10px] bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">
                  {aiInsight.label}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{aiInsight.text}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/ai-insights')}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900 shrink-0"
          >
            <span>All Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Financial Performance: Income, Expense & Profit (Daily, Weekly, Monthly, Yearly) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-surface-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-brand-600" />
              Financial Performance (Income, Expense & Profit)
            </h3>
            <p className="text-xs text-slate-400">
              Real-time net calculations based on paid sales volume and Cost of Goods Sold (COGS)
            </p>
          </div>
          {/* Period Tabs: Daily, Weekly, Monthly, Yearly */}
          <div className="inline-flex bg-surface-canvas p-1 rounded-2xl border border-slate-200">
            {[
              { id: 'daily', label: 'Daily (Today)' },
              { id: 'weekly', label: 'Weekly (7d)' },
              { id: 'monthly', label: 'Monthly (30d)' },
              { id: 'yearly', label: 'Yearly' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFinInterval(tab.id)}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  finInterval === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 cards: Income, Expense, Net Profit */}
        {(() => {
          const currentFin = financials?.[finInterval] || {
            income: 0,
            expense: 0,
            profit: 0,
            profitMargin: 0,
            ordersCount: 0
          };
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Income Card */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Income</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {currentFin.ordersCount} Paid Orders
                  </span>
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                  {formatCurrency(currentFin.income)}
                </h4>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Paid customer collections</p>
              </div>

              {/* Expense Card */}
              <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Expense (COGS)</span>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    Cost of Goods
                  </span>
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
                  {formatCurrency(currentFin.expense)}
                </h4>
                <p className="text-[11px] text-rose-600 font-semibold mt-1">Product purchase & inventory cost</p>
              </div>

              {/* Profit Card */}
              <div className="p-5 rounded-2xl bg-brand-50/70 border border-brand-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-900">Net Profit</span>
                  <span className="text-[11px] font-bold text-brand-800 bg-brand-100 px-2 py-0.5 rounded-full">
                    {currentFin.profitMargin}% Margin
                  </span>
                </div>
                <h4 className={`text-2xl sm:text-3xl font-black mt-2 ${currentFin.profit >= 0 ? 'text-brand-700' : 'text-coral-600'}`}>
                  {formatCurrency(currentFin.profit)}
                </h4>
                <p className="text-[11px] text-brand-700 font-semibold mt-1">Income minus COGS expenses</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 13.4 Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
          <h3 className="text-3xl font-black text-brand-700 tracking-tight mt-2">
            {formatCurrency(kpis?.totalRevenue || 0)}
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Confirmed paid revenue</p>
        </div>

        {/* Paid Orders */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Orders</span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
            {kpis?.paidOrdersCount || 0}
          </h3>
          <p className="text-[11px] text-brand-600 font-semibold mt-1">Completed settlements</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Order Value (AOV)</span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
            {formatCurrency(kpis?.averageOrderValue || 0)}
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Average basket per paid order</p>
        </div>

        {/* Pending Revenue */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Revenue</span>
          <h3 className="text-3xl font-black text-coral-500 tracking-tight mt-2">
            {formatCurrency(kpis?.pendingRevenue || 0)}
          </h3>
          <p className="text-[11px] text-coral-600 font-semibold mt-1">Waiting for COD collection</p>
        </div>
      </div>

      {/* 13.5 Revenue Overview Chart & 13.8 Payment Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend Area (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-900">Revenue Trajectory</h3>
            <p className="text-xs text-slate-400">Weekly confirmed payments trend</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b6b55" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1b6b55" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(val) => [
                    `${CURRENCY_SYMBOL}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    'Revenue'
                  ]}
                  labelFormatter={(label, payload) => {
                    const fullDate = payload?.[0]?.payload?.fullDate;
                    return fullDate ? `${label} (${fullDate})` : label;
                  }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1b6b55" strokeWidth={3} fillOpacity={1} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 13.8 Payment Status Breakdown (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Payment Breakdown</h3>
            <p className="text-xs text-slate-400">Paid volume vs pending receivables</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={displayPieData.length > 1 ? 5 : 0}
                  dataKey="value"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [
                    name === 'No Orders'
                      ? `${CURRENCY_SYMBOL}0.00`
                      : `${CURRENCY_SYMBOL}${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
                <span>Paid Orders ({paymentStatusData?.paidPercentage ?? 0}%)</span>
              </span>
              <span className="font-bold text-slate-900">{formatCurrency(paymentStatusData?.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-coral-500"></span>
                <span>Pending Invoices ({paymentStatusData?.pendingPercentage ?? 0}%)</span>
              </span>
              <span className="font-bold text-coral-600">{formatCurrency(paymentStatusData?.pendingAmount || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 13.10 Pending Payments Section (Unpaid Orders with 1-click Mark as Paid) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Pending Receivables (Unpaid Orders)</h3>
            <p className="text-xs text-slate-400">
              When courier delivers COD or buyer pays, click "Mark as Paid" to instantly reconcile revenue.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            {pendingPayments?.length || 0} Pending Actions
          </span>
        </div>

        {pendingPayments && pendingPayments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {pendingPayments.map((o) => (
              <div key={o.orderId} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-700">{o.orderNumber}</span>
                    <span className="font-bold text-slate-900">• {o.customerName}</span>
                    <span className="text-slate-400">({o.customerPhone})</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Order Status: <span className="font-semibold text-slate-700">{o.status}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-sm text-slate-900">{formatCurrency(o.amount)}</span>
                  <button
                    onClick={() => handleMarkAsPaid(o.orderId)}
                    disabled={markingId === o.orderId}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {markingId === o.orderId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Mark as Paid</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span>All customer orders have been paid and reconciled! No pending balances.</span>
          </div>
        )}
      </div>

      {/* 13.7 Sales by Category & 13.9 Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-card border border-surface-border">
          <h3 className="font-bold text-base text-slate-900 mb-4">Sales by Category</h3>
          <div className="space-y-3">
            {(categoryData || []).map((cat, i) => (
              <div key={i} className="p-3 bg-surface-canvas rounded-2xl space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{cat.category}</span>
                  <span className="text-brand-700">{formatCurrency(cat.revenue)} ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-brand-600 h-full rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-card border border-surface-border">
          <h3 className="font-bold text-base text-slate-900 mb-4">Recent Transactions</h3>
          <div className="space-y-2.5">
            {(recentTransactions || []).slice(0, 5).map((tx) => (
              <div
                key={tx.orderId}
                onClick={() => navigate(`/orders?view=${tx.orderId}`)}
                className="p-3 rounded-2xl bg-surface-canvas hover:bg-slate-100 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{tx.orderNumber} • {tx.customerName}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">{formatCurrency(tx.amount)}</p>
                  <span className={`text-[10px] font-bold ${tx.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {tx.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

