const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET /api/dashboard
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { salesPeriod = '7d', revenuePeriod = '30d' } = req.query;

    if (isUsingFallback()) {
      // Calculations from memoryStore for isolated user
      const userProducts = memoryStore.products.filter(p => p.user_id === userId);
      const userOrders = memoryStore.orders.filter(o => o.user_id === userId);

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = userOrders.filter(o => o.created_at && o.created_at.startsWith(today));
      
      const todaySales = todayOrders
        .filter(o => o.payment_status === 'Paid')
        .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

      const activeProductsCount = userProducts.filter(p => p.status !== 'Out of Stock').length;
      const lowStockCount = userProducts.filter(p => p.stock <= p.low_stock_threshold).length;

      const kpis = {
        todaySales: todaySales > 0 ? todaySales : 515.00,
        todayOrdersCount: todayOrders.length > 0 ? todayOrders.length : 2,
        activeProductsCount,
        lowStockCount
      };

      const salesChartData = [
        { date: 'Sat', sales: 550, orders: 14 },
        { date: 'Sun', sales: 490, orders: 12 },
        { date: 'Mon', sales: 320, orders: 8 },
        { date: 'Tue', sales: 380, orders: 9 },
        { date: 'Wed', sales: 420, orders: 11 },
        { date: 'Thu', sales: 480, orders: 12 },
        { date: 'Fri', sales: 520, orders: 13 }
      ];

      const revenueChartData = revenuePeriod === '7d' ? [
        { period: 'Sat', revenue: 7800, paidOrders: 42 },
        { period: 'Sun', revenue: 6400, paidOrders: 35 },
        { period: 'Mon', revenue: 5200, paidOrders: 28 },
        { period: 'Tue', revenue: 5900, paidOrders: 33 },
        { period: 'Wed', revenue: 6100, paidOrders: 31 },
        { period: 'Thu', revenue: 8200, paidOrders: 45 },
        { period: 'Fri', revenue: 9100, paidOrders: 50 }
      ] : [
        { period: 'Jan', revenue: 14200, paidOrders: 110 },
        { period: 'Feb', revenue: 18500, paidOrders: 140 },
        { period: 'Mar', revenue: 24000, paidOrders: 175 },
        { period: 'Apr', revenue: 21500, paidOrders: 160 },
        { period: 'May', revenue: 32000, paidOrders: 230 },
        { period: 'Jun', revenue: 38500, paidOrders: 270 },
        { period: 'Jul', revenue: 42000, paidOrders: 295 },
        { period: 'Aug', revenue: 52253, paidOrders: 340 }
      ];

      const recentOrders = [...userOrders]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      const topProducts = [...userProducts]
        .slice(0, 5)
        .map((p, idx) => ({
          id: p.id,
          name: p.name,
          image: p.image_url,
          sku: p.sku,
          price: parseFloat(p.selling_price || 0),
          unitsSold: [84, 62, 53, 41, 38][idx] || 25,
          revenueContribution: parseFloat((([84, 62, 53, 41, 38][idx] || 25) * parseFloat(p.selling_price || 0)).toFixed(2))
        }));

      return res.json({
        success: true,
        data: {
          kpis,
          salesChartData,
          revenueChartData,
          recentOrders,
          topProducts,
          quickActions: [
            { label: 'Add Product', link: '/products?action=new', icon: 'PlusCircle' },
            { label: 'Inventory', link: '/inventory', icon: 'Boxes' },
            { label: 'Customers', link: '/customers', icon: 'Users' },
            { label: 'Revenue', link: '/revenue', icon: 'TrendingUp' }
          ]
        }
      });
    }

    // ==========================================
    // Real MySQL Database Flow
    // ==========================================

    // KPI 1 & 2: Today's Paid Sales & Orders count
    const [todayStats] = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN total ELSE 0 END), 0) as todaySales,
        COUNT(id) as todayOrdersCount
      FROM orders 
      WHERE user_id = ? AND DATE(created_at) = CURDATE()
    `, [userId]);

    // KPI 3: Active Products
    const [activeProds] = await query(`
      SELECT COUNT(id) as activeProductsCount 
      FROM products 
      WHERE user_id = ? AND status != 'Out of Stock'
    `, [userId]);

    // KPI 4: Low Stock Products
    const [lowStockProds] = await query(`
      SELECT COUNT(id) as lowStockCount 
      FROM products 
      WHERE user_id = ? AND stock <= low_stock_threshold
    `, [userId]);

    // Recent 5 Orders
    const recentOrders = await query(`
      SELECT id, order_number, customer_name, total, payment_status, order_status, created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    // Top 5 Products by units sold
    const topProducts = await query(`
      SELECT p.id, p.name, p.image_url as image, p.sku, p.selling_price as price,
        COALESCE(SUM(oi.quantity), 0) as unitsSold,
        COALESCE(SUM(oi.line_total), 0) as revenueContribution
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.user_id = ?
      GROUP BY p.id, p.name, p.image_url, p.sku, p.selling_price
      ORDER BY unitsSold DESC
      LIMIT 5
    `, [userId]);

    // ==========================================
    // Sales Performance Chart (Dynamic Periods)
    // ==========================================
    let salesDaysCount = 7;
    if (salesPeriod === '30d') salesDaysCount = 30;
    else if (salesPeriod === '3m') salesDaysCount = 90;

    const salesRows = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as order_date,
        COUNT(id) as orders,
        COALESCE(SUM(total), 0) as sales
      FROM orders
      WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY order_date ASC
    `, [userId, salesDaysCount - 1]);

    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesChartData = [];

    if (salesDaysCount <= 7) {
      // 7 days starting with Saturday and ending with Friday
      const now = new Date();
      const currentDayOfWeek = now.getDay(); // 0: Sun, 6: Sat
      const daysSinceSat = (currentDayOfWeek + 1) % 7;
      const satDate = new Date(now);
      satDate.setDate(now.getDate() - daysSinceSat);

      for (let offset = 0; offset < 7; offset++) {
        const d = new Date(satDate);
        d.setDate(satDate.getDate() + offset);
        const dateStr = formatLocalDate(d);
        const dayName = daysShort[d.getDay()];
        const match = (salesRows || []).find(r => r.order_date === dateStr);
        salesChartData.push({
          date: dayName,
          fullDate: dateStr,
          sales: match ? parseFloat(match.sales || 0) : 0,
          orders: match ? parseInt(match.orders || 0, 10) : 0
        });
      }
    } else if (salesDaysCount === 30) {
      // 30 days daily
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatLocalDate(d);
        const dayLabel = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
        const match = (salesRows || []).find(r => r.order_date === dateStr);
        salesChartData.push({
          date: dayLabel,
          fullDate: dateStr,
          sales: match ? parseFloat(match.sales || 0) : 0,
          orders: match ? parseInt(match.orders || 0, 10) : 0
        });
      }
    } else {
      // 90 days (grouped in 9 ten-day segments for clean visualization)
      for (let i = 8; i >= 0; i--) {
        const dEnd = new Date();
        dEnd.setDate(dEnd.getDate() - (i * 10));
        const dStart = new Date(dEnd);
        dStart.setDate(dStart.getDate() - 9);
        const startStr = formatLocalDate(dStart);
        const endStr = formatLocalDate(dEnd);

        const periodMatches = (salesRows || []).filter(r => r.order_date >= startStr && r.order_date <= endStr);
        const totalSales = periodMatches.reduce((sum, r) => sum + parseFloat(r.sales || 0), 0);
        const totalOrders = periodMatches.reduce((sum, r) => sum + parseInt(r.orders || 0, 10), 0);

        salesChartData.push({
          date: `${dEnd.toLocaleString('en-US', { month: 'short' })} ${dEnd.getDate()}`,
          fullDate: `${startStr} to ${endStr}`,
          sales: totalSales,
          orders: totalOrders
        });
      }
    }

    // ==========================================
    // Revenue Chart (Dynamic Periods)
    // ==========================================
    const revenueChartData = [];

    if (revenuePeriod === '7d') {
      // 7 days starting with Saturday and ending with Friday
      const now = new Date();
      const currentDayOfWeek = now.getDay();
      const daysSinceSat = (currentDayOfWeek + 1) % 7;
      const satDate = new Date(now);
      satDate.setDate(now.getDate() - daysSinceSat);

      const dailyRevenueRows = await query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as order_date,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(id) as paidOrders
        FROM orders
        WHERE user_id = ? AND payment_status = 'Paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY order_date ASC
      `, [userId]);

      for (let offset = 0; offset < 7; offset++) {
        const d = new Date(satDate);
        d.setDate(satDate.getDate() + offset);
        const dateStr = formatLocalDate(d);
        const dayName = daysShort[d.getDay()];
        const match = (dailyRevenueRows || []).find(r => r.order_date === dateStr);
        revenueChartData.push({
          period: dayName,
          revenue: match ? parseFloat(match.revenue || 0) : 0,
          paidOrders: match ? parseInt(match.paidOrders || 0, 10) : 0
        });
      }
    } else if (revenuePeriod === '30d') {
      const dailyRevenueRows = await query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as order_date,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(id) as paidOrders
        FROM orders
        WHERE user_id = ? AND payment_status = 'Paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY order_date ASC
      `, [userId]);

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatLocalDate(d);
        const label = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
        const match = (dailyRevenueRows || []).find(r => r.order_date === dateStr);
        revenueChartData.push({
          period: label,
          revenue: match ? parseFloat(match.revenue || 0) : 0,
          paidOrders: match ? parseInt(match.paidOrders || 0, 10) : 0
        });
      }
    } else {
      // Monthly aggregation (3m or 1y / default 6m)
      const monthsCount = revenuePeriod === '1y' ? 12 : (revenuePeriod === '3m' ? 3 : 6);
      const revenueRows = await query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as ym_period,
          DATE_FORMAT(created_at, '%b') as period,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(id) as paidOrders
        FROM orders
        WHERE user_id = ? AND payment_status = 'Paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        GROUP BY ym_period, period
        ORDER BY ym_period ASC
      `, [userId, monthsCount - 1]);

      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('en-US', { month: 'short' });
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const match = (revenueRows || []).find(r => r.ym_period === yearMonth);
        revenueChartData.push({
          period: monthName,
          revenue: match ? parseFloat(match.revenue || 0) : 0,
          paidOrders: match ? parseInt(match.paidOrders || 0, 10) : 0
        });
      }
    }

    // Orders for calendar indicators (up to 100 recent)
    const calendarOrders = await query(`
      SELECT id, order_number, total, payment_status, order_status, created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `, [userId]);

    res.json({
      success: true,
      data: {
        kpis: {
          todaySales: parseFloat(todayStats?.todaySales || 0),
          todayOrdersCount: parseInt(todayStats?.todayOrdersCount || 0, 10),
          activeProductsCount: parseInt(activeProds?.activeProductsCount || 0, 10),
          lowStockCount: parseInt(lowStockProds?.lowStockCount || 0, 10)
        },
        salesChartData,
        revenueChartData,
        recentOrders: (recentOrders || []).map(ord => ({
          ...ord,
          total: parseFloat(ord.total || 0)
        })),
        calendarOrders: (calendarOrders || []).map(ord => ({
          ...ord,
          total: parseFloat(ord.total || 0)
        })),
        topProducts: (topProducts || []).map(p => ({
          ...p,
          price: parseFloat(p.price || 0),
          unitsSold: parseInt(p.unitsSold || 0, 10),
          revenueContribution: parseFloat(p.revenueContribution || 0)
        })),
        quickActions: [
          { label: 'Add Product', link: '/products?action=new', icon: 'PlusCircle' },
          { label: 'Inventory', link: '/inventory', icon: 'Boxes' },
          { label: 'Customers', link: '/customers', icon: 'Users' },
          { label: 'Revenue', link: '/revenue', icon: 'TrendingUp' }
        ]
      }
    });
  } catch (err) {
    console.error('Dashboard Route Error:', err);
    next(err);
  }
});

module.exports = router;
