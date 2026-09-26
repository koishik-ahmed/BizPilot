const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/customers
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search = '' } = req.query;

    if (isUsingFallback()) {
      let list = memoryStore.customers.filter(c => c.user_id === userId);

      if (search) {
        const s = search.toLowerCase();
        list = list.filter(c => 
          c.name.toLowerCase().includes(s) ||
          c.phone.toLowerCase().includes(s) ||
          (c.email && c.email.toLowerCase().includes(s))
        );
      }

      list.sort((a, b) => b.total_spent - a.total_spent);
      return res.json({ success: true, count: list.length, customers: list });
    }

    let sql = 'SELECT * FROM customers WHERE user_id = ?';
    const params = [userId];

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY total_spent DESC';

    const customers = await query(sql, params);
    res.json({ success: true, count: customers.length, customers });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const customerId = parseInt(req.params.id);

    if (isUsingFallback()) {
      const customer = memoryStore.customers.find(c => c.id === customerId && c.user_id === userId);
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

      const orders = memoryStore.orders.filter(o => o.customer_id === customerId && o.user_id === userId);
      return res.json({ success: true, customer, orders });
    }

    const [customers] = await query('SELECT * FROM customers WHERE id = ? AND user_id = ?', [customerId, userId]);
    if (!customers) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const orders = await query('SELECT * FROM orders WHERE customer_id = ? AND user_id = ? ORDER BY created_at DESC', [customerId, userId]);

    res.json({ success: true, customer: customers, orders: orders || [] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

