const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../../config/db');
const { requireAdmin } = require('../../middleware/adminAuth');

// GET /api/admin/search?q=... - Global top-bar search
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        results: { merchants: [], orders: [], customers: [] }
      });
    }

    let users = [];
    let orders = [];
    let customers = [];

    if (isUsingFallback()) {
      users = memoryStore.users || [];
      orders = memoryStore.orders || [];
      customers = memoryStore.customers || [];
    } else {
      users = await query('SELECT id, business_name, name, email, phone, status, currency FROM users') || [];
      orders = await query('SELECT id, user_id, order_number, customer_name, customer_phone, total, payment_status, order_status, created_at FROM orders') || [];
      customers = await query('SELECT id, user_id, name, phone, email FROM customers') || [];
    }

    // Match merchants
    const matchedMerchants = users
      .filter(u =>
        u.business_name?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(u => ({
        id: u.id,
        title: u.business_name || u.name,
        subtitle: `${u.email} • ${u.phone || 'No phone'}`,
        status: u.status || 'active',
        type: 'merchant',
        link: `/admin/merchants/${u.id}`
      }));

    // Match orders
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const matchedOrders = orders
      .filter(o =>
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(o => {
        const m = userMap[o.user_id];
        return {
          id: o.id,
          title: `Order #${o.order_number} (${o.customer_name})`,
          subtitle: `${m?.business_name || 'Store'} • Total: ${m?.currency === 'BDT' ? '৳' : '$'}${o.total} • Status: ${o.order_status}`,
          type: 'order',
          link: `/admin/orders?search=${encodeURIComponent(o.order_number)}`
        };
      });

    // Match customers
    const matchedCustomers = customers
      .filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(c => {
        const m = userMap[c.user_id];
        return {
          id: c.id,
          title: `${c.name} (${c.phone})`,
          subtitle: `Customer of ${m?.business_name || 'Merchant'} • ${c.email || ''}`,
          type: 'customer',
          link: `/admin/merchants/${c.user_id}`
        };
      });

    res.json({
      success: true,
      results: {
        merchants: matchedMerchants,
        orders: matchedOrders,
        customers: matchedCustomers
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

