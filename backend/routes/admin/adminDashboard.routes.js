const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../../config/db');
const { requireAdmin } = require('../../middleware/adminAuth');

// Helper to calculate start of day / week
function getStartOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/admin/dashboard/overview
router.get('/overview', requireAdmin, async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = getStartOfDay();
    const startOfWeek = getStartOfWeek();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    let users = [];
    let orders = [];
    let products = [];

    if (isUsingFallback()) {
      users = memoryStore.users || [];
      orders = memoryStore.orders || [];
      products = memoryStore.products || [];
    } else {
      users = await query('SELECT * FROM users') || [];
      orders = await query('SELECT * FROM orders') || [];
      products = await query('SELECT * FROM products') || [];
    }

    // 1. KPI Calculations
    const totalMerchants = users.length;
    const activeMerchantsCount = users.filter(u => (u.status || 'active') === 'active').length;
    const suspendedMerchantsCount = users.filter(u => u.status === 'suspended').length;

    const signupsToday = users.filter(u => new Date(u.created_at || now) >= startOfDay).length;
    const signupsThisWeek = users.filter(u => new Date(u.created_at || now) >= startOfWeek).length;

    const ordersToday = orders.filter(o => new Date(o.created_at || now) >= startOfDay);
    const totalOrdersTodayCount = ordersToday.length;

    // GMV Calculations by currency
    const gmvToday = {};
    const gmvThisMonth = {};
    const gmvAllTime = {};

    orders.forEach(order => {
      const orderDate = new Date(order.created_at || now);
      const user = users.find(u => u.id === order.user_id);
      const currency = user?.currency || 'USD';
      const amount = parseFloat(order.total) || 0;

      // All time
      gmvAllTime[currency] = (gmvAllTime[currency] || 0) + amount;

      // This month
      if (orderDate >= thirtyDaysAgo) {
        gmvThisMonth[currency] = (gmvThisMonth[currency] || 0) + amount;
      }

      // Today
      if (orderDate >= startOfDay) {
        gmvToday[currency] = (gmvToday[currency] || 0) + amount;
      }
    });

    // Active merchants in last 7 days (logged in or placed order)
    const merchantsWithRecentOrders = new Set(
      orders.filter(o => new Date(o.created_at || now) >= sevenDaysAgo).map(o => o.user_id)
    );
    const activeMerchants7d = users.filter(u => {
      const lastLogin = u.last_login_at ? new Date(u.last_login_at) : null;
      const recentLogin = lastLogin && lastLogin >= sevenDaysAgo;
      const recentOrder = merchantsWithRecentOrders.has(u.id);
      return recentLogin || recentOrder;
    }).length;

    // 2. "Needs Attention" Operational Issues
    const needsAttention = [];

    // Issue A: Merchants with 0 products after 7+ days (onboarding stuck)
    users.forEach(u => {
      const userCreated = new Date(u.created_at || now);
      const daysSinceSignup = Math.floor((now - userCreated) / 86400000);
      const userProductCount = products.filter(p => p.user_id === u.id).length;

      if (daysSinceSignup >= 7 && userProductCount === 0 && (u.status || 'active') === 'active') {
        needsAttention.push({
          id: `onboarding-stuck-${u.id}`,
          severity: 'high',
          type: 'onboarding_stuck',
          title: `Onboarding Stuck: ${u.business_name || u.name}`,
          description: `Registered ${daysSinceSignup} days ago but has created 0 products. Outreach recommended.`,
          merchant_id: u.id,
          merchant_name: u.business_name || u.name,
          email: u.email,
          phone: u.phone,
          action_label: 'Inspect Merchant'
        });
      }
    });

    // Issue B: Merchants whose last order was >30 days ago (churning)
    users.forEach(u => {
      if ((u.status || 'active') !== 'active') return;
      const userOrders = orders.filter(o => o.user_id === u.id);
      if (userOrders.length > 0) {
        const latestOrder = userOrders.reduce((latest, o) => {
          const d = new Date(o.created_at);
          return d > latest ? d : latest;
        }, new Date(0));

        const daysSinceLastOrder = Math.floor((now - latestOrder) / 86400000);
        if (daysSinceLastOrder > 30) {
          needsAttention.push({
            id: `churning-${u.id}`,
            severity: 'medium',
            type: 'churning_risk',
            title: `Churn Risk: ${u.business_name}`,
            description: `Last customer order was ${daysSinceLastOrder} days ago (${latestOrder.toLocaleDateString()}).`,
            merchant_id: u.id,
            merchant_name: u.business_name,
            email: u.email,
            phone: u.phone,
            action_label: 'View Store'
          });
        }
      }
    });

    // Issue C: Merchants whose stock is 0 across all products (business halted)
    users.forEach(u => {
      if ((u.status || 'active') !== 'active') return;
      const userProducts = products.filter(p => p.user_id === u.id);
      if (userProducts.length > 0) {
        const totalStock = userProducts.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
        if (totalStock === 0) {
          needsAttention.push({
            id: `zero-stock-${u.id}`,
            severity: 'critical',
            type: 'stock_depleted',
            title: `Zero Stock: ${u.business_name}`,
            description: `All ${userProducts.length} catalog items are at 0 stock. Sales are completely halted.`,
            merchant_id: u.id,
            merchant_name: u.business_name,
            email: u.email,
            phone: u.phone,
            action_label: 'Check Inventory'
          });
        }
      }
    });

    // Issue D: Suspended Accounts
    users.filter(u => u.status === 'suspended').forEach(u => {
      needsAttention.push({
        id: `suspended-${u.id}`,
        severity: 'warning',
        type: 'merchant_suspended',
        title: `Account Suspended: ${u.business_name}`,
        description: u.suspension_reason || 'Administrative hold applied.',
        merchant_id: u.id,
        merchant_name: u.business_name,
        email: u.email,
        phone: u.phone,
        action_label: 'Review Account'
      });
    });

    // 3. Top 10 Merchants by GMV this month
    const merchantGMVMap = {};
    users.forEach(u => {
      merchantGMVMap[u.id] = {
        id: u.id,
        business_name: u.business_name,
        owner_name: u.name,
        email: u.email,
        phone: u.phone,
        currency: u.currency || 'USD',
        status: u.status || 'active',
        total_orders: 0,
        gmv_this_month: 0,
        gmv_all_time: 0,
        products_count: products.filter(p => p.user_id === u.id).length
      };
    });

    orders.forEach(o => {
      if (merchantGMVMap[o.user_id]) {
        const orderDate = new Date(o.created_at || now);
        const amount = parseFloat(o.total) || 0;
        merchantGMVMap[o.user_id].total_orders += 1;
        merchantGMVMap[o.user_id].gmv_all_time += amount;
        if (orderDate >= thirtyDaysAgo) {
          merchantGMVMap[o.user_id].gmv_this_month += amount;
        }
      }
    });

    const topMerchants = Object.values(merchantGMVMap)
      .sort((a, b) => b.gmv_this_month - a.gmv_this_month)
      .slice(0, 10);

    // 4. Daily series for last 7 days chart
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const daySignups = users.filter(u => {
        const created = new Date(u.created_at || now);
        return created >= dayStart && created <= dayEnd;
      }).length;

      const dayOrders = orders.filter(o => {
        const created = new Date(o.created_at || now);
        return created >= dayStart && created <= dayEnd;
      });

      const dayGmvUSD = dayOrders
        .filter(o => users.find(u => u.id === o.user_id)?.currency === 'USD')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

      const dayGmvBDT = dayOrders
        .filter(o => users.find(u => u.id === o.user_id)?.currency === 'BDT')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

      dailyStats.push({
        date: dayLabel,
        signups: daySignups,
        orders: dayOrders.length,
        gmv_usd: dayGmvUSD,
        gmv_bdt: dayGmvBDT
      });
    }

    res.json({
      success: true,
      data: {
        kpis: {
          total_merchants: totalMerchants,
          active_merchants: activeMerchantsCount,
          suspended_merchants: suspendedMerchantsCount,
          signups_today: signupsToday,
          signups_this_week: signupsThisWeek,
          orders_today: totalOrdersTodayCount,
          active_merchants_7d: activeMerchants7d,
          gmv_today: gmvToday,
          gmv_month: gmvThisMonth,
          gmv_all_time: gmvAllTime,
          error_rate: '0.00%',
          health_status: 'healthy'
        },
        needs_attention: needsAttention,
        top_merchants: topMerchants,
        daily_stats: dailyStats
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

