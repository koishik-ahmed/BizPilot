const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../../config/db');
const { requireAdmin } = require('../../middleware/adminAuth');

// GET /api/admin/orders - Platform-Wide Read-Only Orders Browser
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      search = '',
      merchant_id = 'all',
      payment_status = 'all',
      order_status = 'all',
      currency = 'all'
    } = req.query;

    let orders = [];
    let users = [];

    if (isUsingFallback()) {
      orders = memoryStore.orders || [];
      users = memoryStore.users || [];
    } else {
      orders = await query('SELECT * FROM orders ORDER BY id DESC') || [];
      users = await query('SELECT id, business_name, name, email, phone, currency FROM users') || [];
    }

    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u;
    });

    let list = orders.map(o => {
      const merchant = userMap[o.user_id] || {
        id: o.user_id,
        business_name: 'Unknown Merchant',
        currency: 'USD'
      };

      return {
        ...o,
        merchant_name: merchant.business_name,
        merchant_email: merchant.email,
        currency: merchant.currency || 'USD'
      };
    });

    // Filters
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(o =>
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.toLowerCase().includes(q) ||
        o.merchant_name?.toLowerCase().includes(q)
      );
    }

    if (merchant_id !== 'all') {
      const mId = parseInt(merchant_id, 10);
      list = list.filter(o => o.user_id === mId);
    }

    if (payment_status !== 'all') {
      list = list.filter(o => o.payment_status?.toLowerCase() === payment_status.toLowerCase());
    }

    if (order_status !== 'all') {
      list = list.filter(o => o.order_status?.toLowerCase() === order_status.toLowerCase());
    }

    if (currency !== 'all') {
      list = list.filter(o => o.currency === currency);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      total: list.length,
      orders: list
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

