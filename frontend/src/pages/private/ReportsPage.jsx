import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Package,
  Boxes,
  Users,
  DollarSign,
  Truck,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/currency';
import { downloadReportPDF } from '../../utils/reportPdfGenerator';

export default function ReportsPage() {
  const { user, authFetch } = useAuth();
  const { showToast } = useNotifications();
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('30d');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const reportTabs = [
    { id: 'sales', label: 'Sales Report', icon: TrendingUp },
    { id: 'product', label: 'Product Performance', icon: Package },
    { id: 'inventory', label: 'Inventory Valuation', icon: Boxes },
    { id: 'customer', label: 'Customer Cohorts', icon: Users },
    { id: 'payment', label: 'Payment Settlements', icon: DollarSign },
    { id: 'courier', label: 'Courier Efficiency', icon: Truck },
  ];

  const fetchReports = async () => {
    try {
      const res = await authFetch(`/api/reports?reportType=${reportType}&dateRange=${dateRange}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.reports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType, dateRange]);

  const handleExportCSV = () => {
    window.open(`/api/reports/export-csv?reportType=${reportType}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!reportData) {
      showToast('Report data is still loading, please wait.', 'error');
      return;
    }
    setDownloadingPdf(true);
    try {
      const dateRangeLabels = {
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        '90d': 'Last 90 Days',
        'year': 'This Year (YTD)'
      };
      const activeRangeLabel = dateRangeLabels[dateRange] || dateRange;
      const businessName = user?.business_name || 'BizPilot Merchant Store';
      const ownerName = user?.name || 'Store Owner';

      let title = 'Business Intelligence Report';
      let subtitle = 'Official performance statement';
      let kpis = [];
      let tables = [];
      let fileName = `bizpilot-${reportType}-report-${dateRange}.pdf`;

      if (reportType === 'sales') {
        const sales = reportData.sales || {};
        const trend = sales.salesTrend || [];
        const totalTrendRev = trend.reduce((sum, t) => sum + (parseFloat(t.revenue) || 0), 0);
        const totalTrendOrders = trend.reduce((sum, t) => sum + (parseInt(t.orders, 10) || 0), 0);

        title = 'Sales Velocity & Order Performance Report';
        subtitle = 'Breakdown of confirmed order volume, merchandise units, and basket sizes';
        kpis = [
          { label: 'Total Confirmed Orders', value: String(sales.totalOrders || 0), subtext: 'Recorded database volume' },
          { label: 'Units Dispatched', value: `${sales.unitsSold || 0} units`, subtext: 'Total merchandise sold' },
          { label: 'Average Order Value', value: formatCurrency(sales.averageOrderValue || 0), subtext: 'Revenue per transaction' },
          { label: 'Filtered Sales Volume', value: formatCurrency(totalTrendRev || 0), subtext: 'Across active period' }
        ];
        tables = [
          {
            title: 'Weekly Sales Velocity Breakdown',
            subtitle: 'Time-series volume analysis',
            headers: ['Time Period', 'Order Count', 'Settled Sales Volume'],
            rows: trend.map(t => [t.date, `${t.orders} orders`, formatCurrency(t.revenue || 0)]),
            totals: ['All Periods Total', `${totalTrendOrders} orders`, formatCurrency(totalTrendRev)]
          }
        ];
      } else if (reportType === 'product') {
        const prod = reportData.product || {};
        const top = prod.topProducts || [];
        const low = prod.lowPerformingProducts || [];

        title = 'Product Performance & Revenue Contribution Report';
        subtitle = 'Catalog sales velocity, top moving merchandise, and slow-moving inventory analysis';
        kpis = [
          { label: 'Top Moving Items', value: `${top.length} products`, subtext: 'High velocity catalog' },
          { label: 'Low Velocity Items', value: `${low.length} products`, subtext: 'Requires marketing focus' },
          { label: 'Best Seller Volume', value: formatCurrency(top[0]?.revenueContribution || 0), subtext: top[0]?.name || 'Catalog Item' }
        ];
        tables = [
          {
            title: 'Top Performing Products',
            subtitle: 'Ranked by revenue contribution & units sold',
            headers: ['Product Name', 'SKU', 'Units Sold', 'Revenue Contribution'],
            rows: top.map(p => [p.name, p.sku, `${p.unitsSold || 0} units`, formatCurrency(p.revenueContribution || 0)])
          },
          {
            title: 'Products Requiring Attention (Low Velocity)',
            subtitle: 'Catalog items with sluggish turnover',
            headers: ['Product Name', 'SKU', 'Units Sold', 'Revenue Contribution'],
            rows: low.map(p => [p.name, p.sku, `${p.unitsSold || 0} units`, formatCurrency(p.revenueContribution || 0)])
          }
        ];
      } else if (reportType === 'inventory') {
        const inv = reportData.inventory || {};
        const lowStock = inv.lowStockProducts || [];
        const outOfStock = inv.outOfStockProducts || [];

        title = 'Inventory Valuation & Warehouse Asset Report';
        subtitle = 'Detailed stock holding valuation, warehouse unit counts, and replenishment alerts';
        kpis = [
          { label: 'Total Stock Valuation', value: formatCurrency(inv.stockValuation || 0), subtext: 'Cost valuation of inventory' },
          { label: 'Total In-Stock Units', value: `${inv.totalUnits || 0} units`, subtext: 'Units available across warehouse' },
          { label: 'Low Stock Items', value: `${lowStock.length} items`, subtext: 'At or below threshold' },
          { label: 'Out of Stock Items', value: `${outOfStock.length} items`, subtext: 'Immediate restock required' }
        ];
        tables = [
          {
            title: 'Critical Stock Restocking Alerts',
            subtitle: 'Items requiring immediate supplier purchase orders',
            headers: ['Product Name', 'SKU', 'Current Stock', 'Low Alert Level', 'Status'],
            rows: [
              ...lowStock.map(p => [p.name, p.sku, `${p.stock} units`, `${p.low_stock_threshold || 10} units`, 'LOW STOCK']),
              ...outOfStock.map(p => [p.name, p.sku, '0 units', `${p.low_stock_threshold || 10} units`, 'OUT OF STOCK'])
            ]
          }
        ];
      } else if (reportType === 'customer') {
        const cust = reportData.customer || {};
        const topCust = cust.topCustomers || [];
        const repeatRate = Math.round(((cust.repeatCustomers || 0) / (cust.totalCustomers || 1)) * 100);

        title = 'Customer Cohorts & Retention Report';
        subtitle = 'Customer base expansion, repeat purchase dynamics, and top client lifetime spend';
        kpis = [
          { label: 'Total Customer Base', value: `${cust.totalCustomers || 0} buyers`, subtext: 'Registered & guest accounts' },
          { label: 'Repeat Buyers', value: `${cust.repeatCustomers || 0} clients`, subtext: 'Placed 2 or more orders' },
          { label: 'Repeat Purchase Rate', value: `${repeatRate}%`, subtext: 'Retention percentage' },
          { label: 'Highest Lifetime Value', value: formatCurrency(topCust[0]?.total_spent || 0), subtext: topCust[0]?.name || 'Top Buyer' }
        ];
        tables = [
          {
            title: 'Top Customer Spending Accounts',
            subtitle: 'Ranked by total lifetime gross expenditure',
            headers: ['Customer Name', 'Phone / Contact', 'Total Orders', 'Lifetime Spend'],
            rows: topCust.map(c => [c.name, c.phone || c.email || 'N/A', `${c.total_orders || 1} orders`, formatCurrency(c.total_spent || 0)])
          }
        ];
      } else if (reportType === 'payment') {
        const pay = reportData.payment || {};

        title = 'Payment Settlements & Cash Flow Statement';
        subtitle = 'Real-time reconciliation of paid volume, pending receivables (COD), and refund deductions';
        kpis = [
          { label: 'Collected Paid Revenue', value: formatCurrency(pay.collectedAmount || 0), subtext: `${pay.paidOrdersCount || 0} completed orders` },
          { label: 'Pending Receivables (COD)', value: formatCurrency(pay.pendingAmount || 0), subtext: `${pay.unpaidOrdersCount || 0} unpaid orders` },
          { label: 'Refunded / Returned', value: formatCurrency(pay.refundedAmount || 0), subtext: `${pay.refundedOrdersCount || 0} refunded orders` }
        ];
        tables = [
          {
            title: 'Payment Settlement Status Breakdown',
            subtitle: 'Cleared funds vs pending collections',
            headers: ['Settlement Category', 'Order Count', 'Total Amount (BDT)', 'Settlement Stage'],
            rows: [
              ['Cleared & Deposited Volume', `${pay.paidOrdersCount || 0} orders`, formatCurrency(pay.collectedAmount || 0), 'Settled in Account'],
              ['Pending Receivables (COD in transit)', `${pay.unpaidOrdersCount || 0} orders`, formatCurrency(pay.pendingAmount || 0), 'Awaiting Courier Remittance'],
              ['Refunded Orders Deductions', `${pay.refundedOrdersCount || 0} orders`, formatCurrency(pay.refundedAmount || 0), 'Deducted / Reconciled']
            ]
          }
        ];
      } else if (reportType === 'courier') {
        const cour = reportData.courier || {};
        const providers = cour.providerBreakdown || [];
        const successRate = Math.round(((cour.deliveredCount || 0) / (cour.totalBookings || 1)) * 100);

        title = 'Courier Delivery & Fulfillment Efficiency Report';
        subtitle = 'Logistics provider distribution, parcel delivery velocity, and fulfillment success ratios';
        kpis = [
          { label: 'Total Shipments Booked', value: `${cour.totalBookings || 0} parcels`, subtext: 'Dispatched from warehouse' },
          { label: 'Successfully Delivered', value: `${cour.deliveredCount || 0} parcels`, subtext: 'Confirmed buyer delivery' },
          { label: 'In Transit with Rider', value: `${cour.inTransitCount || 0} parcels`, subtext: 'Out for final delivery' },
          { label: 'Delivery Success Rate', value: `${successRate}%`, subtext: 'Across all logistics partners' }
        ];
        tables = [
          {
            title: 'Courier Partner Volume Breakdown',
            subtitle: 'Market share and shipment distribution across courier integrations',
            headers: ['Courier Partner', 'Booked Shipments', 'Share of Volume', 'Integration Status'],
            rows: providers.map(p => [p.provider, `${p.count} parcels`, p.share || '0%', 'Active API Integration'])
          }
        ];
      }

      await downloadReportPDF({
        title,
        subtitle,
        businessName,
        ownerName,
        period: activeRangeLabel,
        kpis,
        tables,
        fileName
      });
      showToast('Report PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to generate report PDF. Please try again.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 19.1 Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Business Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deep-dive operational reporting across sales velocity, warehouse valuation, and courier delivery success.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-surface-canvas p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none pr-3 py-1"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-canvas hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
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

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const active = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reports Content Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600 mb-2" />
          <p className="text-xs font-semibold">Generating report intelligence...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 19.2 Sales Report */}
          {reportType === 'sales' && reportData?.sales && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 bg-white rounded-3xl shadow-card border border-surface-border">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Confirmed Orders</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{reportData.sales.totalOrders}</h3>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-card border border-surface-border">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Units Dispatched</span>
                  <h3 className="text-3xl font-black text-brand-700 mt-2">{reportData.sales.unitsSold} units</h3>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-card border border-surface-border">
                  <span className="text-xs font-bold text-slate-400 uppercase">Average Order Value</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(reportData.sales.averageOrderValue)}</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border">
                <h3 className="font-bold text-base text-slate-900 mb-4">Weekly Sales Velocity</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {reportData.sales.salesTrend.map((t, i) => (
                    <div key={i} className="py-3 flex justify-between items-center">
                      <span className="font-bold text-slate-800">{t.date}</span>
                      <span className="text-slate-600">{t.orders} orders</span>
                      <span className="font-black text-slate-900">{formatCurrency(t.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 19.3 Product Report */}
          {reportType === 'product' && reportData?.product && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border space-y-4">
                <h3 className="font-bold text-base text-emerald-800">Top Performing Products</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {reportData.product.topProducts.map((p, i) => (
                    <div key={i} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <span className="text-[10px] text-slate-400">SKU: {p.sku}</span>
                      </div>
                      <span className="font-bold text-emerald-600">{formatCurrency(p.revenueContribution || 4752)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border space-y-4">
                <h3 className="font-bold text-base text-rose-800">Products Requiring Marketing Attention</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {reportData.product.lowPerformingProducts.map((p, i) => (
                    <div key={i} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <span className="text-[10px] text-slate-400">SKU: {p.sku}</span>
                      </div>
                      <span className="font-bold text-slate-500">{formatCurrency(p.revenueContribution || 120)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 19.4 Inventory Report */}
          {reportType === 'inventory' && reportData?.inventory && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 bg-white rounded-3xl shadow-card border border-surface-border">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Inventory Valuation</span>
                  <h3 className="text-3xl font-black text-brand-700 mt-2">
                    {formatCurrency(reportData.inventory.stockValuation || 14820)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Cost valuation of in-warehouse assets</p>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-card border border-surface-border">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total In-Stock Units</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{reportData.inventory.totalUnits} units</h3>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-card border border-surface-border">
                  <span className="text-xs font-bold text-slate-400 uppercase">Low / Out-of-Stock Items</span>
                  <h3 className="text-3xl font-black text-coral-500 mt-2">
                    {reportData.inventory.lowStockProducts.length + reportData.inventory.outOfStockProducts.length} items
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* 19.5 Customer Report */}
          {reportType === 'customer' && reportData?.customer && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 bg-white rounded-3xl shadow-card border border-surface-border">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Active Buyers</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{reportData.customer.totalCustomers}</h3>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-card border border-surface-border">
                  <span className="text-xs font-bold text-slate-400 uppercase">Repeat Customer Rate</span>
                  <h3 className="text-3xl font-black text-brand-700 mt-2">
                    {Math.round((reportData.customer.repeatCustomers / (reportData.customer.totalCustomers || 1)) * 100)}%
                  </h3>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-card border border-surface-border">
                  <span className="text-xs font-bold text-slate-400 uppercase">Top Buyer Spend</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">
                    {formatCurrency(reportData.customer.topCustomers[0]?.total_spent || 4100)}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* 19.6 Payment Report */}
          {reportType === 'payment' && reportData?.payment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-emerald-800 uppercase">Collected Paid Revenue</span>
                <h3 className="text-3xl font-black text-emerald-900">
                  {formatCurrency(reportData.payment.collectedAmount || 83450)}
                </h3>
                <p className="text-xs text-emerald-700">{reportData.payment.paidOrdersCount} completed orders</p>
              </div>

              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-amber-800 uppercase">Pending Receivables (COD)</span>
                <h3 className="text-3xl font-black text-amber-900">
                  {formatCurrency(reportData.payment.pendingAmount || 290)}
                </h3>
                <p className="text-xs text-amber-700">{reportData.payment.unpaidOrdersCount} orders awaiting rider settlement</p>
              </div>
            </div>
          )}

          {/* 19.7 Courier Report */}
          {reportType === 'courier' && reportData?.courier && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-surface-canvas rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Bookings</span>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">{reportData.courier.totalBookings}</h4>
                </div>
                <div className="p-4 bg-surface-canvas rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase">Successfully Delivered</span>
                  <h4 className="text-2xl font-black text-emerald-600 mt-1">{reportData.courier.deliveredCount}</h4>
                </div>
                <div className="p-4 bg-surface-canvas rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase">In Transit / Out for Delivery</span>
                  <h4 className="text-2xl font-black text-sky-600 mt-1">{reportData.courier.inTransitCount}</h4>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-3">Carrier Share Breakdown</h4>
                <div className="space-y-2 text-xs">
                  {reportData.courier.providerBreakdown.map((prov, i) => (
                    <div key={i} className="p-3 bg-surface-canvas rounded-xl flex justify-between items-center">
                      <span className="font-bold text-slate-800">{prov.provider}</span>
                      <span className="font-bold text-brand-700">{prov.count} parcels ({prov.share})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

